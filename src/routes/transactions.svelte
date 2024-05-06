<script>
    import { fade } from "svelte/transition";

    import {
        Button,
        Column,
        DataTable, Grid,
        Pagination,
        Row,
        TextInput,
        ToastNotification,
        Toolbar, ToolbarBatchActions,
        ToolbarContent,
        ToolbarSearch
    } from 'carbon-components-svelte';

    import {
        electrumServers,
        electrumServerVersion,
        electrumServerBanner,
        electrumClient,
        electrumBlockchainBlockHeadersSubscribe,
        electrumBlockchainRelayfee,
        network,
        history,
        txs,
        inputCount,
        outputCount, namesCount,
        currentAddressP2pkh
    } from './store.js';
	  import { path } from './router.js'
    import { afterUpdate, onDestroy, onMount } from 'svelte';
    import { sign} from '$lib/components/signTransactionModal.js'
    import { ElectrumxClient } from '$lib/electrumx-client.js';
    import { getAddressTxs } from '$lib/getAddressTxs.js';
    import { getBalance } from '$lib/getBalance.js';

    let nameId = ""
    let nameValue = ""
    let doiAddress = $currentAddressP2pkh || $path.substring($path.lastIndexOf("/")+1)!=='transactions'?$path.substring($path.lastIndexOf("/")+1):localStorage.getItem('doiAddress') || ''
    let recipientAddress = $currentAddressP2pkh
    let doiAmount = 0
    let balance = { confirmed:0 ,unconfirmed:0 }
    let pageSize = 10;
    let page = 1

    let filteredRowIds = [];
    let selectedRowIds = [];
    let batchSelection = true
    let active = true

    let timeout
    let toastNotification
    $: showNotification = timeout !== undefined;

    let randomServer //TODO can we improve that?

    $: doiAmount = Number(doiAmount)
    $: utxoSum = Array.isArray($txs) ? $txs.reduce((sum, utxo) => sum + (utxo.value * 100000000), 0) : 0;
    $: utxoSelected = Array.isArray($txs) ? $txs.filter(tx => selectedRowIds.includes(tx.id)).reduce((sum, utxo) => sum + (utxo.value*100000000), 0) : 0;
    $: $network?connectElectrum($network):null

    const connectElectrum = async (_network) => {
        if(!_network) return
        const networkNodes = electrumServers.filter(n=>n.network===_network.name)
        randomServer = networkNodes[Math.floor(Math.random() * networkNodes.length)];
        $electrumClient = new ElectrumxClient(randomServer.host, randomServer.port, randomServer.protocol);

        await $electrumClient.connect("electrum-client-js", "1.4.2");
        $electrumServerVersion = await $electrumClient.request('server.version');
        console.log("electrumServerVersion",$electrumServerVersion)
        console.log("network",randomServer.protocol+"://"+randomServer.host+":"+randomServer.port)
        $electrumServerBanner = await $electrumClient.request('server.banner');
        // $electrumBlockchainBlockHeaders = await $electrumClient.request('blockchain.block.headers', [10000, 10]);
        $electrumBlockchainBlockHeadersSubscribe = await $electrumClient.request('blockchain.headers.subscribe');
        $electrumBlockchainRelayfee = await $electrumClient.request('blockchain.relayfee');
    }

    afterUpdate(() => {
        $txs.forEach(tx => {
            if (!tx.utxo) {
                const trElement = document.querySelector(`tr[data-row="${tx.id}"] > td:nth-child(2) > div`); //{> td:first-child
                if(trElement) trElement.style.display = "none"
            } else {
                const trElement = document.querySelector(`tr[data-row="${tx.id}"] > td:nth-child(2) > div`); //{> td:first-child
                if(trElement)trElement.style.display = "contents"
            }
        });
    });

    onMount(async () => {
        await connectElectrum($network)
        doiAddress = $currentAddressP2pkh || localStorage.getItem('doiAddress') || '';
        if(doiAddress) await getAddressTxs(doiAddress, $history, $electrumClient, $network)
    });

    onDestroy( () => $electrumClient ? $electrumClient.close() : null);
    $: doiAddress?localStorage.setItem('doiAddress', doiAddress):null

    $:console.log("$path",$path)
</script>

