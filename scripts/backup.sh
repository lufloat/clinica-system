#!/usr/bin/env bash
#
# Backup do Postgres de produção.
#
# Instalação na VPS (roda todo dia às 3h):
#   chmod +x /opt/clinica-system/scripts/backup.sh
#   crontab -e
#   0 3 * * * /opt/clinica-system/scripts/backup.sh >> /var/log/clinica-backup.log 2>&1
#
# Restaurar um backup:
#   gunzip -c /opt/backups/clinica/clinica-2026-08-10.sql.gz \
#     | docker exec -i clinica-db-prod psql -U "$DB_USER" -d "$DB_NAME"

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/clinica}"
CONTAINER="${CONTAINER:-clinica-db-prod}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Lê DB_USER/DB_NAME do mesmo .env que a stack usa, sem exportar o resto.
set -a
# shellcheck source=/dev/null
source "$PROJECT_DIR/.env"
set +a

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y-%m-%d_%H%M)"
TARGET="$BACKUP_DIR/clinica-$STAMP.sql.gz"

# O pipe esconderia a falha do pg_dump e geraria um .gz válido e vazio, que
# só seria descoberto no dia do desastre. Por isso o dump vai para um
# temporário e só vira backup depois de terminar bem.
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$TMP"

if [ ! -s "$TMP" ]; then
    echo "[$(date -Is)] ERRO: dump vazio, backup abortado" >&2
    exit 1
fi

gzip -c "$TMP" > "$TARGET"

echo "[$(date -Is)] backup gerado: $TARGET ($(du -h "$TARGET" | cut -f1))"

# Descarta os antigos.
find "$BACKUP_DIR" -name 'clinica-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete

# ---------------------------------------------------------------------------
# IMPORTANTE: até aqui o backup está na MESMA máquina do banco. Se o disco da
# VPS falhar, perde-se os dois. Configure uma cópia externa — com o rclone
# apontando para um bucket ou Google Drive, é uma linha:
#
#   rclone copy "$TARGET" remoto:clinica-backups
# ---------------------------------------------------------------------------
