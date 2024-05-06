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
	import { network, networks,qrCodeOpen, qrCodeData } from './store.js';
	import { hash } from './router.js'
	import Home from './+page.svelte'
	import Transactions from './transactions.svelte'
	import NameOps from './nameOpUtxos.svelte'
	import { expoIn } from 'svelte/easing';
	import QRCodeModal from '$lib/components/QRCodeModal.svelte';

	let isOpen
	let sideNavOpen
	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"

	$:localStorage.setItem('network',JSON.stringify($network)	)

	const routes = {
		'/': Home,
		'': Home,
		'/transactions': Transactions,
		'/nameOpUtxos': NameOps
	}
	$: view = routes[$hash]
</script>

<Theme bind:theme persist persistKey="__carbon-theme" />
<QRCodeModal bind:qrCodeOpen={ $qrCodeOpen } bind:qrCodeData={ $qrCodeData } />
<!--<Modal bind:open={ $qrCodeOpen }-->
<!--			 modalHeading="Scan"-->
<!--			 primaryButtonText="OK"-->
<!--			 secondaryButtonText=""-->
<!--			 on:click:button&#45;&#45;primary={ () => dispatch('close') }-->
<!--			 on:click:button&#45;&#45;secondary={ () => dispatch('close') }-->
<!--			 on:close={()=>dispatch('close')}/>-->

<Header company="Doichain" platformName="Developer Playground " bind:sideNavOpen href={ `#/` }>
	<div class="right-aligned">
		<div on:click={()=>document.location.href='https://github.com/silkroadnomad/DoichainPlaygroundSvelte'}>
			<LogoGithub  /></div>
		<div>
			<Dropdown
				size="sm"
				label="Select Network"	
				items={networks}
				selectedId={ networks.find( n => n.value.name===$network.name).id}
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
				<HeaderPanelLink href={ `#/nameOpUtxos` }>Name Ops</HeaderPanelLink>

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

