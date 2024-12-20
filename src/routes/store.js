import { writable } from 'svelte/store';

import { DOICHAIN, DOICHAIN_REGTEST } from '$lib/doichain.js';

const BITCOIN_MAINNET = {
		name: 'bitcoin-mainnet',
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
};

export const electrumServers = [
	{ network:'doichain-mainnet', host: 'big-parrot-60.doi.works', port: 50004, protocol: 'wss' },
	{ network:'doichain-mainnet', host: 'ugly-bird-70.doi.works', port: 50004, protocol: 'wss' },
	{ network:'doichain-mainnet', host: 'pink-deer-69.doi.works', port: 50004, protocol: 'wss' },
	{ network:'doichain-mainnet', host: 'itchy-jellyfish-89.doi.works', port: 50004, protocol: 'wss' },
	{ network:'doichain-regtest', host: 'localhost', port: 8443, protocol: 'wss' },
	{ network:'bitcoin-mainnet', host: 'btcpay.doi.works', port: 50004, protocol: 'wss' },
];

export const networks = [
	{ id: 'doichain-mainnet', text: 'Doichain-Mainnet', value: DOICHAIN },
	// { id: 'testnet', text: 'Testnet', value: DOICHAIN_TESTNET },
	{ id: 'doichain-regtest', text: 'Doichain-Regtest', value: DOICHAIN_REGTEST },
	{ id: 'bitcoin-mainnet', text: 'Bitcoin-Mainnet', value: BITCOIN_MAINNET }
];

export const helia = writable()
export const connectedPeers = writable(0);
export const scanOpen = writable(false)
export const scanData = writable()
export const qrCodeOpen = writable(false)
export const qrCodeData = writable()
export const network = writable(localStorage.getItem('network')?JSON.parse(localStorage.getItem('network')):DOICHAIN);
export const connectedServer = writable()
export const electrumClient = writable();
export const electrumServerVersion = writable();
export const electrumServerBanner = writable();
export const electrumBlockchainBlockHeadersSubscribe = writable()
export const electrumBlockchainRelayfee = writable();
// export const electrumBlockchainBlockHeaders = writable();
export const history = writable();
export const txs = writable([]);
export const balance = writable(0);
export const inputCount = writable(0);
export const outputCount = writable(0);
export const namesCount = writable(0);
export const currentWif = writable('');
export const currentAddress = writable('');
export const logs = writable([]);


