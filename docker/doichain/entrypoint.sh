#!/bin/bash
set -euo pipefail

_RPC_PORT=${RPC_PORT}
_NODE_PORT=${NODE_PORT}
_DAPP_URL=${DAPP_URL}
_REGTEST=0
_TESTNET=0
DOICHAIN_CONF_FILE=/home/doichain/data/doichain/doichain.conf
DOICHAIN_BASE_DIR="/home/doichain/data/doichain"
TESTNET_DIR="${DOICHAIN_BASE_DIR}/testnet"
REGTEST_DIR="${DOICHAIN_BASE_DIR}/regtest"

if [ $REGTEST = true ]; then
	_REGTEST=1
	_RPC_PORT=$RPC_PORT_REGTEST
  _NODE_PORT=$NODE_PORT_REGTEST

  if [ ! -d "$REGTEST_DIR" ]; then
    echo "Creating directory: ${REGTEST_DIR}/"
    mkdir -p "${REGTEST_DIR}/"
  fi
  DOICHAIN_CONF_FILE="${REGTEST_DIR}/doichain.conf"
fi

if [ $TESTNET = true ]; then
	_TESTNET=1
	_RPC_PORT=$RPC_PORT_TESTNET
  _NODE_PORT=$NODE_PORT_TESTNET

  if [ ! -d "$TESTNET_DIR" ]; then
    echo "Creating directory: ${TESTNET_DIR}/"
    mkdir -p "${TESTNET_DIR}/"
  fi

  DOICHAIN_CONF_FILE="${TESTNET_DIR}/doichain.conf"
fi

if [ -z ${RPC_USER} ]; then
	RPC_USER='admin'
	echo "RPC_USER was not set, using "$RPC_USER
fi

if [ -z ${RPC_PASSWORD} ]; then
	#echo "generating password"
	RPC_PASSWORD=$(xxd -l 30 -p /dev/urandom)
	echo "RPC_PASSWORD was not set, generated: "$RPC_PASSWORD
fi

if [ -z ${DAPP_URL} ]; then
	_DAPP_URL=$DAPP_URL
fi

if [ ! -f "$DOICHAIN_CONF_FILE" ]; then
echo "DOICHAIN_CONF_FILE not found - generating new!"
echo "
regtest=$_REGTEST
testnet=$_TESTNET
daemon=1
server=1
wallet=1
rpcuser=${RPC_USER}
rpcpassword=${RPC_PASSWORD}
rpcallowip=${RPC_ALLOW_IP}
txindex=1
fallbackfee=0.0002
namehistory=1
rpcworkqueue=100
blocknotify=curl -X GET ${DAPP_URL}/api/v1/blocknotify?block=%s
walletnotify=curl -X GET ${DAPP_URL}/api/v1/walletnotify?tx=%s

[test]
rpcport=${_RPC_PORT}
rpcbind=0.0.0.0
rpcallowip=0.0.0.0/0
wallet=1
port=${_NODE_PORT}

[regtest]
rpcport=${_RPC_PORT}
rpcbind=0.0.0.0
rpcallowip=0.0.0.0/0
wallet=1
port=${_NODE_PORT}" > $DOICHAIN_CONF_FILE
fi
echo "DOICHAIN_CONF_FILE: $DOICHAIN_CONF_FILE"
if [ -f "$DOICHAIN_CONF_FILE" ]; then
    echo "Config file exists and is a regular file"
    ls -la "$DOICHAIN_CONF_FILE"
else
    echo "WARNING: Config file does not exist at $DOICHAIN_CONF_FILE"
fi
# Only create symlink for testnet and regtest
if [ $REGTEST = true ]; then
    RELATIVE_PATH="regtest/doichain.conf"
    echo "Creating link to conf file with relative path: ${RELATIVE_PATH}"
    rm -f "${DOICHAIN_BASE_DIR}/doichain.conf"
    ln -s "${RELATIVE_PATH}" "${DOICHAIN_BASE_DIR}/doichain.conf"
elif [ $TESTNET = true ]; then
    RELATIVE_PATH="testnet/doichain.conf"
    echo "Creating link to conf file with relative path: ${RELATIVE_PATH}"
    rm -f "${DOICHAIN_BASE_DIR}/doichain.conf"
    ln -s "${RELATIVE_PATH}" "${DOICHAIN_BASE_DIR}/doichain.conf"
fi

exec "$@"
