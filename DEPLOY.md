# Deployment runbook: ol-character.de

Production is a single Hetzner Cloud VM (Ubuntu, 2 vCPU / 4 GB, `178.104.37.74`) running three
containers via `docker-compose.prod.yml`: **caddy** (TLS, ports 80/443) -> **app** (Fastify, port
3000, internal only) -> **db** (MySQL 8.4, internal only). Code lives in `/opt/olchar/app`,
backups in `/opt/olchar/backups`, everything runs as the unprivileged `deploy` user.

DNS for `ol-character.de` and `www.ol-character.de` already points at the server; Caddy
issues Let's Encrypt certificates automatically on first start.

## 1. First-time server setup

1. As root on the fresh server, run the bootstrap (installs Docker, git, ufw, fail2ban,
   unattended-upgrades; creates the `deploy` user with root's SSH keys; clones the repo;
   installs the backup cron):
   ```bash
   curl -fsSL https://raw.githubusercontent.com/Tenshinzo/OL-CharacterSheet/main/deploy/bootstrap.sh | bash
   ```
2. Log in as `deploy` and create the environment file:
   ```bash
   ssh deploy@178.104.37.74
   cd /opt/olchar/app
   cp deploy/.env.production.example .env && chmod 600 .env
   nano .env   # fill every CHANGE-ME
   ```
   - `SECRET_KEY`: `openssl rand -base64 48`
   - `DB_PASSWORD` must equal `MYSQL_PASSWORD`; `MYSQL_ROOT_PASSWORD`: `openssl rand -base64 32`
   - `RESEND_API_KEY`, `MAIL_FROM=noreply@ol-character.de` (domain verified in Resend)
   - `ADMIN_EMAIL`: your e-mail; see step 4
   - `DISCORD_CLIENT_ID/SECRET` optional, see section 7
3. First deploy:
   ```bash
   bash deploy/deploy.sh
   ```
   It builds the image, starts the stack, waits up to 90 s for the health check and prints
   `docker compose ps`. Then open https://ol-character.de and https://ol-character.de/api/health.
4. Create the first admin. On startup the server creates (or promotes) the `ADMIN_EMAIL`
   account as a **passwordless, pre-verified admin**. Set its password with either:
   ```bash
   docker compose -f docker-compose.prod.yml exec app node src/cli.js reset-password <email> '<password>'
   ```
   or use the "forgot password" flow on the site once Resend mail delivery works.
   Further CLI commands: `node src/cli.js promote <email>`, `node src/cli.js invite [count]`.

## 2. GitHub secrets for automatic deploys

Create a dedicated SSH key for CI (on your machine or the server):
```bash
ssh-keygen -t ed25519 -f olchar_ci -C github-actions -N ''
cat olchar_ci.pub | ssh deploy@178.104.37.74 'cat >> ~/.ssh/authorized_keys'
```
Then in the GitHub repo **Settings -> Secrets and variables -> Actions** set:

| Secret            | Value                                              |
|-------------------|----------------------------------------------------|
| `DEPLOY_SSH_KEY`  | contents of the private key `olchar_ci`            |
| `DEPLOY_HOST`     | `178.104.37.74` (optional; this is the default)    |
| `DEPLOY_USER`     | `deploy` (optional; this is the default)           |

`DEPLOY_HOST`/`DEPLOY_USER` may also be set as repository *variables* instead of secrets.
Optionally create a `production` environment with required reviewers to gate deploys.

## 3. Release flow

- Every push / PR runs `.github/workflows/ci.yml` (lint, tests against MySQL 8.4, Docker build).
- A push to `main` runs `.github/workflows/deploy.yml`: job `check` (lint + test + docker build)
  then job `deploy`, which SSHes to the server and runs
  `bash /opt/olchar/app/deploy/deploy.sh <commit sha>`, then curls the public health endpoint.
- Deploys are serialized (`concurrency: deploy`); a second push waits for the first.
- Manual deploy of any ref: **Actions -> Deploy -> Run workflow** and enter a sha/tag.

