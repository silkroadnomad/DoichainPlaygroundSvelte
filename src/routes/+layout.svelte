<script>
	import { hash } from '../lib/router.js'
	import Home from './+page.svelte'
	import Transactions from './transactions.svelte'
	import { Column, Grid, OverflowMenu, OverflowMenuItem, Row, Theme } from 'carbon-components-svelte';
	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"
	const routes = {
		'/': Home,
		'': Home,
		'/transactions': Transactions
	}
	$: view = routes[$hash]
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
