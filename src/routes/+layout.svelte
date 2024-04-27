<script>
	import {
		Column, Grid, Header,
		HeaderUtilities,
		HeaderAction,
		HeaderPanelLinks,
		HeaderPanelDivider,
		HeaderPanelLink,
		SkipToContent,
		Theme, Row, Dropdown
	} from 'carbon-components-svelte';
	import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";

	import { hash } from './router.js'
	import Home from './+page.svelte'
	import Transactions from './transactions.svelte'
	import { expoIn } from 'svelte/easing';
	import { DOICHAIN, DOICHAIN_TESTNET, DOICHAIN_REGTEST } from '$lib/doichain.js';

	let isOpen
	let sideNavOpen
	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"

	import { network } from './store.js';

	const networks = [
		{ id: 'doichain-mainnet', text: 'Doichain-Mainnet', value: DOICHAIN },
		// { id: 'testnet', text: 'Testnet', value: DOICHAIN_TESTNET },
		{ id: 'doichain-regtest', text: 'Doichain-Regtest', value: DOICHAIN_REGTEST }
	];

	const routes = {
		'/': Home,
		'': Home,
		'/transactions': Transactions
	}
	$: view = routes[$hash]
</script>

<Theme bind:theme persist persistKey="__carbon-theme" />
<Header company="Doichain" platformName="Developer Playground " bind:sideNavOpen href={ `#/` }>
	<div class="right-aligned">
		<div on:click={()=>document.location.href='https://github.com/silkroadnomad/DoichainPlaygroundSvelte'}>
			<LogoGithub  /></div>
		<div>
			<Dropdown
				size="sm"
				label="Select Network"	
				items={networks}
				selectedId={networks.find(n => n.value===$network).id }
				itemToString={(item) => item.text}
				on:select={e=>$network = networks.find(n=>n.id===e.detail.selectedId).value}
			/>
		</div>
	</div>
	<svelte:fragment slot="skip-to-content">
		<SkipToContent />
	</svelte:fragment>
	<HeaderUtilities>
		<HeaderAction bind:isOpen transition={{ duration: 600, delay: 50, easing: expoIn }}>
			<HeaderPanelLinks>
				<HeaderPanelDivider>Doichain</HeaderPanelDivider>
				<HeaderPanelLink href={ `#/` }>Mnemonics, Keys & Addresses</HeaderPanelLink>
				<HeaderPanelLink href={ `#/transactions` }>Transactions</HeaderPanelLink>

<!--				<HeaderPanelDivider>OrbitDB</HeaderPanelDivider>-->
<!--				<HeaderPanelLink  href={ `#/orbitdb/custom-access-controller` }>orbit-db custom access controller</HeaderPanelLink>-->
				<!--                <HeaderPanelLink  href={ `#/orbitdb/basic` }>orbit-db basic</HeaderPanelLink>-->
			</HeaderPanelLinks>
		</HeaderAction>
	</HeaderUtilities>
</Header>
<p>&nbsp;</p>
<Grid>
	<Row>
		<Column>&nbsp;<svelte:component this={ view } /></Column>
<!--		<Column>&nbsp;</Column>-->
<!--		<Column>&nbsp;</Column>-->
	</Row>
</Grid>

<style>
    .right-aligned {
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }

    .right-aligned > div {
        margin-left: 20px; /* Adjust the space between the elements */
    }
</style>

