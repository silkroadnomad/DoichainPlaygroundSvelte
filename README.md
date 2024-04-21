# Doichain Playground Svelte

This is a reference and example on how to develop Doichain web apps with Svelte without the need of a server or dApp.

## References:
- Cryptography-Toolkit https://guggero.github.io/cryptography-toolkit/#!/
  - Hierarchical Deterministic Wallet (BIP32/38/39/44/49/84) https://guggero.github.io/cryptography-toolkit/#!/hd-wallet
- BitcoinJS-Lib https://github.com/bitcoinjs/bitcoinjs-lib

## Todos:
- [x] add Dockerfile and docker-compose.yml with Doichain Node and ElectrumX
- [x] generate mnemonic
- [x] create xpriv and xpub from mnemonic 
- [x] generate new (legacy) p2pkh addressP2pkh from a derivation path 
- [x] generate a segwit addressP2pkh p2wpkh
  - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L57
- [x] generate a segwit addressP2pkh p2sh from p2wpkh  
  - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L66
- [ ] generate a P2WSH (SegWit), pay-to-multisig (3-of-4) addressP2pkh 
  - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L77
- [ ] connect to Electrumx (which connects to Doichaind) via local Docker or remote url
- [ ] display balance
- [ ] create a simple coin (DOI) transaction 
- [ ] create name_doi, name_first, name_update transaction and store
  - a proof-of-existence
  - a Doichain-NFT
- [ ] create a multisig addressP2pkh
- [ ] spend from a multisig addressP2pkh
- [ ] automate spending from a multisig addressP2pkh

## Nice 2 have:
- [ ] use different derivation path standards (bip32, bip33, bip49, ...)
- [ ] test DoiWallet and ElectrumDoi seed phrases and keys
- [ ] use 24-words
- [ ] add a network dropdown (e.g. Bitcoin-Mainnet, Bitcoin-Testnet, Bitcoin-RegTest, Doichain,...)
- [ ] use a better entropy / random generator


