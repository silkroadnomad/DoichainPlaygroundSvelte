<script>
    import { onMount,onDestroy } from 'svelte';
    import { ElectrumxClient } from '$lib/electrumx-client.js';
    import { electrumClient, electrumServers, network } from './store.js';
    // import { sign } from '$lib/signTransactionModal.js';
    import {
        Button,
        DataTable, Pagination,
        Toolbar,
        ToolbarBatchActions,
        ToolbarContent, ToolbarSearch
    } from 'carbon-components-svelte';
    import moment from 'moment/moment.js';

    let nameSpaces = []
    let quatsch = []
    let nameOpUtxos = [];
    let currentHeight = {height:0}
    let newHeight
    let currentTransaction
    let counter = 0
    let transactionsScanned = 0
    let outputsScanned = 0

    let filteredRowIds = [];
    let selectedRowIds = [];
    let batchSelection = true
    let pageSize = 10;
    let page = 1
    let active = true

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
                                formattedBlocktime:  txDetails.blocktime ? moment.unix(txDetails.blocktime).format('YYYY-MM-DD HH:mm:ss') : 'mempool',
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
<!--{#if nameOpUtxos.length > 0}-->
<!--    <ul>-->
<!--        {#each nameOpUtxos as utxo}-->
<!--            <li>NameId: {utxo.nameId} nameValue: {utxo.nameValue} - txid:{utxo.txid} - Index: {utxo.n} - Value: {utxo.value}  Address: {utxo.address} </li>-->
<!--        {/each}-->
<!--    </ul>-->
<!--{:else}-->
<!--    <p>No Name Operation UTXOs found.</p>-->
<!--{/if}-->

<DataTable
  sortable
  expandable
  class="datatable"
  bind:batchSelection
  bind:selectedRowIds
  shouldFilterRows
  {pageSize}
  {page}
  bind:filteredRowIds
  headers={[
            { key: "formattedBlocktime", value: "Time"},
            { key: "txid", value: "TxId" },
            { key: "value", value: "Amount (DOI)" },
            { key: "address", value: "Address" },
            { key: "nameId", value: "NameId" },
            { key: "nameValue", value: "NameValue" },
        ]}
  rows={nameOpUtxos}
  rowClassName={({row}) => row.utxo?'utxo':''}
>

    <svelte:fragment slot="expanded-row" let:row>
        <pre>{JSON.stringify(row, null, 2)}</pre>
    </svelte:fragment>

    <svelte:fragment slot="cell" let:row let:cell>
        {#if cell.key === "value"}
            <div style="text-align: right;">{cell.value?.toFixed(8)}</div>
        {:else if cell.key === "nameId"}
            <div>{cell.value?cell.value.substring(0,10):'?'}</div>
        {:else if cell.key === "nameValue"}
            <div>{cell.value?cell.value.substring(0,10):'?'}</div>
        {:else if cell.key === "txid"}
            <div >{cell.value?cell.value.substring(0,10):'?'}</div>
        {:else}
            {cell.value || ''}
        {/if}
    </svelte:fragment>
    <Toolbar>
        <ToolbarBatchActions
          active={selectedRowIds.length>0}
          on:cancel={(e) => {
                e.preventDefault();
                selectedRowIds=[]
                active = false;
          }}
        >
<!--            <TextInput-->
<!--              class="margin"-->
<!--              name="nameId"-->
<!--              labelText="Enter a name to store on Doichain"-->
<!--              bind:value={nameId}-->
<!--            />-->
<!--            <TextInput-->
<!--              class="margin"-->
<!--              name="nameValue"-->
<!--              labelText="Enter value to store on Doichain"-->
<!--              bind:value={nameValue}-->
<!--            />-->
<!--            <TextInput-->
<!--              class="margin"-->
<!--              labelText="Enter recipients Doichain address "-->
<!--              bind:value={recipientAddress}-->
<!--            />-->
<!--            <TextInput-->
<!--              class="margin"-->
<!--              labelText="Enter amount in DOI to send "-->
<!--              type="number"-->
<!--              bind:value={doiAmount}-->
<!--            />-->
            <Button disabled={selectedRowIds.length === 0} on:click={() => {

             // const result = sign({
             //     senderAddress: doiAddress,
             //     recipientAddress,
             //     doiAmount,
             //     nameId,
             //     nameValue,
             //     utxos: $txs.filter(tx => selectedRowIds.includes(tx.id))})
             //
             //     if(result) {
             //        toastNotification = "Transaction has been successfully sent";
             //        timeout = 3000;
             //     }else{
             //        toastNotification = "Transaction failed";
             //        timeout = 3000;
             //     }
        }}>Sign</Button>
        </ToolbarBatchActions>
        <ToolbarContent>
            <ToolbarSearch
              persistent
              shouldFilterRows
              bind:filteredRowIds
            />
        </ToolbarContent>
    </Toolbar>
</DataTable>
<Pagination
  bind:pageSize
  bind:page
  totalItems={filteredRowIds.length}
  pageSizeInputDisabled
/>