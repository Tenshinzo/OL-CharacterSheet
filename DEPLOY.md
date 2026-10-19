# Deployment runbook: ol-character.de

Production is a single Hetzner Cloud VM (Ubuntu, 2 vCPU / 4 GB, `178.104.37.74`) running two
Compose stacks as the unprivileged `deploy` user:

- **proxy** (`deploy/docker-compose.proxy.yml`, project `olchar-proxy`): **caddy** (TLS, ports
  80/443). The only stack that publishes ports. It reaches the apps over the shared Docker
  network `olchar-proxy`.
- **app** (`docker-compose.prod.yml`, one per instance): **app** (Fastify, port 3000, internal
  only) -> **db** (MySQL 8.4, internal only). Production lives in `/opt/olchar/app` (Compose
  project `app`), the test system in `/opt/olchar-test/app` (project `olchar-test`, section 9).

Backups in `/opt/olchar/backups`. DNS for `ol-character.de`, `www.ol-character.de` and
`test.ol-character.de` points at the server; Caddy issues Let's Encrypt certificates
automatically on first start.

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
   It builds the image, creates the `olchar-proxy` network, starts the app stack and the proxy
   stack, waits up to 90 s for the health check and prints `docker compose ps`. Then open
   https://ol-character.de and https://ol-character.de/api/health.
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
- `.github/workflows/deploy.yml` runs job `check` (lint + test + docker build) and then job
  `deploy`, which SSHes to the server, runs `deploy/deploy.sh <commit sha>` in the instance
  directory and curls that instance's public health endpoint.
  - push to `main` -> **production** (`/opt/olchar/app`, https://ol-character.de)
  - manual run -> **test** by default (`/opt/olchar-test/app`, https://test.ol-character.de)
- Deploy a feature branch to test: **Actions -> Deploy -> Run workflow**, pick the branch under
  "Use workflow from", leave target `test`. The `check` job (lint, tests, build) runs for that
  branch first. Optionally enter a sha/tag instead of the branch head. There is no long-lived
  staging branch; test always shows whatever was deployed there last.
- Manual runs may also target `production`, e.g. to roll back to an older sha.
- Deploys are serialized per target (`concurrency: deploy-production` / `deploy-test`);
  production and test can deploy at the same time.

`deploy.sh` does: `git fetch` + `git reset --hard <ref>` -> `docker compose build --pull app` ->
`docker compose up -d --remove-orphans` -> (production only: `up -d` + `caddy reload` of the proxy
stack) -> wait for `healthy` -> prune dangling images.
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
docker compose -p olchar-proxy -f deploy/docker-compose.proxy.yml logs -f caddy   # TLS / proxy
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml exec app node src/cli.js invite 5
docker compose -f docker-compose.prod.yml exec db mysql -uroot -p olchar
docker compose -f docker-compose.prod.yml pull db && docker compose -f docker-compose.prod.yml up -d  # update MySQL image
docker compose -p olchar-proxy -f deploy/docker-compose.proxy.yml pull && docker compose -p olchar-proxy -f deploy/docker-compose.proxy.yml up -d  # update Caddy
```
Changing `.env` requires `docker compose -f docker-compose.prod.yml up -d` (recreates app).
Changing `deploy/Caddyfile` requires
`docker compose -p olchar-proxy -f deploy/docker-compose.proxy.yml exec caddy caddy reload --config /etc/caddy/Caddyfile`
(the production deploy does this automatically). The Caddyfile is always taken from the
**production** checkout, so Caddy changes ship via `main`.

For the test instance run the same commands in `/opt/olchar-test/app` (containers are named
`olchar-test-app-1` / `olchar-test-db-1`).

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

## 9. Test system (test.ol-character.de)

A second, fully separate instance (own containers, database, secrets) on the same VM, served
by the same Caddy. It is deployed manually from any branch or ref (section 3). Nothing is
shared with production except the host and the proxy, so test data can be wiped at will and
migrations can be tried before they hit `main`.

Why a second checkout: the pipeline has no image registry. `deploy.sh` fetches the ref into
the checkout on the server and builds the image there, exactly as production does in
`/opt/olchar/app`. The test checkout is simply that instance's working directory, holding its
own `.env`; which branch is checked out there changes with every test deploy.

One-time setup (production must already run the split proxy stack, i.e. a `main` with
`deploy/docker-compose.proxy.yml` has been deployed once):

1. DNS: A record `test.ol-character.de` -> `178.104.37.74`.
2. Second checkout as `deploy`:
   ```bash
   ssh deploy@178.104.37.74
   sudo install -d -o deploy -g deploy /opt/olchar-test     # or as root: mkdir + chown
   git clone https://github.com/Tenshinzo/OL-CharacterSheet.git /opt/olchar-test/app
   cd /opt/olchar-test/app
   cp deploy/.env.production.example .env && chmod 600 .env
   nano .env
   ```
   In `.env` set (see the comment block at the top of the example):
   - `COMPOSE_PROJECT_NAME=olchar-test`, `PROXY_ALIAS=olchar-test-app`, `APP_IMAGE=olchar-test-app`
   - `APP_URL=https://test.ol-character.de`
   - fresh `SECRET_KEY`, `DB_PASSWORD`/`MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`
   - `GITHUB_ISSUES_TOKEN=` empty, so test reports do not become real issues
   - `DISCORD_CLIENT_ID/SECRET` empty, or a separate Discord application whose redirect is
     `https://test.ol-character.de/api/auth/discord/callback`
   - `RESEND_API_KEY`/`MAIL_FROM` can be the production values (same verified domain), or leave
     the key empty to have mails logged to stdout only
3. First deploy and admin password:
   ```bash
   APP_DIR=/opt/olchar-test/app WITH_PROXY=0 bash deploy/deploy.sh origin/main
   docker compose -f docker-compose.prod.yml exec app node src/cli.js reset-password <email> '<password>'
   ```
   Caddy already knows the `test.ol-character.de` block and requests the certificate on the
   first request. Check https://test.ol-character.de/api/health.
4. Optionally create a `test` environment under **Settings -> Environments**. The workflow
   reuses the production SSH key and deploy user. From now on deploy feature branches via
   **Actions -> Deploy -> Run workflow** (section 3).

Notes:
- `WITH_PROXY=0` keeps the test deploy from touching Caddy; only production manages the proxy.
- The nightly backup cron covers production only. For a one-off test dump:
  `APP_DIR=/opt/olchar-test/app BACKUP_DIR=/opt/olchar-test/backups bash deploy/backup.sh`.
- Reset the test database: `cd /opt/olchar-test/app && docker compose -f docker-compose.prod.yml down -v`
  followed by a deploy (`-v` deletes the `olchar-test_dbdata` volume). Needed when switching
  between feature branches whose migrations conflict: migrations are forward-only.
- Test responses carry `X-Robots-Tag: noindex, nofollow`.
- Memory: a second MySQL costs roughly 400 MB; the 4 GB VM has room for it.

### Migrating an existing single-stack production to the split proxy

The first `main` deploy containing this change does it on its own: `docker compose up -d
--remove-orphans` removes the old `app-caddy-1` container (Caddy is no longer part of
`docker-compose.prod.yml`), then `deploy.sh` starts the proxy stack, which reuses the existing
`app_caddy_data` volume and therefore the existing certificates. Expect a few seconds of
downtime while Caddy restarts. If anything goes wrong:
`docker compose -p olchar-proxy -f deploy/docker-compose.proxy.yml up -d` from `/opt/olchar/app`.

## 10. In-app bug reports (GitHub issues)

The user menu has "Bug report / feature request", which files a labelled issue in the repo through the server. It is hidden until the server has a token:

1. Create a fine-grained personal access token at https://github.com/settings/personal-access-tokens with access to `Tenshinzo/OL-CharacterSheet` and the repository permission **Issues: Read and write** (nothing else).
2. On the server add to `/opt/olchar/app/.env`:
   ```
   GITHUB_ISSUES_TOKEN=github_pat_...
   GITHUB_REPO=Tenshinzo/OL-CharacterSheet
   ```
3. Restart the app: `docker compose -f docker-compose.prod.yml up -d app`.

Issues get the labels `bug` or `enhancement` plus `from-app`, and the body includes reporter name/email, page, open character and browser (if the user left "include technical context" checked). Submissions are limited to 10 per user per hour.