`deploy.sh` does: `git fetch` + `git reset --hard <ref>` -> `docker compose build --pull app` ->
`docker compose up -d --remove-orphans` -> wait for `healthy` -> prune dangling images.
Database migrations run automatically when the app container starts (`server/migrations/*.sql`).

## 4. Rollback

```bash
ssh deploy@178.104.37.74
cd /opt/olchar/app
git log --oneline -10           # find the last good sha
bash deploy/deploy.sh <sha>
```
Migrations are forward-only; if a release added a migration that the previous code cannot
live with, restore a database backup from before the release as well (section 5).

## 5. Backups and restore

- `/etc/cron.d/olchar-backup` runs `deploy/backup.sh` nightly at 03:30 as `deploy`:
  `mysqldump --single-transaction` -> `/opt/olchar/backups/olchar-YYYY-MM-DD.sql.gz`, kept 14 days,
  log in `/opt/olchar/backups/backup.log`.
- Manual backup: `bash /opt/olchar/app/deploy/backup.sh`
- Restore (stops the app, replaces the DB content, starts the app again; asks for confirmation):
  ```bash
  bash /opt/olchar/app/deploy/restore.sh /opt/olchar/backups/olchar-2026-10-10.sql.gz
  ```
- Copy backups off the server regularly, e.g. `rsync -av deploy@178.104.37.74:/opt/olchar/backups/ ./olchar-backups/`.
  Hetzner server snapshots are a good additional safety net.

## 6. Operations cheat sheet

```bash
cd /opt/olchar/app
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app        # app logs (JSON, pino)
docker compose -f docker-compose.prod.yml logs -f caddy      # TLS / proxy
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml exec app node src/cli.js invite 5
docker compose -f docker-compose.prod.yml exec db mysql -uroot -p olchar
docker compose -f docker-compose.prod.yml pull db caddy && docker compose -f docker-compose.prod.yml up -d  # update base images
```
Changing `.env` requires `docker compose -f docker-compose.prod.yml up -d` (recreates app).
Changing `deploy/Caddyfile` requires `docker compose -f docker-compose.prod.yml restart caddy`
(or `exec caddy caddy reload --config /etc/caddy/Caddyfile`).

## 7. Discord OAuth

All API routes are mounted under `/api`, so the OAuth callback URL is

```
https://ol-character.de/api/auth/discord/callback
```

Register exactly this URL as a Redirect in the Discord Developer Portal (Application ->
OAuth2 -> Redirects), then set `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` in `.env` and
`docker compose -f docker-compose.prod.yml up -d`. The Discord login button is hidden while
the ID is empty.

## 8. Security notes

- Only ports 22/80/443 are open (ufw); MySQL and the app port are not published.
- `TRUST_PROXY=true` so cookies are `Secure` and client IPs (rate limiting) are read from
  Caddy's `X-Forwarded-For`. Caddy adds HSTS; the app adds `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`.
- The app container runs as the non-root `node` user; `.env` is `chmod 600` and never committed.
- Rotate `SECRET_KEY` only if compromised: it logs every user out and invalidates pending
  e-mail tokens.

## In-app bug reports (GitHub issues)

The user menu has "Bug report / feature request", which files a labelled issue in the repo through the server. It is hidden until the server has a token:

1. Create a fine-grained personal access token at https://github.com/settings/personal-access-tokens with access to `Tenshinzo/OL-CharacterSheet` and the repository permission **Issues: Read and write** (nothing else).
2. On the server add to `/opt/olchar/app/.env`:
   ```
   GITHUB_ISSUES_TOKEN=github_pat_...
   GITHUB_REPO=Tenshinzo/OL-CharacterSheet
   ```
3. Restart the app: `docker compose -f docker-compose.prod.yml up -d app`.

Issues get the labels `bug` or `enhancement` plus `from-app`, and the body includes reporter name/email, page, open character and browser (if the user left "include technical context" checked). Submissions are limited to 10 per user per hour.
