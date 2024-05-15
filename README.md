[![Vercel](https://vercelbadge.vercel.app/api/silkroadnomad/DoichainPlaygroundSvelte)](https://doichain-playground-svelte.vercel.app/)

# Doichain Developer Playground Svelte

This repository serves as a reference and example for developing Doichain-connected web applications using Svelte. Doichain, a fork of Namecoin (which is itself a Bitcoin fork) created in 2018, supports merge mining with the Bitcoin blockchain.

We believe that a merge-mined blockchain, which utilizes the computational excess from Bitcoin mining to produce blocks, holds big value for storing transactions in a cost-effective and straightforward manner.

Doichain simplifies the process of storing, transferring, finding, displaying name-value pair transactions. Everytime it is doing so, it creates a non-fungible coin (NFC - just like NFTs) For example, the shell command:
```
doichain-cli name_doi ${name} ${value} [optional ${holder-address}]
```
clearly demonstrates this capability.

Consequently, Doichain makes it straightforward to store and transfer Doichain-NFTs (non-fungible-coins, somewhat similar to Bitcoin inscriptions) and various proofs of existence, positioning it as an ideal blockchain for emerging local-first, peer-to-peer applications that leverage technologies like libp2p, IPFS, and CRDTs such as OrbitDB.

This project aims to facilitate web application development for Doichain blockchain developers.

With the Doichain Playground you can:
- create seed phrases and Doichain wallets with javascript in browser (and NodeJS)
- make and send coin and name (Doichain-NFT & PoE) transactions via Electrumx
- create multisig addresses and multisig transactions
- store a non-fungible-coin (NFC) (Doichain-NFT)
- store other PoE (Proof-Of-Existence)
- query Doichain blockchain for balances and transactions (non-fungible-coins, Doichain-NFTs) and PoEs  

# Usage:
1. Clone this repo. 
2. Optionally for local development, start local Doichaind & Electrumx using ```docker-compose up -d.```
3. Connect to the regtest container and:
   - Run ```doichain-cli help``` to see command help.
   - Run ```doichain-cli getblockchaininfo``` to view initial blocks.
   - Run ```doichain-cli getnewaddress``` to generate a new address.
   - Run ```doichain-cli getbalance``` to check balance.
   - Run ```doichain-cli generatetoaddress 1 [address]``` to generate a new block.
   - Run ```doichain-cli getblock <block hash>``` to see transactions.
   - Run ```doichain-cli gettransaction <transaction hash>``` to view transaction details and note the DOI amount (immature, requiring another 100 blocks to mature).
   - Run ```doichain-cli generatetoaddress 100 [address]``` to mature the first block and receive 50 DOI.
   - Run ```doichain-cli getbalance``` to see updated balance. 
4. Run ```npm install```
5. Run npm run dev to start the Doichain Developer Playground. 
6. Go to the "Transactions" menu to query your Doichain address
7. Mark an unspent output (UTXO) and send it to another address  
8. Create a new block to observe the transaction.

## References:
- Crypto 101 is an introductory course on cryptography, freely available for programmers of all ages and skill levels. 
  - https://www.crypto101.io/
- BitcoinJS-Lib https://github.com/bitcoinjs/bitcoinjs-lib
- Electrum Protocol https://electrumx.readthedocs.io/en/latest/protocol.html
- Namecoin / ElectrumX Name Scripts https://www.namecoin.org/2018/07/15/electrumx-name-scripts.html
- Bitcoin-Improvement Proposals (bips) https://github.com/bitcoin/bips
- Learning Bitcoin https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line/tree/master
- Cryptography-Toolkit https://guggero.github.io/cryptography-toolkit/#!/
  - Hierarchical Deterministic Wallet (BIP32/38/39/44/49/84) https://guggero.github.io/cryptography-toolkit/#!/hd-wallet
- Ian Coleman https://iancoleman.io/


## Todos:
- [x] add Dockerfile and docker-compose.yml with Doichain Node and ElectrumX
    - [x] generating Electrumx self signed server certificates on startup (for secure websocket in local development)
    - [x] adding a network dropdown (Doichain Mainnet / Doichain RegTest) to +layout.svelte
    - [x] connecting to RegTest Electrumx (Remark: doesn't work with Chrome - using self signed certificate! Use Firefox or add exception)
    - [ ] add nginx, letsencrypt and enable wss for Electrumx for production use (testnet and mainnet)
      - [ ] install mainnet Electrumx on lower power numbers then 10000 (some hotels block higher port numbers e.g. 50002, 50004)
      - [ ] enable Electrumx peer-to-peer modus / setup seed nodes 
- [x] upgrade DoichainD to v0.27.0
  - [ ] test p2pool mining 
- [x] generate mnemonic
- [x] create xpriv and xpub from mnemonic 
- [x] generate new (legacy) p2pkh from a derivation path 
- [x] generate wif from a derivation path
- [x] generate a segwit p2wpkh
  - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/addresses.spec.ts#L57
- [x] generate a segwit p2sh from p2wpkh  
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
  - [x] display nameId, nameValue, address
- [x] display wallet balance 
  - [x] of a single address
  - [ ] of a xpub and it's derivations bip32, bip44, bip49,.. 
- [x] create a simple coin (DOI) transaction 
  - [x] choose utxos from datatable 
  - [x] add an amount, address textfield
  - [x] storing, deleting, displaying mnemonics via IndexDB
  - [x] encryption and decryption of mnemonic via password 
  - [x] sign transaction by entering optional private key (wif)
  - [x] sign non-witness transactions (legacy)
  - [x] sign witness transactions (segwit)
  - [x] calculate transaction fee by pre-signing the transaction 
  - [x] change address
    - [x] send change back to same address
    - [ ] generate change addresses from a derivation path 
  - [x] enter fee (and substract from utxos amount to be sent)
  - [x] sign transaction by wif (currently derived from mnemonic and wallet screen)
  - [x] sign transaction by seed phrase (from mnemonic dropdown)
  - [x] sign PSBT by scanning qr-code with DoiWallet (BlueWallet)
  - [x] sign PSBT file / qr code in Electrum-DOI 
  - [ ] sign by hardware wallet (and check PSBT)
    - [ ] Ledger https://developers.ledger.com/docs/connectivity/ledgerJS/integration-walkthrough/web-application/web-hid-usb
    - [ ] BitBox https://bitbox.swiss/blog/bitbox02-javascript-api/
    - [ ] Trezor
    - [ ] Seed Signer https://seedsigner.com/
- [x] create name_op transaction
  - [x] add storage fee to transaction fee calculation
  - [x] add nameId and nameValue to signing modal
  - [x] legacy name_op transactions
  - [ ] segwit name_op transactions (untested)
  - [x] index name_op transactions 
  - [x] show name op transactions in transaction list 
  - [ ] create name_show call [How is that done in electrum-nmc](https://github.com/namecoin/electrum-nmc/blob/b0f3af4a8ef64211fb27c21c6985352ecc8b9fdc/electrum_nmc/electrum/commands.py#L1447)
  - [ ] name_first, name_update transaction
  - [x] scan blockchain for name ops identify & categories
    - [ ] namespaces (e.g. did/ id/ d/, doi/, nfc/, libp2p/, jpg/, png/, s/)
- [x] scan/watch live for name ops
  - [x] scan backwards and display name_ops and collect namespaces
  - [ ] scan transactions of current mempoool
  - [ ] store found scan results in a orbitdb writable by all 
- [ ] create Doichain-NFT (NFC non-fungible-coin) example
  - [ ] scan blockchain backwards from now if nft/ found 
  - [ ] display media (png, jpg, etc.)
- [x] create a proof-of-existence example
  - [x] add file upload to utxo selction toolbar 
  - [x] generate sha256 hash and greate pe/{sha256} hash with it.
- [x] show min-relay fee in signing modal
- [ ] create libp2p seed node peer discovery (as an alternative for bootstrap and pubsub peer discovery)  
- [x] create multisig wallet
  - [x] support legacy wallets based on pubkeys 
  - [ ] support segwit and bip44 (like BlueWallet)
    - [ ] use xpub instead of normal pubkey
  - [ ] support Electrum wallets (legacy / segwit)
  - [x] show balance of multisig address 
  - [x] store multisig config (name, description, redeem code and public keys, wallet labels, publickeys in qr-code
    - [x] use bbqr - https://www.npmjs.com/package/bbqr
    - [x] scan multisig config from qr code
      - [ ] scan bbqr - since normal qr codes can't take all the data
    - [ ] store config inside ipfs using ipns? 
      - [ ] test is local ipfs content accessible to other browsers?
      - [ ] can Helia browser nodes connect via peer-to-peer public ipfs-network?
    - [ ] share xpubs via libp2p nodes only, when using same url-name (url-name as pubsub topic)
      - [ ] show connected nodes (amount / names?)
    - [ ] show last transactions of multisig address
    - [ ] DoiWallet (aka BlueWallet) can scan a multisig PSBT and produce a signed hex to scan a bbqr? 
      - [ ] https://github.com/BlueWallet/BlueWallet/issues/6557
    - [ ] repeat last transaction from multisig address
    - [ ] download multisig config as file
    - [ ] scan a publickey 
      - [ ] show error if publicKey is invalid 
    - [ ] scan mnemonic / try different BIPs (32/44/49/84), show balance, latetest derivation and new address / publickey for multisig
- [ ] spend from a multisig address
- [ ] automate spending from a multisig address
- [ ] research and test DoiWallet and Electrum-DOI seed phrases and keys
  - [x] DoiWallet can import Electrum-DOI seeds and shows correct addresses 
    - [x] test spending from DoiWallet with Electrum seed
  - [x] mnemonic: implement Electrum-Legacy support
    - [ ] generate change addresses (e.g. into second address colum)
  - [x] mnemonic: implement Electrum-Segwit support 
    - [x] implement bip32 support
    - [ ] generate change addresses 
  - [ ] implement bip44 support 
  - [ ] implement bip49 support
  - [ ] implement bip84 support
  
## Nice 2 have:
- [x] add Scanner https://github.com/peerpiper/qrcode-scanner-svelte
- [ ] mnemonic: expandable rows shows privkey, wif, pubKey of address
- [ ] mnemonic/transactions: use OrbitDB to store wallets, history
- [ ] Electrumx connection: retry up to 10 times, recover connection when changing network (e.g. switching wifi / vp network)
- [ ] transactions: amounts should toggle between DOI/schwartz (and store value in localhost default DOI)
- [ ] transaction signing: auto-select enough utxo's from the datatable depending on the amount to send
- [ ] transactions: indexDB cache for transaction history and its txs 
- [ ] app: deploy to IPFS
- [ ] mnemonic: use alternatively 24-words for seed phrases
- [ ] mnemonic: use a better entropy / random generator
- [x] scan QR-code modal when clicking on qr-code icon next to mnemonic, xpub, xpriv, wif, 
- [x] transactions: add xpub support for transaction list (full wallet balance and txs) 
- [x] transactions: show fees in datatable
- [x] mnemonic / transactions: show mnemonic screen selected legacy (or segwit?) address in transaction list
- [x] transaction signing: calculate fees depending on transaction size
- [x] transactions: progress bar or similar when loading many txs
- [x] mnemonic / transactions: choose current ElectrumX from random list
- [x] mnemonic: choose from different derivation path standards (electrum, bip32, bip44, bip49, ...)
- [x] mnemonic: test DoiWallet and ElectrumDoi seed phrases and keys
- [x] mnemonic: add network dropdown 
  - [x] add Bitcoin-Mainnet
- [x] transactions: expandable datatable rows with raw transaction details
- [x] transactions: display mempool transactions in transactions

## Bugs
- [ ] when generating mnemonic for Electrum it must be generated with another Electrum mnemonic generator otherwise it's not recognized as valid
- [ ] generated mnemonic with m/84'/0'/0' show different addresses then in DoiWallet
- [ ] better error messages and notifications
  - [ ] when changing derivation standard (e.g. with incompatible Electrum mnemonic)
  - [ ] when mnemonic could not be decrypted, loaded, saved, generated
- [ ] if no or wrong private key, transaction fee cannot be calculated? Could it be partially signed with a public-key instead? 
- [ ] when iterating over utxos, datatable doesn't update reactively (but counters are doing so)
- [ ] Chrome does not connect to local Electrum websocket with self signed ssl certificate - warning and fix needed 
- [ ] connecting a failing Electrumx node needs to try the next server and remove it from the current list
- [x] negative amounts (outflows) aren't utxos, they shouldn't be not selectable.
- [x] transactions: dc1qaflwqfck8tgq9uj7pq8de9zjfxekvqtkf57qv9 should show 7 transactions not just 1
- [x] auto selected mnemonic generates wrong address set - dropdown needs to re-select mnemonic then its corretc
- [x] when spending an utxo, for some reason it could be re-used (chosen by checkbox) for a new transaction and caused error when sending - re-read utxos  
  - [x] counter check with utxos coming live from Electrumx and exlude utxos not in ElectrumX 
- [x] ~~sending doiAmount to an address sents the fee instead of doiAmount~~
- [x] dc1qeefktgyshgm0hackjds55ry2l2936fw2uegw09 doesn't show any transactions or takes very long
- [x] changing network doesn't result in changing addresses in +page.svelte


