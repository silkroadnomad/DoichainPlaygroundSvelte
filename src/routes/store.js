import { writable } from 'svelte/store';

import { DOICHAIN, DOICHAIN_REGTEST } from '$lib/doichain.js';
export const networks = [
	{ id: 'doichain-mainnet', text: 'Doichain-Mainnet', value: DOICHAIN },
	// { id: 'testnet', text: 'Testnet', value: DOICHAIN_TESTNET },
	{ id: 'doichain-regtest', text: 'Doichain-Regtest', value: DOICHAIN_REGTEST }
];
export const network = writable(localStorage.getItem('network')?JSON.parse(localStorage.getItem('network')):DOICHAIN);
export const electrumClient = writable();
export const electrumServerVersion = writable();
export const electrumServerBanner = writable();
export const electrumBlockchainBlockHeadersSubscribe = writable()
export const electrumBlockchainRelayfee = writable();
export const electrumBlockchainBlockHeaders = writable();
export const history = writable();
export const txs = writable([]);
export const inputCount = writable(0);
export const outputCount = writable(0);


