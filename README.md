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
- [x] create new p2pkh address from a derivation path (bip32/bip44)
- [ ] create a segwit address wallet - p2wpkh (bip49)
- [ ] create a segwit address wallet - p2sh from p2wpkh (bip84)
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
- [ ] use a better random generator
- [ ] add network dropdown Mainnet, Testnet, RegTest


