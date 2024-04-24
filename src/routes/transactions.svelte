<script>
    import { DataTable, Pagination, TextInput, Toolbar, ToolbarContent, ToolbarSearch } from 'carbon-components-svelte';
    import { electrumServerVersion, electrumServerBanner, electrumBlockchainBlockHeaders, electrumClient, electrumBlockchainBlockHeadersSubscribe,
        electrumBlockchainRelayfee, network, history } from './store.js';
    import { onDestroy, onMount } from 'svelte';
    import { ElectrumxClient } from '$lib/electrumx-client.js';
    import { getAddressTxs } from '$lib/getAddressTxs.js';
    import { getBalance } from '$lib/getBalance.js';
    
    let txs = [];
    let doiAddress = "dc1qg3ra4h6xdp870u5xu7neq3htzgyd7qx0plt8dj";
    let balance = { confirmed:0 ,unconfirmed:0 }
    let pageSize = 10;
    let page = 1;
    let filteredRowIds = [];

    const connectElectrum = async () => {
        $electrumClient = new ElectrumxClient('big-parrot-60.doi.works', 50004, 'wss');
        await $electrumClient.connect("electrum-client-js", "1.4.2");
        $electrumServerVersion = await $electrumClient.request('server.version');
        $electrumServerBanner = await $electrumClient.request('server.banner');
        $electrumBlockchainBlockHeaders = await $electrumClient.request('blockchain.block.headers', [10000, 10]);
        $electrumBlockchainBlockHeadersSubscribe = await $electrumClient.request('blockchain.headers.subscribe');
        $electrumBlockchainRelayfee = await $electrumClient.request('blockchain.relayfee');
    };

    onMount( () => connectElectrum().then(() => {
        getBalance(doiAddress,$electrumClient,$network).then( _b => balance = _b)
        getAddressTxs(doiAddress, $history, $electrumClient, $network).then(_t => txs = _t)
    }));
    onDestroy( () => $electrumClient ? $electrumClient.close() : null);
</script>

<h2>Transactions</h2>
<div class="margin">{$electrumServerBanner || 'not connected'}</div>
<div class="margin">
    <table>
        <tr>
            <td>Tip:</td>
            <td>{$electrumBlockchainBlockHeadersSubscribe?.height}</td>
        </tr>
        <tr>
            <td>Balance (confirmed): </td>
            <td>{balance?.confirmed/100000000} DOI </td>
        </tr>
        <tr>
            <td>Balance (unconfirmed): </td>
            <td>{balance?.unconfirmed/100000000} DOI </td>
        </tr>
    </table>
</div>
<div class="margin">
    <TextInput
        class="margin"
        labelText="Enter Doichain address and hit enter"
        bind:value={doiAddress}
        on:keydown={(event) => { if (event.key === 'Enter') getAddressTxs(); }}
    />
</div>
<DataTable
    class="margin"
    shouldFilterRows
    {pageSize}
    {page}
    bind:filteredRowIds
    headers={[
        { key: "formattedBlocktime", value: "Time"},
        { key: "txid", value: "TxId" },
        { key: "address", value: "Address" },
        { key: "confirmations", value: "Confirmations" },
        { key: "value", value: "Amount" }
    ]}
    rows={txs}>
    <svelte:fragment slot="cell" let:row let:cell>
        {#if cell.key === "value"}
            <div style="text-align: right;">{cell.value.toFixed(8)}</div>
        {:else if cell.key === "confirmations"}
            <div style="text-align: right;">{cell.value}</div>
        {:else}
            {cell.value}
        {/if}
    </svelte:fragment>
    <Toolbar>
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
   :global(.margin, h1, h2, h3, h4) {
             margin: 20px;
    }
</style>
