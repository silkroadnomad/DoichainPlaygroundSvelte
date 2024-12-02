#!/bin/bash
echo "starting Doichain RegTest ElectrumX server"

cd /electrumx/
sudo mkdir -p certs
cd certs
sudo openssl genrsa -out server.key 2048
sudo openssl req -new -key server.key -out server.csr -subj "/C=LI/ST=Liechtenstein/L=Schaan/O=Doichain Labs/OU=Developments/CN=localhost/emailAddress=ssl@doichain.org"
sudo openssl x509 -req -days 1825 -in server.csr -signkey server.key -out server.crt
cd ..
sudo chown -R electrumx:electrumx /electrumx/certs
export COIN=Doichain
export DB_DIRECTORY=/var/lib/electrumx
export DAEMON_URL=http://admin:adminpw@regtest:18332
export SERVICES=tcp://:50001,SSL://:50002,wss://:8443
export STRATUM_TCP_PORT=50001
export STRATUM_TCP_SSL_PORT=50002
export PEER_DISCOVERY=off
export NET=regtest
export SSL_CERTFILE=/electrumx/certs/server.crt
export SSL_KEYFILE=/electrumx/certs/server.key
export ALLOW_ROOT=non-empty
export LOG_LEVEL=debug
echo "starting electrumx server with services: $SERVICES"
#sleep 100000
./electrumx_server
