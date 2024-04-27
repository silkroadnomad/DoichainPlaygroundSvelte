<script>
    import {
        Button,
        Column,
        DataTable, Grid,
        Pagination,
        Row,
        TextInput,
        Toolbar, ToolbarBatchActions,
        ToolbarContent,
        ToolbarSearch
    } from 'carbon-components-svelte';

    import {
        electrumServerVersion,
        electrumServerBanner,
        electrumBlockchainBlockHeaders,
        electrumClient,
        electrumBlockchainBlockHeadersSubscribe,
        electrumBlockchainRelayfee,
        network,
        history,
        txs
    } from './store.js';

    import { afterUpdate, onDestroy, onMount } from 'svelte';
    import { sign} from '$lib/signTransactionModal.js'
    import { ElectrumxClient } from '$lib/electrumx-client.js';
    import { getAddressTxs } from '$lib/getAddressTxs.js';
    import { getBalance } from '$lib/getBalance.js';

    let doiAddress = "";
    let recipientAddress = ''
    let doiAmount = 0
    let balance = { confirmed:0 ,unconfirmed:0 }
    let pageSize = 10;
    let page = 1

    let filteredRowIds = [];
    let selectedRowIds = [];
    let batchSelection = true
    let active = true

    let randomServer //TODO can we improve that?

    const electrumServers = [
        { network:'doichain-mainnet', host: 'big-parrot-60.doi.works', port: 50004, protocol: 'wss' },
        { network:'doichain-mainnet', host: 'pink-deer-69.doi.works', port: 50004, protocol: 'wss' },
        { network:'doichain-mainnet', host: 'itchy-jellyfish-89.doi.works', port: 50004, protocol: 'wss' },
        // { network:'doichain-regtest', host: 'localhost', port: 8000, protocol: 'ws' },
        { network:'doichain-regtest', host: 'localhost', port: 8443, protocol: 'wss' },
    ];

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
                const trElement = document.querySelector(`tr[data-row="${tx.id}"] > td:first-child > div`); //{> td:first-child
                if(trElement) trElement.style.display = "none"
            } else {
                const trElement = document.querySelector(`tr[data-row="${tx.id}"] > td:first-child > div`); //{> td:first-child
                if(trElement)trElement.style.display = "contents"
            }
        });
    });

    onMount(() => {
        connectElectrum($network)
    });

    onDestroy( () => $electrumClient ? $electrumClient.close() : null);

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
        <Column>{balance?.confirmed/100000000} DOI </Column>
        <Column></Column>
        <Column></Column>
    </Row>
    <Row>
        <Column>Balance (unconfirmed):</Column>
        <Column>{balance?.unconfirmed/100000000} DOI </Column>
        <Column></Column>
        <Column></Column>
    </Row>
    <Row>
        <Column>Transactions count: {$txs.length}</Column>
        <Column></Column>
        <Column></Column>
        <Column></Column>
    </Row>
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
                    $txs=[]
                    balance = await getBalance(doiAddress, $electrumClient, $network);
                    await getAddressTxs(doiAddress,$history,$electrumClient,$network);
                  }
                }
              }
        /></Column>
    </Row>
</Grid>
<DataTable
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
        { key: "address", value: "Address" },
        { key: "confirmations", value: "Confirmations" },
        { key: "value", value: "Amount (DOI)" }
    ]}
    rows={$txs}
    rowClassName={({row}) => row.utxo?'utxo':''}
    >
    <svelte:fragment slot="cell" let:row let:cell>
        {#if cell.key === "value"}
            <div style="text-align: right;">{cell.value.toFixed(8)}</div>
        {:else if cell.key === "confirmations"}
            <div style="text-align: right;">{cell.value || '0'}</div>
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
          labelText="Enter recipients Doichain address "
          bind:value={recipientAddress}
        />

        <TextInput
          class="margin"
          labelText="Enter amount in DOI to send "
          bind:value={doiAmount}
        />

        <Button disabled={selectedRowIds.length === 0} on:click={() => {
             sign({utxos: $txs.filter(tx => selectedRowIds.includes(tx.id)),recipientAddress,doiAmount})
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
