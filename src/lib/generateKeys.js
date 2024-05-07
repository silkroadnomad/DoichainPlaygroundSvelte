import { mnemonicToSeedSync } from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
const bip32 = BIP32Factory(ecc);

export function generateKeys(_mnemonic, _password, _network) {
	const seed = mnemonicToSeedSync(_mnemonic, _password);
	const root = bip32.fromSeed(seed, _network);
	const xpriv = root.toBase58();
	const xpub = root.neutered().toBase58();
	return {root,xpriv,xpub}
}