import { writable } from 'svelte/store';

import { DOICHAIN } from '$lib/doichain.js'
export const network = writable(DOICHAIN);
export const electrumClient = writable();
export const electrumServerVersion = writable();
export const electrumServerBanner = writable();
export const electrumBlockchainBlockHeadersSubscribe = writable()
export const electrumBlockchainRelayfee = writable();
export const electrumBlockchainBlockHeaders = writable();
export const history = writable();
export const utxos = writable();


