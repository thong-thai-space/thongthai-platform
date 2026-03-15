#!/bin/sh
set -eu

TEMPLATE_FILE=/etc/nginx/templates/site.conf.template
TARGET_FILE=/etc/nginx/conf.d/default.conf

if [ -z "${DOMAIN:-}" ]; then
  echo "DOMAIN is required"
  exit 1
fi

envsubst '${DOMAIN}' < "$TEMPLATE_FILE" > "$TARGET_FILE"

exec nginx -g 'daemon off;'
