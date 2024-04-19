<script>
	import "carbon-components-svelte/css/all.css";
	import { Theme, Button, TextArea, Grid, Row, Column, TextInput } from 'carbon-components-svelte';
	import { generateMnemonic, mnemonicToSeedSync } from 'bip39'
	import HDKey from 'hdkey';
	import { DOICHAIN } from '../lib/doichain.js'
	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"
	let mnemonic
	let password = 'mnemonic'
	let masterSeed
	let hdKey
</script>

<Theme bind:theme persist persistKey="__carbon-theme" />
<h1>Welcome to Doichain Playground</h1>

<Grid>
	<Row>
		<Column><h2>1. Create a new mnemonic for a new hd wallet </h2></Column>
		<Column><Button on:click={async () => {mnemonic = generateMnemonic()}} class="formElement" >Create Mnemonic</Button></Column>
		<Column><TextArea labelText="Mnemonic" rows={2} value={mnemonic} class="formElement" /></Column>
		<Column>&nbsp;</Column>
	</Row>
	<Row>
		<Column sm={1} md={4} lg={8}><h2>2. Create a new HDKey from mnemonic</h2></Column>
		<Column sm={1} md={4} lg={8}><TextInput labelText="Password" value={password} class="formElement" /></Column>
		<Column sm={1} md={4} lg={8}><Button on:click={async () => {
			masterSeed = mnemonicToSeedSync(mnemonic, password ? password : "mnemonic").toString("hex")
    	hdKey = HDKey.fromMasterSeed(Buffer.from(masterSeed, "hex"), DOICHAIN.bip32)
    	console.log("hdKey._privateKey",hdKey._privateKey.toString('hex'))
    	console.log("hdKey._publicKey",hdKey._publicKey.toString('hex'))
		}} class="formElement" >Create HDKey from Mnemonic</Button></Column>

		<Column sm={1} md={4} lg={8}>&nbsp;</Column>
	</Row>
	<Row>
		<Column sm={2} md={8} lg={16}><h3>MasterSeed</h3></Column>
		<Column sm={2} md={8} lg={16}><h4>{masterSeed}</h4></Column>
	</Row>
	<Row>
		<Column sm={2} md={8} lg={16}><h3>HD-PrivateKey</h3></Column>
		<Column sm={2} md={8} lg={16}><h4>{hdKey?._privateKey?.toString('hex')}</h4></Column>
	</Row>
	<Row>
		<Column sm={2} md={8} lg={16}><h3>HD-PublicKey</h3></Column>
		<Column sm={2} md={8} lg={16}><h4>{hdKey?._publicKey?.toString('hex')}</h4></Column>
	</Row>
</Grid>
<style>
    h1,h2,h3,h4 {
        margin-left: 20px;
        margin-top: 20px;
    }
	:global(.formElement) {
        margin-left: 20px;
        margin-top: 20px;
    }
</style>
