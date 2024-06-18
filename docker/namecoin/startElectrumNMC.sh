 #!/bin/bash
cd certs
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -subj "/C=LI/ST=Liechtenstein/L=Schaan/O=Doichain Labs/OU=Developments/CN=localhost/emailAddress=ssl@doichain.org"
openssl x509 -req -days 1825 -in server.csr -signkey server.key -out server.crt
cd ..

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
fallbackfee=0.0002
namehistory=1
rpcworkqueue=100

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
fi

export COIN=Namecoin
export DB_DIRECTORY=/var/lib/electrumx
export DAEMON_URL=http://admin:adminpw@namecoin:8334
export SERVICES=tcp://:50001,SSL://:50002,wss://:8443
export STRATUM_TCP_PORT=50001
export STRATUM_TCP_SSL_PORT=50002
export PEER_DISCOVERY=off
export NET=regtest
export SSL_CERTFILE=/home/electrumx/certs/server.crt
export SSL_KEYFILE=/home/electrumx/certs/server.key
export ALLOW_ROOT=non-empty
export LOG_LEVEL=debug
./electrumx_server