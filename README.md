[![Vercel](https://vercelbadge.vercel.app/api/silkroadnomad/DoichainPlaygroundSvelte)](https://doichain-playground-svelte.vercel.app/)

# Doichain Playground Svelte

This is a reference and example on how to develop Doichain web apps with Svelte. 

# Usage:
1. Clone this repo
2. (optional for local development) Start local Doichaind & Electrumx  ```docker-compose up -d```
   - Connect to regtest container and 
   - a) run ```doichain-cli help``` (see command help)
   - b) run ```doichain-cli getblockchaininfo``` --> blocks 0
   - c) run ```doichain-cli getnewaddress``` --> our new address
   - d) run ```doichain-cli getbalance``` --> 0.00000000
   - e) run ```doichain-cli generatetoaddress 1 mp57b8GoPaLyJ6SXTj7zo9u44mTim1Y4Pe``` --> new block hash !
   - f) run ```doichain-cli getblock <block hash from last step>``` --> use tx (hash from output)
   - h) run ```doichain-cli gettransaction <tx has from last step>``` and see 50 DOI (immature needs another 100 blocks to become mature)
   - e) run ```doichain-cli generatetoaddress 100 mp57b8GoPaLyJ6SXTj7zo9u44mTim1Y4Pe``` --> make first block mature and get 50 DOI!
   - i) run ```doichain-cli getbalance``` --> 50.00000000
3. Run ```npm i```
4. Run ```npm run dev ``` to start Doichain Developer Playground
5. Go to "Transactions" Menu --> query your Doichain address from step 2.c 
6. Mark an unspent output (utxo) and send it to your own (or another) address
7. Create a new block and see transaction

## References:
- Cryptography-Toolkit https://guggero.github.io/cryptography-toolkit/#!/
  - Hierarchical Deterministic Wallet (BIP32/38/39/44/49/84) https://guggero.github.io/cryptography-toolkit/#!/hd-wallet
- Bitcoin-Improvement Proposals (bips) https://github.com/bitcoin/bips
- BitcoinJS-Lib https://github.com/bitcoinjs/bitcoinjs-lib
- Electrum Protocol https://electrumx.readthedocs.io/en/latest/protocol.html

## Todos:
- [x] add Dockerfile and docker-compose.yml with Doichain Node and ElectrumX
    - [x] generating Electrumx self signed server certificates on startup (for secure websocket in local development)
    - [x] adding a network dropdown (Doichain Mainnet / Doichain RegTest) to +layout.svelte
    - [x] connecting to RegTest Electrumx (Remark: doesn't work with Chrome - using self signed certificate! Use Firefox or add exception)
    - [ ] add nginx, letsencrypt and enable wss for Electrumx for production use
- [x] generate mnemonic
- [x] create xpriv and xpub from mnemonic 
- [x] generate new (legacy) p2pkh addressP2pkh from a derivation path 
- [x] generate a segwit addressP2pkh p2wpkh
  - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L57
- [x] generate a segwit addressP2pkh p2sh from p2wpkh  
  - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L66
- [ ] generate a P2WSH (SegWit), pay-to-multisig (3-of-4) addressP2pkh 
  - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L77
- [x] connect to Electrumx (which connects to Doichaind) via local Docker or remote url
  - [x] electrumx (DOI) support secure websockets
  - [x] connection via wss
  - [x] connect to local Electrumx (Docker compose) for developers
- [x] list txs of a wallet in a datatable component
  - [x] cache txs in IndexedDB 
  - [x] default sort txs by blocktime descending
  - [x] filter & paginator 
  - [x] display amount received (+) and sent (-)
    - [x] display outputs (utxos) as received
    - [x] display inputs as sent 
      - [x] find address in previous tx
    - [ ] double check addresses (received & sent)
    - [x] two txids appear twice (change txs) in txs, keep only one but accumulate values
  - [ ] display nameId, nameValue, address
- [x] display wallet balance 
  - [x] of a single address
  - [ ] of a xpub and it's derivations bip32, bip44, bip49,.. 
- [ ] create a simple coin (DOI) transaction 
  - [x] choose utxos from datatable 
  - [x] add an amount, address texfield
  - [x] storing, deleting, displaying mnemonics via IndexDB
  - [x] encryption and decryption of mnemonic via password 
  - [x] sign transaction by entering optional private key (wif)
  - [x] sign non-witness transactions (legacy)
  - [ ] sign witness transactions (segwit)
  - [ ] change address
    - [ ] send change back to same address
    - [ ] generate change address from derivation path 
  - [ ] calculate fee (and substract from utxos amount to be sent)
  - [ ] sign in Electrum (psbt)
  - [ ] sign by hardware wallet
- [ ] create name_doi, name_first, name_update transaction and store
  - a proof-of-existence
  - a Doichain-NFT
- [ ] spend from a multisig address
- [ ] automate spending from a multisig address
- [ ] research and test DoiWallet and ElectrumDoi seed phrases and keys

## Nice 2 have:
- [ ] progress bar or similar when loading many txs
- [ ] indexDB cache for transaction history and its txs 
- [ ] add xpub support for transaction list (full wallet balance and txs) 
- [x] choose current ElectrumX from random list
- [ ] deploy to IPFS
- [ ] choose from different derivation path standards (bip32, bip44, bip49, ...)
- [ ] test DoiWallet and ElectrumDoi seed phrases and keys
- [ ] use alternatively 24-words for seed phrases
- [ ] add a network dropdown (e.g. Bitcoin-Mainnet, Bitcoin-Testnet, Bitcoin-RegTest, Doichain,...)
- [ ] use a better entropy / random generator


