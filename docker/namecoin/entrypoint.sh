#!/bin/bash
set -euo pipefail
NAMECOIN_CONF_FILE=/home/namecoin/.namecoin/namecoin.conf
if [ ! -f "$NAMECOIN_CONF_FILE" ]; then
echo "NAMECOIN_CONF_FILE not found - generating new!"
echo "
regtest=0
testnet=0
daemon=1
server=1
wallet=1
rpcuser=admin
rpcpassword=adminpw
rpcbind=0.0.0.0
rpcallowip=0.0.0.0/0
txindex=1
namehistory=1

[test]
rpcport=8334
rpcbind=0.0.0.0
rpcallowip=0.0.0.0/0
wallet=1

[regtest]
rpcport=8334
rpcbind=0.0.0.0
rpcallowip=0.0.0.0/0
wallet=1" > $NAMECOIN_CONF_FILE
echo "$NAMECOIN_CONF_FILE"
fi
exec "$@"