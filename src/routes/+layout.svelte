<script>
	import { onDestroy, onMount } from 'svelte';
	import { Column, Grid, OverflowMenu, OverflowMenuItem, Row, Theme } from 'carbon-components-svelte';
	import { hash } from './router.js'
	import { electrumClient,
		electrumServerVersion,
		electrumServerBanner,
		electrumBlockchainBlockHeaders } from './store.js'
	import Home from './+page.svelte'
	import Transactions from './transactions.svelte'
	import { ElectrumxClient } from '$lib/electrumx-client.js';

	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"
	const routes = {
		'/': Home,
		'': Home,
		'/transactions': Transactions
	}

	$: view = routes[$hash]

	const connect = async () => {
			$electrumClient = new ElectrumxClient('big-parrot-60.doi.works',50004,'wss')
			try {
					await $electrumClient.connect("electrum-client-js", "1.4.2")
					//https://github.com/CodeWarriorr/electrum-client-js/blob/master/src/electrum/client.js#L128
					$electrumServerVersion = await $electrumClient.request('server.version')
					$electrumServerBanner =  await $electrumClient.request('server.banner')
					$electrumBlockchainBlockHeaders = await $electrumClient.request('blockchain.block.headers', [10999, 1000]) //, [startHeight, count, cpHeight])
			} catch (err) {
				console.error(err);
			}
	}

	onMount(connect)
	onDestroy(()=>{
		$electrumClient?$electrumClient.close():null
	})
	$:console.log($electrumBlockchainBlockHeaders | ' headers loading')
</script>

<Theme bind:theme persist persistKey="__carbon-theme" />
<OverflowMenu>
	<OverflowMenuItem href="#/" text="Keys and Addresses" />
	<OverflowMenuItem href="#/transactions"  text="Transactions" />
</OverflowMenu>
<svelte:component this={ view } />
<Grid>
	<Row>
		<Column>&nbsp;</Column>
		<Column>&nbsp;</Column>
		<Column>&nbsp;</Column>
	</Row>
</Grid>
