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
        history } from './store.js';

    import { afterUpdate, onDestroy, onMount } from 'svelte';
    import { sign} from '$lib/signTransactionModal.js'
    import { ElectrumxClient } from '$lib/electrumx-client.js';
    import { getAddressTxs } from '$lib/getAddressTxs.js';
    import { getBalance } from '$lib/getBalance.js';
    
    let txs = [];
    let doiAddress = "dc1qtu6ltqv53ldhhzyee3gnhdkq0erwtkyanygs5u";
    let recipientAddress = ''
    let doiAmount = '0,00000000'
    let balance = { confirmed:0 ,unconfirmed:0 }
    let pageSize = 10;
    let page = 1

    let filteredRowIds = [];
    let selectedRowIds = [];
    let batchSelection = true
    let active = true

    const electrumServers = [
        { host: 'big-parrot-60.doi.works', port: 50004, protocol: 'wss' },
        { host: 'pink-deer-69.doi.works', port: 50004, protocol: 'wss' },
        { host: 'itchy-jellyfish-89.doi.works', port: 50004, protocol: 'wss' }
    ];

    const connectElectrum = async () => {

        console.log("connecting to electrum")
        const randomServer = electrumServers[Math.floor(Math.random() * electrumServers.length)];
        $electrumClient = new ElectrumxClient(randomServer.host, randomServer.port, randomServer.protocol);

        await $electrumClient.connect("electrum-client-js", "1.4.2");
        $electrumServerVersion = await $electrumClient.request('server.version');
        $electrumServerBanner = await $electrumClient.request('server.banner');
        $electrumBlockchainBlockHeaders = await $electrumClient.request('blockchain.block.headers', [10000, 10]);
        $electrumBlockchainBlockHeadersSubscribe = await $electrumClient.request('blockchain.headers.subscribe');
        $electrumBlockchainRelayfee = await $electrumClient.request('blockchain.relayfee');

    }

    afterUpdate(() => {
        txs.forEach(tx => {
            if (!tx.utxo) {
                const trElement = document.querySelector(`tr[data-row="${tx.id}"] > td:first-child > div`); //{> td:first-child
                if(trElement){
                    console.log("now disabling checkbox")
                    trElement.style.display = "none"
                }
            } else {
                const trElement = document.querySelector(`tr[data-row="${tx.id}"] > td:first-child > div`); //{> td:first-child
                if(trElement)trElement.style.display = "contents"
            }
        });
    });

    // onMount( () => connectElectrum().then(() => {
    //     getBalance(doiAddress,$electrumClient,$network).then( _b => balance = _b)
    //     getAddressTxs(doiAddress, $history, $electrumClient, $network).then(_t => txs = _t)
    // }));
    onMount(() => {
        connectElectrum()
          .then(() => {
              console.log("Connected to Electrum server successfully.");
              return getBalance(doiAddress, $electrumClient, $network);
          })
          .then(_b => {
              balance = _b;
              console.log("Balance fetched successfully.");
              return getAddressTxs(doiAddress, $history, $electrumClient, $network);
          })
          .then(_t => {
              txs = _t;
              console.log("Transactions fetched successfully.");
          })
          .catch(error => {
              console.error("Error during Electrum operations:", error);
              // Handle errors appropriately, possibly setting an error state or notifying the user
          });
    });

    onDestroy( () => $electrumClient ? $electrumClient.close() : null);

</script>

<h2>Transactions</h2>
<Grid>
    <Row>
        <Column>{$electrumServerBanner || 'not connected'}</Column>
    </Row>
    <Row>
        <Column>Tip:</Column>
        <Column>{$electrumBlockchainBlockHeadersSubscribe?.height}</Column>
        <Column></Column>
        <Column></Column>
    </Row>
    <Row>
        <Column>Balance (confirmed):</Column>
        <Column>{$electrumServerBanner || 'not connected'}</Column>
        <Column></Column>
        <Column></Column>
    </Row>
    <Row>
        <Column>Balance (unconfirmed):</Column>
        <Column>{balance?.confirmed/100000000} DOI </Column>
        <Column></Column>
        <Column></Column>
    </Row>
    <Row>
        <Column></Column>
        <Column>{balance?.unconfirmed/100000000} DOI </Column>
        <Column></Column>
        <Column></Column>
    </Row>
</Grid>
<Grid>
    <Row>
        <Column>
            <TextInput
              class="margin"
              labelText="Enter Doichain address and hit enter to display transactions"
              bind:value={doiAddress}
              on:keydown={async (event) => {
                  if (event.key === 'Enter')
                    txs = await getAddressTxs(doiAddress,$history,$electrumClient,$network); }}
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
    rows={txs}
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
            // selectedRowIds = [];
             sign({recipientAddress,doiAmount})

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
</style>
