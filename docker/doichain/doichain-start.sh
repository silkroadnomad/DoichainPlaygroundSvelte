#!/usr/bin/env bash
_REGTEST=''
if [ $REGTEST = true ]; then
	_REGTEST='-regtest'
	rm -rf .doichain/regtest
	rm .doichain/doichain.conf
	echo "old regtest folder removed"
fi

_TESTNET=''
if [ $TESTNET = true ]; then
	_TESTNET='-testnet -addnode='$CONNECTION_NODE
fi
echo "starting doichaind $_REGTEST $_TESTNET"
doichaind $_REGTEST $_TESTNET -server -daemon

# Wait for doichain daemon to start (30 seconds)
echo "Waiting for doichain daemon to start..."
sleep 5
doichain-cli $_REGTEST $_TESTNET createwallet "wallet"
# Get new address and store it in a variable
ADDRESS=$(doichain-cli $_REGTEST $_TESTNET getnewaddress)
# Use the captured address to generate blocks
doichain-cli $_REGTEST $_TESTNET generatetoaddress 200 $ADDRESS

# Print the address
echo "New address: $ADDRESS"
# print wif key
echo "WIF key: $(doichain-cli $_REGTEST $_TESTNET dumpprivkey $ADDRESS)"
