<script>
	import { DataTable } from "carbon-components-svelte";
	import moment from 'moment';
	import { address, crypto } from 'bitcoinjs-lib';
	import {
		electrumServerVersion,
		electrumServerBanner,
		electrumBlockchainBlockHeaders,
		electrumClient,
		electrumBlockchainBlockHeadersSubscribe,
		electrumBlockchainRelayfee,
		network,
		history,
		utxos
	} from './store.js';
	import { onDestroy, onMount } from 'svelte';
	import { ElectrumxClient } from '$lib/electrumx-client.js';
	
	let txs = []

	const getAddressTxs = async () => {

		const doi_address = "6TceYUFydmv9onXozrvttFjWD1QVULgp6y"
		const myAddresses = [doi_address]; // Add your addresses here
		let script = address.toOutputScript(doi_address, $network)
		let hash = crypto.sha256(script)
		let reversedHash = Buffer.from(hash.reverse())

		$history = await $electrumClient.request('blockchain.scripthash.get_history',[ reversedHash.toString("hex") ])
		$utxos = await $electrumClient.request('blockchain.scripthash.listunspent',[ reversedHash.toString("hex") ])

		for (const tx of $history) {
			const decryptedTx = await $electrumClient.request('blockchain.transaction.get',[tx.tx_hash,1])
			console.log("decrypted tx", decryptedTx)
			decryptedTx.id = decryptedTx.txid
			decryptedTx.value = 0
			txs = [...txs, decryptedTx];
			// let inputsBelongToMe = decryptedTx.vin.some(input => {
			// 	// if(!input.scriptSig)return false
			// 	let inputScript = address.fromOutputScript(input.script, $network);
			// 	return myAddresses.includes(inputScript);
			// });
			//
			// let outputsBelongToMe = decryptedTx.vout.some(output => {
			// 	console.log("output.script",output.script)
			// 	if(!output.script)return false
			// 	let outputScript = address.fromOutputScript(output.script, $network);
			// 	return myAddresses.includes(outputScript);
			// });

			// console.log("Sent Transaction:", inputsBelongToMe);
			// console.log("Received Transaction:", outputsBelongToMe);
			break;
		}

	}

	onMount(() => {

		const connectElectrum = async () => {

			$electrumClient = new ElectrumxClient('big-parrot-60.doi.works',50004,'wss')
			await $electrumClient.connect("electrum-client-js", "1.4.2")
			$electrumServerVersion = await $electrumClient.request('server.version')
			$electrumServerBanner =  await $electrumClient.request('server.banner')
			$electrumBlockchainBlockHeaders = await $electrumClient.request('blockchain.block.headers', [10000, 10]) //, [startHeight, count, cpHeight])
			$electrumBlockchainBlockHeadersSubscribe = await $electrumClient.request('blockchain.headers.subscribe')
			$electrumBlockchainRelayfee = await $electrumClient.request('blockchain.relayfee')

			await getAddressTxs()
		}
		connectElectrum()
	})

	onDestroy(()=>{
		$electrumClient?$electrumClient.close():null
	})

	$:console.log("txs",txs)
</script>

<h2>Transactions</h2>
<div class="margin">Electrum Server Version {$electrumServerVersion || 'not connected'}
	<br/>
 Electrum Server Banner  {$electrumServerBanner  || 'not connected'}</div>

<div class="margin">
	Tip: {$electrumBlockchainBlockHeadersSubscribe?.height}
</div>

<DataTable
	class="margin"
	headers={[
		{ key: "blocktime", value: "Time"},
		{ key: "txid", value: "TxId" },
		{ key: "value", value: "Amount" },
		{ key: "confirmations", value: "Confirmations" },
	]}
	rows={txs}>
	<svelte:fragment slot="cell" let:row let:cell>
		{#if cell.key === "blocktime"}
		{ moment.unix(cell.value).format('YYYY-MM-DD HH:mm:ss') }
		{:else}
		  {cell.value}
		{/if}
	  </svelte:fragment>
</DataTable>
<style>
   :global(.margin, h1, h2, h3, h4) {
			 margin-top: 20px;
			 margin-left: 20px;
    }
</style>