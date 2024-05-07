import {
	electrumBlockchainBlockHeadersSubscribe,
	electrumBlockchainRelayfee,
	electrumClient,
	electrumServerBanner,
	electrumServers,
	electrumServerVersion, network, connectedServer
} from '../routes/store.js';
import { ElectrumxClient } from '$lib/electrumx-client.js';

let _electrumClient
electrumClient.subscribe((value) => _electrumClient = value)
let _network
network.subscribe((value) => _network = value)

export const connectElectrum = async (_network) => {
	if(!_network) return
	const networkNodes = electrumServers.filter(n=>n.network===_network.name)
	const randomServer = networkNodes[Math.floor(Math.random() * networkNodes.length)];
	_electrumClient = new ElectrumxClient(randomServer.host, randomServer.port, randomServer.protocol);
	electrumClient.set(_electrumClient)

	await _electrumClient.connect("electrum-client-js", "1.4.2");
	const _electrumServerVersion = await _electrumClient.request('server.version');
	electrumServerVersion.set(_electrumServerVersion)
	console.log("electrumServerVersion",_electrumServerVersion)

	const _connectedServer = randomServer.protocol+"://"+randomServer.host+":"+randomServer.port
	connectedServer.set(_connectedServer)
	console.log("network",_connectedServer)

	const _electrumServerBanner = await _electrumClient.request('server.banner');
	console.log("electrumServerBanner",_electrumServerBanner)
	electrumServerBanner.set(_electrumServerBanner)
	const _electrumBlockchainBlockHeadersSubscribe = await _electrumClient.request('blockchain.headers.subscribe');
	electrumBlockchainBlockHeadersSubscribe.set(_electrumBlockchainBlockHeadersSubscribe)
	const _electrumBlockchainRelayfee = await _electrumClient.request('blockchain.relayfee');
	electrumBlockchainRelayfee.set(_electrumBlockchainRelayfee)
	return _connectedServer
}