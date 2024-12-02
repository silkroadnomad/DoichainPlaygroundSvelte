<script>
	import "carbon-components-svelte/css/all.css";
	import {
		Button,
		Grid,
		Row,
		Column,
		TextInput
	} from 'carbon-components-svelte';
	import {
		scanOpen,
		qrCodeOpen,
		qrCodeData,
		network,
		electrumClient,
		scanData
	} from './store.js';
	import { QrCode, Scan } from 'carbon-icons-svelte';
	import { payments } from 'bitcoinjs-lib';
	import { getBalance } from '$lib/getBalance.js';

	let multiSigConfig = localStorage.getItem('multiSigConfig')?JSON.parse(localStorage.getItem('multiSigConfig')):undefined
	$: if($scanData) multiSigConfig = $scanData
	$: console.log("scanData",$scanData)

	console.log("multiSigConfig",multiSigConfig)
	$:walletName = multiSigConfig?.walletName
	$:walletAmounts =  multiSigConfig?.pubKeyInputs.length || 3;
	$:m = multiSigConfig?.m || 2;
	$:pubKeyInputs = multiSigConfig?.pubKeyInputs || Array.from({ length: walletAmounts }, (_, i) => ({
		i:i,
		label: `Wallet No ${i}`,
		pubKey: ''
	}));

	let allKeysValid 	= false
	let redeem;
	let multiSigAddress
	let balance

	$: { //this logic extends and reduces the amount wallet rows when ever the walletAmount changes.
		if (walletAmounts > pubKeyInputs.length) {
			const additionalInputs = Array.from({ length: walletAmounts - pubKeyInputs.length }, (_, i) => ({
				i: pubKeyInputs.length + i,
				label: `Wallet No ${pubKeyInputs.length + i}`,
				pubKey: ''
			}));
			pubKeyInputs = [...pubKeyInputs, ...additionalInputs];
		} else if (walletAmounts < pubKeyInputs.length) {
			pubKeyInputs = pubKeyInputs.slice(0, walletAmounts);
		}
	}

	$:	allKeysValid = pubKeyInputs.every(input => input.pubKey.trim() !== ''); //TODO check if this is a publicKey

	$: {
			const pubKeysArray = pubKeyInputs.map(input => input.pubKey);
			if(allKeysValid){
				try {
					const pubkeys = pubKeysArray.map(hex => Buffer.from(hex, 'hex'));
					const redeemObj = payments.p2ms({ m, pubkeys, network: $network })
					redeem = redeemObj?.output?.toString('hex')
					multiSigAddress = payments.p2sh({ redeem: redeemObj }).address
				}
				catch(e) {}
			}
	}

	$: getBalance(multiSigAddress, $electrumClient, $network).then(b => {
		balance = b
	})

</script>

<h1>Create New MultiSig Wallet</h1>
<Grid>
	<Row>
		<Column> <TextInput labelText="Wallet Name"bind:value={walletName} /></Column>
	</Row>
	<Row>
		<Column><TextInput type="number" labelText="Amount Wallets" min={1} max={16} bind:value={walletAmounts} /></Column>
		<Column><TextInput type="number" labelText="Required Signers" min={1} max={walletAmounts} bind:value={m} /></Column>
		<Column>
			<Button size="small" on:click={ () => {$scanOpen=true}}><Scan size={16}/></Button>
		</Column>
		<Column>
			{#if allKeysValid}
				<Button size="small" on:click={
					() => {
						multiSigConfig = {
							walletName,
							m,
							pubKeyInputs,
							redeem
						}
						const configString = JSON.stringify(multiSigConfig)
						localStorage.setItem("multiSigConfig",configString)
						$qrCodeData=configString
						$qrCodeOpen=true
					}
				}><QrCode size={16}/></Button>
			{/if}
		</Column>
	</Row>
	{#each pubKeyInputs as input, index}
		<Row>
			<Column>
				<TextInput labelText={"Label: "+input.label} bind:value={input.label} />
			</Column>
			<Column>
				<TextInput labelText={"PublicKey of "+input.label} bind:value={input.pubKey} />
			</Column>
		</Row>
	{/each}
	<Row>
		<Column> <TextInput labelText="Redeem Code" bind:value={redeem} /></Column>
	</Row>
	<Row>
		<Column><TextInput labelText="MultiSig Address" bind:value={multiSigAddress} /></Column>
		<Column><h5>Balance (confirmed): {balance?.confirmed || 0 }</h5></Column>
		<Column><h5>Balance (unconfirmed): {balance?.unconfirmed || 0}</h5></Column>
	</Row>
</Grid>