<script>
    import { onMount,onDestroy } from 'svelte';
    import { ElectrumxClient } from '$lib/electrumx-client.js';
    import { electrumClient, electrumServers, network } from './store.js';

    let nameSpaces = []
    let quatsch = []
    let nameOpUtxos = [];
    let currentHeight = {height:0}
    let newHeight
    let currentTransaction
    let counter = 0
    let transactionsScanned = 0
    let outputsScanned = 0
    $:console.log("nameSpaces",nameSpaces)
    $:console.log("quatsch",quatsch)
    onMount(async () => {
        if(!$electrumClient || $electrumClient.getStatus()===0)await connectElectrum();
        await scanBlockchain();
    });

    async function connectElectrum() {
        const networkNodes = electrumServers.filter(n => n.network === $network.name);
        const randomServer = networkNodes[Math.floor(Math.random() * networkNodes.length)];
        $electrumClient = new ElectrumxClient(randomServer.host, randomServer.port, randomServer.protocol);
        await $electrumClient.connect("electrum-client-js", "1.4.2");
    }

    async function scanBlockchain(maxRecords) {
        currentHeight = await $electrumClient.request('blockchain.headers.subscribe');
        console.log("currentHeight",currentHeight)
        let lowerHightBy = 0
        for (let height = (currentHeight.height-lowerHightBy); height > 0; height--) {
            console.log("height",height)
            newHeight = height
            counter=0
            try {
                while(true){
                    const tx = await $electrumClient.request('blockchain.transaction.id_from_pos', [height,counter]);

                    currentTransaction = tx
                    const txDetails = await $electrumClient.request('blockchain.transaction.get', [tx, true]);
                    for (const vout of txDetails.vout) {

                        const asm = vout.scriptPubKey.asm
                        const asmParts = asm.split(" ")
                        if (asmParts[0] !== 'OP_10' && asmParts[0] !== 'OP_NAME_DOI') {
                            //_tx.address = vout.scriptPubKey?.addresses ? vout.scriptPubKey?.addresses[0] : _doiAddress
                        } else {

                            let _tx = {}
                            _tx.nameId = vout.scriptPubKey.nameOp.name
                            _tx.nameValue = vout.scriptPubKey.nameOp.value
                            _tx.address = vout.scriptPubKey?.addresses[0]

                            if(_tx.nameId.indexOf('/')!==-1) {
                                const newNameSpace = _tx.nameId.substring(0,_tx.nameId.indexOf('/'))
                                if(!nameSpaces.includes(newNameSpace))nameSpaces.push(newNameSpace)
                            }
                            else quatsch.push(_tx.nameId)

                            nameOpUtxos.push({
                                txid: txDetails.txid,
                                n: vout.n,
                                value: vout.value,
                                nameId: vout.scriptPubKey.nameOp.name,
                                nameValue: vout.scriptPubKey.nameOp.value,
                                address: vout.scriptPubKey?.addresses[0]
                            })
                            nameSpaces = nameSpaces
                            quatsch = quatsch
                            nameOpUtxos = nameOpUtxos
                        }
                        outputsScanned = outputsScanned+1
                    }
                    counter++
                    transactionsScanned = transactionsScanned+1
                    if(maxRecords && counter===maxRecords) return;
                }

            } catch(ex){ console.log("ex",ex) }
        }
    }

    onDestroy(() => {
        $electrumClient.close();
    });
</script>

<h1>Doichain Name Operation Scanner</h1>
<h6>Scanning from current height backwards: {newHeight?newHeight:currentHeight.height}</h6>
<h6>Current transaction: {currentTransaction}</h6>
<h6>Scanned transactions: {transactionsScanned}</h6>
<h6>Outputs scanned: {outputsScanned}</h6>

<p>&nbsp;</p>
Found NameSpaces:
{#each nameSpaces as ns}
    <li>{ns}</li>
{/each}
<p>&nbsp;</p>
Found Quatsch:
{#each quatsch as q}
    <li>{q}</li>
{/each}
<p>&nbsp;</p>
{#if nameOpUtxos.length > 0}
    <ul>
        {#each nameOpUtxos as utxo}
            <li>NameId: {utxo.nameId} nameValue: {utxo.nameValue} - txid:{utxo.txid} - Index: {utxo.n} - Value: {utxo.value}  Address: {utxo.address} </li>
        {/each}
    </ul>
{:else}
    <p>No Name Operation UTXOs found.</p>
{/if}