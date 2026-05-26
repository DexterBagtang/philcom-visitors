#!/usr/bin/env bash
#
# generate-owasp-report.sh
# Parses ModSecurity audit log for the previous day and generates a markdown report.
# Intended to run daily via cron at midnight.
#
# Usage:
#   ./generate-owasp-report.sh              # Report for yesterday
#   ./generate-owasp-report.sh 2026-05-25   # Report for a specific date
#

set -euo pipefail

AUDIT_LOG="${MODSEC_AUDIT_LOG:-/var/log/modsec_audit.log}"
REPORT_DIR="/var/www/philcom-visitors/reports"

# Accept an optional date argument (YYYY-MM-DD), default to yesterday
if [[ $# -ge 1 ]]; then
    TARGET_DATE="$1"
else
    TARGET_DATE=$(date -d "yesterday" '+%Y-%m-%d')
fi

mkdir -p "$REPORT_DIR"

REPORT_FILE="${REPORT_DIR}/owasp-daily-${TARGET_DATE}.md"

if [[ ! -f "$AUDIT_LOG" ]]; then
    cat > "$REPORT_FILE" <<EOF
# OWASP CRS Daily Report — ${TARGET_DATE}

**Status:** No audit log found at \`${AUDIT_LOG}\`.
EOF
    echo "Report written to ${REPORT_FILE}"
    exit 0
fi

python3 "$(dirname "$0")/parse_modsec_log.py" "$AUDIT_LOG" "$TARGET_DATE" "$REPORT_FILE"

echo "Report written to ${REPORT_FILE}"
