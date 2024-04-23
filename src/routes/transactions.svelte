<script>
	import { DataTable } from "carbon-components-svelte";
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

	const getAddressTxs = async () => {
		const doi_address = "6TceYUFydmv9onXozrvttFjWD1QVULgp6y"
		const myAddresses = [doi_address]; // Add your addresses here
		let script = address.toOutputScript(doi_address, $network)
		let hash = crypto.sha256(script)
		let reversedHash = Buffer.from(hash.reverse())

		$history = await $electrumClient.request('blockchain.scripthash.get_history',[ reversedHash.toString("hex") ])
		$utxos = await $electrumClient.request('blockchain.scripthash.listunspent',[ reversedHash.toString("hex") ])
		for (const tx of $utxos) {
			const decryptedTx = await $electrumClient.request('blockchain.transaction.get',[tx.tx_hash,1])
			console.log("decrypted tx", decryptedTx)

			let inputsBelongToMe = decryptedTx.vin.some(input => {
				// if(!input.scriptSig)return false
				let inputScript = address.fromOutputScript(input.script, $network);
				return myAddresses.includes(inputScript);
			});

			let outputsBelongToMe = decryptedTx.vout.some(output => {
				console.log("output.script",output.script)
				if(!output.script)return false
				let outputScript = address.fromOutputScript(output.script, $network);
				return myAddresses.includes(outputScript);
			});

			console.log("Sent Transaction:", inputsBelongToMe);
			console.log("Received Transaction:", outputsBelongToMe);
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
</script>

<h2>Transactions</h2>
<h3>Electrum Server Version {$electrumServerVersion || 'not connected'}</h3>
<h3>Electrum Server Banner  {$electrumServerBanner  || 'not connected'}</h3>
<!--{$electrumBlockchainBlockHeaders.hex}-->

Tip: {$electrumBlockchainBlockHeadersSubscribe?.height}
<!--{$electrumBlockchainBlockHeadersSubscribe?.hex}-->
RelayFee: {$electrumBlockchainRelayfee}
<DataTable
	headers={[
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ]}
	rows={[
    {
      id: "a",
      name: "Load Balancer 3",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "b",
      name: "Load Balancer 1",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "c",
      name: "Load Balancer 2",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
    {
      id: "d",
      name: "Load Balancer 6",
      protocol: "HTTP",
      port: 3000,
      rule: "Round robin",
    },
    {
      id: "e",
      name: "Load Balancer 4",
      protocol: "HTTP",
      port: 443,
      rule: "Round robin",
    },
    {
      id: "f",
      name: "Load Balancer 5",
      protocol: "HTTP",
      port: 80,
      rule: "DNS delegation",
    },
  ]}
/>