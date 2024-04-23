# Doichain Playground Svelte

This is a reference and example on how to develop Doichain web apps with Svelte without the need of a server or dApp.

## References:
- Cryptography-Toolkit https://guggero.github.io/cryptography-toolkit/#!/
  - Hierarchical Deterministic Wallet (BIP32/38/39/44/49/84) https://guggero.github.io/cryptography-toolkit/#!/hd-wallet
- BitcoinJS-Lib https://github.com/bitcoinjs/bitcoinjs-lib
- Electrum Protocol https://electrumx.readthedocs.io/en/latest/protocol.html

## Todos:
- [x] add Dockerfile and docker-compose.yml with Doichain Node and ElectrumX
  - [ ] add nginx, letsencrypt and enable wss for electrumx
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
  - [ ] connect to local Electrumx (Docker compose) for developers
- [?] list transactions of a wallet in a datatable component
  - [x] cache transactions in IndexedDB 
  - [x] default sort transactions by blocktime descending
  - [x] filter & paginator 
  - [ ] display amount received (+) and sent (-)
    - [x] displaying all outputs as negative values
    - [ ] displaying all inputs as positive values
      - [ ] find address in previous tx
  - [ ] display nameId, nameValue, address
- [ ] display wallet balance 
  - of a single address
  - of a xpub and it's derivations bip32, bip44, bip49,.. 
- [ ] create a simple coin (DOI) transaction 
- [ ] create name_doi, name_first, name_update transaction and store
  - a proof-of-existence
  - a Doichain-NFT
- [ ] spend from a multisig address
- [ ] automate spending from a multisig address
- [ ] research and test DoiWallet and ElectrumDoi seed phrases and keys

## Nice 2 have:
- [ ] choose current ElectrumX from random list
- [ ] deploy to IPFS
- [ ] choose from different derivation path standards (bip32, bip44, bip49, ...)
- [ ] test DoiWallet and ElectrumDoi seed phrases and keys
- [ ] use alternatively 24-words for seed phrases
- [ ] add a network dropdown (e.g. Bitcoin-Mainnet, Bitcoin-Testnet, Bitcoin-RegTest, Doichain,...)
- [ ] use a better entropy / random generator


