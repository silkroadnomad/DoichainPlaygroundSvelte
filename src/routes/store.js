import { writable } from 'svelte/store';

export const electrumClient = writable();
export const electrumServerVersion = writable();
export const electrumServerBanner = writable();
export const electrumBlockchainBlockHeaders = writable()
