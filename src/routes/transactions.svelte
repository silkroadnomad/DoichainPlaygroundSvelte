<script>
	import { DataTable, TextInput } from 'carbon-components-svelte';
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
	import { ImmortalDB } from 'immortal-db';
	// localStorage.clear()
	let txs = []

	let doiAddress = "6TceYUFydmv9onXozrvttFjWD1QVULgp6y"
	const getAddressTxs = async () => {

		let script = address.toOutputScript(doiAddress, $network)
		let hash = crypto.sha256(script)
		let reversedHash = Buffer.from(hash.reverse()).toString("hex");

		// Attempt to fetch history from ImmortalDB cache
		let _history = await ImmortalDB.get(reversedHash + "_history");
		if (_history) {
			// Parse the cached JSON string back into an array
			$history = JSON.parse(_history);
		} else {
			// Fetch from the blockchain if not in cache
			$history = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash]);
			// Cache the fetched history
			await ImmortalDB.set(reversedHash + "_history", JSON.stringify($history));
		}

		// Similar logic for utxos and transactions
		for (const tx of $history) {
			let cachedTx = await ImmortalDB.get(tx.tx_hash);
			let decryptedTx;
			if (cachedTx) {
				decryptedTx = JSON.parse(cachedTx);
			} else {
				decryptedTx = await $electrumClient.request('blockchain.transaction.get', [tx.tx_hash, 1]);
				await ImmortalDB.set(tx.tx_hash, JSON.stringify(decryptedTx));
			}
			console.log("Decrypted tx:", decryptedTx);
			decryptedTx.id = decryptedTx.txid;
			decryptedTx.value = 0; // Update this as per your logic
			txs = [...txs, decryptedTx];
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
		// connectElectrum()
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

	<TextInput
		class="margin"
		labelText="Enter Doichain address and hit enter"
		bind:value={doiAddress}
		on:keydown={(event) => {
					if (event.key === 'Enter') {
							getAddressTxs();
					}
			}}
	/>
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