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

	import { webSockets } from "@libp2p/websockets";
	import * as filters from "@libp2p/websockets/filters";
	import { webRTC, webRTCDirect } from "@libp2p/webrtc";
	import { webTransport } from "@libp2p/webtransport";
	// import { circuitRelayTransport } from "libp2p/circuit-relay";
	import { noise } from "@chainsafe/libp2p-noise";
	import { yamux } from "@chainsafe/libp2p-yamux";
	import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";
	// import { identifyService } from "libp2p/identify";
	// import { autoNATService } from "libp2p/autonat";
	import { gossipsub } from "@chainsafe/libp2p-gossipsub";
	// import { dcutrService } from "libp2p/dcutr";
	import { kadDHT } from "@libp2p/kad-dht";
	import { bootstrap } from "@libp2p/bootstrap";
	import { createHelia } from 'helia'
	import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
	import {
		helia,
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

	const multiaddrs = [
		// /**/'/ip4/127.0.0.1/tcp/12313/ws/p2p/12D3KooWBLrGxtfMAZpXBjMbVk6GTkdCoECfqcmWrLi4qnuHkNZy'
		"/ip4/159.69.119.82/udp/4004/quic-v1/webtransport/certhash/uEiAP75UYHU9lxxeQ43_u3U7PrL3eeb0aOBfw2ty7CjuSUA/certhash/uEiBhciKTRyUiuDHnFkpOD_i3bMRCuGT8olXrdFvteNV-uA/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM",
		"/ip4/159.69.119.82/udp/4005/webrtc-direct/certhash/uEiD3LuzNOsNyskWmWI_wPr8-FlWBhbsEKsH9x6fcEGwT7w/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM",
		// "/ip4/78.46.210.80/udp/4005/quic-v1/webtransport/certhash/uEiAbaFR9QTo2Y6xu3VEK_r3mciXziAFA0jBWvKSBb4QaMA/certhash/uEiAk1c3NNp0-aAlwktq7FdzQDcTAqcHjjWiR99MqCkrgTw/p2p/12D3KooWA6NB8Vz5ro22X3ws3DQWndQKbdNgt6UNzgUSGjS4e96Z",
		// "/ip4/78.46.210.80/udp/4004/webrtc-direct/certhash/uEiA1KCyqxF7qbtyJpumrlZEB2BmvvLddpAoowlmltQogug/p2p/12D3KooWA6NB8Vz5ro22X3ws3DQWndQKbdNgt6UNzgUSGjS4e96Z"
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
		'/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
	];
	const bootstrapConfig = {list: multiaddrs};

	let isOpen
	let sideNavOpen
	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"
	$:localStorage.setItem('network',JSON.stringify($network)	)
	$:$network?connectElectrum($network):null
	// export const config = {
	// 	addresses: {
	// 		// swarm: [address],
	// 		listen: ["/webrtc", "/wss", "/ws"]
	// 	},
	// 	transports: [
	// 		webSockets({filter: filters.all      }),
	// 		webRTC({
	// 			rtcConfiguration: {
	// 				iceServers:[{
	// 					urls: [
	// 						'stun:stun.l.google.com:19302',
	// 						'stun:global.stun.twilio.com:3478'
	// 					]
	// 				}]
	// 			}
	// 		}),
	// 		webRTCDirect(),
	// 		webTransport(),
	// 		// circuitRelayTransport({discoverRelays: 1})
	// 	],
	// 	connectionEncryption: [noise()],
	//
	// 	streamMuxers: [
	// 		yamux(),
	// 		// mplex()
	// 	],
	// 	connectionGater: {
	// 		denyDialMultiaddr: () => {
	// 			return false
	// 		}
	// 	},
	// 	peerDiscovery: [
	// 		bootstrap(bootstrapConfig),
	// 		pubsubPeerDiscovery()
	// 	],
	// 	services: {
	// 		// identify: identifyService(),
	// 		// autoNAT: autoNATService(),
	// 		// dcutr: dcutrService(),
	// 		pubsub: gossipsub({allowPublishToZeroPeers: true, canRelayMessage: true}),
	// 		dht: kadDHT({
	// 			protocolPrefix: "/svelte-pubsub",
	// 			maxInboundStreams: 5000,
	// 			maxOutboundStreams: 5000,
	// 			clientMode: true,
	// 		}),
	// 	}
	// }
	createHelia().then(_helia => $helia = _helia)
	const routes = {
		'/': Home,
		'': Home,
		'/transactions': Transactions,
		'/nameOpUtxos': NameOps,
		'/nameCheck': NameCheck,
		'/multiSig': MultiSig
	}
	$: view = routes[$hash]
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

