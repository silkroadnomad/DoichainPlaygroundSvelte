#!/bin/bash
set -euo pipefail
echo "starting doichain regtest: $REGTEST"
scripts/doichain-start.sh &

exec /bin/bash