<h2>Transactions</h2>
<Grid class="grid-spacing">
    <Row>
        <Column>{$electrumServerBanner || 'not connected'}</Column>
    </Row>
    <Row>
        <Column>Connection URL:</Column>
        <Column>{randomServer.protocol}://{randomServer.host}:{randomServer.port} </Column>
        <Column></Column>
        <Column></Column>
    </Row>
    <Row>
        <Column>Tip:</Column>
        <Column>{$electrumBlockchainBlockHeadersSubscribe?.height}</Column>
        <Column></Column>
        <Column></Column>
    </Row>
    <Row>
        <Column>Balance (confirmed):</Column>
        <Column>{balance?.confirmed} schwartz </Column>
        <Column></Column>
        <Column></Column>
    </Row>
    <Row>
        <Column>Balance (unconfirmed):</Column>
        <Column>{balance?.unconfirmed} schwartz </Column>
        <Column></Column><Column></Column>
    </Row>
    <Row><Column>Utxos found:</Column><Column>{utxoSum} schwartz</Column><Column></Column><Column></Column></Row>
    <Row><Column>Utxos selected:</Column><Column>{utxoSelected} schwartz</Column><Column></Column><Column></Column></Row>
    <Row><Column>Transactions count:</Column><Column>{$txs.length}</Column><Column></Column><Column></Column></Row>
    <Row><Column>Inputs count:</Column><Column>{$inputCount}</Column><Column></Column><Column></Column></Row>
    <Row><Column>Output count:</Column><Column>{$outputCount}</Column><Column></Column><Column></Column></Row>
    <Row><Column>Names count:</Column><Column>{$namesCount}</Column><Column></Column><Column></Column></Row>
</Grid>
<Grid class="grid-spacing">
    <Row>
        <Column>
            <TextInput
              class="margin"
              labelText="Enter Doichain address and hit enter to display txs"
              bind:value={ doiAddress }
              on:keydown={ async (event) => {
                  if (event.key === 'Enter') {
                      localStorage.setItem('doiAddress',doiAddress)
                    $txs=[]
                    $namesCount=0
                    $inputCount=0
                    $outputCount=0
                    balance = await getBalance(doiAddress, $electrumClient, $network);
                    await getAddressTxs(doiAddress,$history,$electrumClient,$network);
                  }
                }
              }
        /></Column>
    </Row>
</Grid>
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
          //  { key: "address", value: "Address" },
            { key: "nameId", value: "NameId" },
            { key: "nameValue", value: "NameValue" },
            { key: "fee", value: "Fee" },
            { key: "confirmations", value: "Confirmations" },
            { key: "value", value: "Amount (DOI)" }
        ]}
        rows={$txs}
        rowClassName={({row}) => row.utxo?'utxo':''}
    >

    <svelte:fragment slot="expanded-row" let:row>
        <pre>{JSON.stringify(row, null, 2)}</pre>
    </svelte:fragment>

    <svelte:fragment slot="cell" let:row let:cell>
        {#if cell.key === "value"}
            <div style="text-align: right;">{cell.value?.toFixed(8)}</div>
        {:else if cell.key === "confirmations"}
            <div style="text-align: right;">{cell.value || '0'}</div>
        {:else if cell.key === "fee"}
            <div style="text-align: right;">{cell.value?.toFixed(8) || '0' }</div>
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
        <TextInput
          class="margin"
          name="nameId"
          labelText="Enter a name to store on Doichain"
          bind:value={nameId}
        />
        <TextInput
          class="margin"
          name="nameValue"
          labelText="Enter value to store on Doichain"
          bind:value={nameValue}
        />
        <TextInput
          class="margin"
          labelText="Enter recipients Doichain address "
          bind:value={recipientAddress}
        />
        <TextInput
          class="margin"
          labelText="Enter amount in DOI to send "
          type="number"
          bind:value={doiAmount}
        />
        <Button disabled={selectedRowIds.length === 0} on:click={() => {
            
             const result = sign({
                 senderAddress: doiAddress,
                 recipientAddress,
                 doiAmount,
                 nameId,
                 nameValue,
                 utxos: $txs.filter(tx => selectedRowIds.includes(tx.id))})

                 if(result) {
                    toastNotification = "Transaction has been successfully sent";
                    timeout = 3000;
                 }else{
                    toastNotification = "Transaction failed";
                    timeout = 3000;
                 }
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
{#if showNotification}
    <div transition:fade>
        <ToastNotification
            {timeout}
            kind="success"
            title="Success"
            subtitle={toastNotification}
            caption={new Date().toLocaleString()}
            on:close={() => {
                timeout = undefined;
            }}
        />
    </div>
{/if}
<style>
    :global(.datatable) {
        margin-top: 3rem;
    }
   :global(.margin, h1, h2, h3, h4) {
        margin: 20px;
    }
    :global(.grid-spacing) {
        margin-bottom: 20px; /* Adjust the space as needed */
    }
</style>
