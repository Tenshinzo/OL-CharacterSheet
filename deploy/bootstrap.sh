#!/usr/bin/env bash
# One-time server bootstrap for a fresh Ubuntu host. Run ONCE as root:
#   curl -fsSL https://raw.githubusercontent.com/Tenshinzo/OL-CharacterSheet/main/deploy/bootstrap.sh | bash
# or copy the file over and `bash bootstrap.sh`. Safe to re-run (idempotent).
set -euo pipefail

REPO_URL="https://github.com/Tenshinzo/OL-CharacterSheet.git"
BRANCH="main"
DEPLOY_USER="deploy"
BASE_DIR="/opt/olchar"
APP_DIR="$BASE_DIR/app"
BACKUP_DIR="$BASE_DIR/backups"

if [[ $EUID -ne 0 ]]; then
  echo "bootstrap.sh must run as root" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

log() { printf '\n==> %s\n' "$*"; }

log "Updating system packages"
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg git ufw fail2ban unattended-upgrades apt-listchanges

log "Installing Docker (official apt repository)"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
  fi
  . /etc/os-release
  CODENAME="${UBUNTU_CODENAME:-$VERSION_CODENAME}"
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  if ! apt-get update -y; then
    # Very new Ubuntu releases may not have a Docker repo yet; fall back to the latest LTS codename.
    echo "Docker repo for ${CODENAME} not available, falling back to noble" >&2
    sed -i "s/ ${CODENAME} / noble /" /etc/apt/sources.list.d/docker.list
    apt-get update -y
  fi
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker
docker --version
docker compose version

log "Enabling unattended security upgrades"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'CONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
CONF
systemctl enable --now unattended-upgrades

log "Enabling fail2ban (sshd jail)"
if [[ ! -f /etc/fail2ban/jail.local ]]; then
  cat > /etc/fail2ban/jail.local <<'CONF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
CONF
fi
systemctl enable --now fail2ban

log "Creating ${DEPLOY_USER} user"
if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --home-dir "/home/$DEPLOY_USER" --shell /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"
install -d -m 0700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
if [[ -f /root/.ssh/authorized_keys ]]; then
  touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
  # Append any root keys not yet present.
  while IFS= read -r key; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    grep -qxF "$key" "/home/$DEPLOY_USER/.ssh/authorized_keys" || echo "$key" >> "/home/$DEPLOY_USER/.ssh/authorized_keys"
  done < /root/.ssh/authorized_keys
  chmod 0600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
fi

log "Preparing ${BASE_DIR}"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$BASE_DIR" "$BACKUP_DIR"
chmod 0750 "$BACKUP_DIR"

log "Cloning repository"
if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo -u "$DEPLOY_USER" git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  echo "repository already present at $APP_DIR"
fi

log "Configuring firewall (ufw: 22, 80, 443)"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable
ufw status verbose

log "Installing nightly backup cron"
install -m 0644 -o root -g root "$APP_DIR/deploy/olchar-backup.cron" /etc/cron.d/olchar-backup
chmod +x "$APP_DIR"/deploy/*.sh || true

cat <<MSG

Bootstrap complete.

Next steps (as ${DEPLOY_USER}: ssh ${DEPLOY_USER}@$(hostname -I | awk '{print $1}')):
  1. cd ${APP_DIR}
  2. cp deploy/.env.production.example .env && chmod 600 .env
     Fill in every CHANGE-ME (SECRET_KEY: openssl rand -base64 48; DB passwords: openssl rand -base64 32).
  3. bash deploy/deploy.sh
  4. Check: docker compose -f docker-compose.prod.yml ps && docker compose -f docker-compose.prod.yml logs -f app
  5. Add the GitHub secrets DEPLOY_SSH_KEY / DEPLOY_HOST / DEPLOY_USER so pushes to main deploy automatically.
     Generate a dedicated key for CI: ssh-keygen -t ed25519 -f ~/.ssh/olchar_ci -C github-actions
     and append ~/.ssh/olchar_ci.pub to /home/${DEPLOY_USER}/.ssh/authorized_keys.
See DEPLOY.md for the full runbook.
MSG
