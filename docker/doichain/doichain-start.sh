#!/usr/bin/env bash
_REGTEST=''
if [ $REGTEST = true ]; then
	_REGTEST='-conf=/home/doichain/.doichain/regtest/doichain.conf -regtest'
fi

_TESTNET=''
if [ $TESTNET = true ]; then
	_TESTNET='-conf=/home/doichain/.doichain/testnet/doichain.conf -testnet -addnode='$CONNECTION_NODE
fi
echo "starting doichaind $_REGTEST $_TESTNET"
doichaind $_REGTEST $_TESTNET -server -daemon

# Wait for doichain daemon to start (30 seconds)
echo "Waiting for doichain daemon to start..."
sleep 10

# Get new address and store it in a variable
ADDRESS=$(doichain-cli -regtest getnewaddress)
# Use the captured address to generate blocks
doichain-cli -regtest generatetoaddress 200 $ADDRESS

# Print the address
echo "New address: $ADDRESS"
# print wif key
echo "WIF key: $(doichain-cli -regtest dumpprivkey $ADDRESS)"
