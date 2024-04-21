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
- [x] generate new p2pkh address from a derivation path (bip32/bip44)
- [ ] generate a segwit address- p2wpkh (bip49) https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L57
- [ ] generate a segwit address wallet - p2sh from p2wpkh (bip84) https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L66
- [ ] can generate a P2WSH (SegWit), pay-to-multisig (3-of-4) address https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L77
- [ ] research / look-up DoiWallet wallet standards and ElectumDoi wallet standard(s) 
- [ ] connect to electrumx (which connects to Doichaind)
- [ ] display balance
- [ ] create a simple coin (DOI) transaction 
- [ ] create name_doi, name_first, name_update transaction and store
  - a proof-of-existence
  - Doichain-NFTs
- [ ] create a multisig address
- [ ] spend from a multisig address
- [ ] automate spending from a multisig address

## Nice 2 have:
- [ ] test DoiWallet and ElectrumDoi seed phrases and keys
- [ ] use 24-words
- [ ] add a network dropdown (e.g. Bitcoin-Mainnet, Bitcoin-Testnet, Bitcoin-RegTest, Doichain,...)
- [ ] use a better entropy / random generator


