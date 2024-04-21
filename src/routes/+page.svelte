<script>
	import "carbon-components-svelte/css/all.css";
	import { Theme, Button, TextArea, Grid, Row, Column, TextInput } from 'carbon-components-svelte';
	import { generateMnemonic, mnemonicToSeedSync } from 'bip39'
	import { payments } from 'bitcoinjs-lib';
	import * as ecc from 'tiny-secp256k1';
	import BIP32Factory from 'bip32';
	const bip32 = BIP32Factory(ecc);
	import { DOICHAIN } from '../lib/doichain.js'

	let network = DOICHAIN
	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"
	let mnemonic = ''
	let password = 'mnemonic'
	let root = ''
	let xpriv
	let xpub
	let derivationPath = 'm/0/0/0'

	let addressP2pkh;
	let addressP2wpkh;
	let addressP2wpkhP2Sh;

	/**
	 * Pay-to-Public-Key-Hash (P2PKH)
	 * @param _derivationPath
	 * @return addressP2pkh
	 */
	const p2pkh = (_derivationPath) =>
		addressP2pkh =  payments.p2pkh({ pubkey: root.derivePath(_derivationPath).publicKey, network }).address

	/**
	 * Segwit (p2sh)
	 * @param _derivationPath
	 * @return addressP2wpkhP2Sh
	 */
	const p2sh = (_derivationPath) =>
		addressP2wpkhP2Sh = payments.p2sh({ redeem: payments.p2wpkh({ pubkey: root.derivePath(_derivationPath).publicKey, network })}).address;

	/**
	 * Segwit (p2wpkh)
	 * @param _derivationPath
	 * @return addressP2wpkhP2Sh
	 */
	const p2wpkh = (_derivationPath) =>
		addressP2wpkh = payments.p2wpkh({ pubkey: root.derivePath(_derivationPath).publicKey, network }).address;

	/**
	 * Generate master seed root, xpriv and xpub
	 * @param _mnemonic
	 * @param _password
	 */
	const createKeys = async (_mnemonic,_password) => {
		const seed = mnemonicToSeedSync(_mnemonic,_password);
		root = bip32.fromSeed(seed,network);
		xpriv = root.toBase58();
		xpub = root.neutered().toBase58();

		p2pkh(derivationPath)
		p2wpkh(derivationPath)
		p2sh(derivationPath)
	}

	$:{
		try {
				createKeys(mnemonic,password)
				p2pkh(derivationPath)
				p2wpkh(derivationPath)
				p2sh(derivationPath)
		} catch (error) { }
	};

</script>

<Theme bind:theme persist persistKey="__carbon-theme" />
<h1>Welcome to Doichain Playground</h1>

<Grid>
	<Row>
		<Column>&nbsp;</Column>
		<Column>&nbsp;</Column>
		<Column>&nbsp;</Column>
	</Row>
	<Row>
		<Column><h2>1. Generate mnemonic for a new wallet </h2></Column>
		<Column><TextArea labelText="Mnemonic" rows={2} bind:value={mnemonic} class="formElement" /></Column>
		<Column><Button on:click={async () => {mnemonic = generateMnemonic()}} class="formElement" >Generate Mnemonic</Button></Column>
	</Row>
	<Row>
		<Column><h2>2. Get XPriv and XPub from mnemonic</h2></Column>
		<Column><TextInput labelText="Password" bind:value={password} class="formElement" /></Column>
	</Row>
	<Row>
		<Column><h3>xpriv (HD node root key) (base58)</h3></Column>
		<Column><h4>{xpriv || ''}</h4></Column>
	</Row>
	<Row>
		<Column><h3>xpub</h3></Column>
		<Column><h4>{xpub || ''}</h4></Column>
	</Row>
	<Row>
		<Column><h2>3. Deviate addressP2pkh from derivation path (bip32)</h2></Column>
		<Column><TextInput labelText="Derivation Path" bind:value={derivationPath}  class="formElement" /></Column>
	</Row>
	<Row>
		<Column><h3>Address (Legacy):</h3></Column>
		<Column><h4>{addressP2pkh || ''}</h4></Column>
	</Row>
	<Row>
		<Column><h3>Address (Segwit) :</h3></Column>
		<Column><h4>{addressP2wpkh || ''}</h4></Column>
	</Row>
	<Row>
		<Column><h3>Address (Segwit via P2SH) :</h3></Column>
		<Column><h4>{addressP2wpkhP2Sh || ''}</h4></Column>
	</Row>
</Grid>

<style>
    h1,h2,h3,h4 {
        margin-left: 20px;
        margin-top: 20px;
    }
</style>
