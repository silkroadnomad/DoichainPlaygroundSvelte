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

	import { createHelia, libp2pDefaults } from 'helia'
	import { createLibp2p } from 'libp2p';
	import { webSockets } from '@libp2p/websockets';
	import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
	import { webRTC, webRTCDirect } from '@libp2p/webrtc';

	import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
	import {
		helia,
		connectedPeers,
		network,
		networks,
		qrCodeOpen,
		qrCodeData,
		electrumServerBanner,
		connectedServer,
		scanOpen,
		scanData
	} from './store.js';

	import { hash } from './router.js'
	import Home from './+page.svelte'
	import Transactions from './transactions.svelte'
	import NameOps from './nameOpUtxos.svelte'
	import NameCheck from './nameCheck.svelte'
	import MultiSig from './multiSig.svelte'

	import { expoIn } from 'svelte/easing';
	import BBQRCodeModal from '$lib/components/BBQRCodeModal.svelte';
	import { connectElectrum } from '$lib/connectElectrum.js';
	import ScanModal from '$lib/components/ScanModal.svelte';
	import { onMount } from 'svelte';

	let isOpen
	let sideNavOpen
	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"

	$:localStorage.setItem('network',JSON.stringify($network)	)
	$:$network?connectElectrum($network):null

	const routes = {
		'/': Home,
		'': Home,
		'/transactions': Transactions,
		'/nameOpUtxos': NameOps,
		'/nameCheck': NameCheck,
		'/multiSig': MultiSig
	}

	$: view = routes[$hash]

	onMount(async () => {
		// Modify the default Libp2p configuration to exclude WebTransport
		const libp2pConfig = {
			...libp2pDefaults(),
			transports: [
				webRTC(),
				webRTCDirect(),
				webSockets(),
				circuitRelayTransport({ discoverRelays: 1 })
				// Exclude WebTransport by not including it here
			],
			// You can add or modify other configurations as needed
		};

		const libp2p = await createLibp2p(libp2pConfig);

		// Create Helia with the custom Libp2p instance
		$helia = await createHelia({ libp2p });

		$helia.libp2p.addEventListener('connection:open', () => {
			connectedPeers.update(n => n + 1);
		});

		$helia.libp2p.addEventListener('connection:close', () => {
			connectedPeers.update(n => n - 1);
		});
	})

</script>

<Theme bind:theme persist persistKey="__carbon-theme" />
<BBQRCodeModal bind:qrCodeOpen={ $qrCodeOpen } bind:qrCodeData={ $qrCodeData } />

{#if $scanOpen}
	<ScanModal bind:scanOpen={ $scanOpen } bind:scanData={ $scanData } />
{/if}

<Header company="Doichain" platformName="Developer Playground " bind:sideNavOpen href={ `#/` }>
	<div class="right-aligned">
		<div on:click={ () => document.location.href='https://github.com/silkroadnomad/DoichainPlaygroundSvelte'}>
			<LogoGithub/></div>
		<div class="peers">
			IPFS Peers: {$connectedPeers}
		</div>
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
		<div>{$electrumServerBanner} @ {$connectedServer}</div>
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
				<HeaderPanelLink href={ `#/multiSig` }>MultiSig</HeaderPanelLink>
				<HeaderPanelLink href={ `#/nameOpUtxos` }>Name Ops</HeaderPanelLink>
				<HeaderPanelLink href={ `#/nameCheck` }>Name Check</HeaderPanelLink>

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

