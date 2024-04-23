<script>
    import { DataTable, Pagination, TextInput, Toolbar, ToolbarContent, ToolbarSearch } from 'carbon-components-svelte';
    import moment from 'moment';
    import { address, crypto } from 'bitcoinjs-lib';
    import {
        electrumServerVersion,
        electrumServerBanner,
        electrumBlockchainBlockHeaders,
        electrumClient,
        electrumBlockchainBlockHeadersSubscribe,
        electrumBlockchainRelayfee,
        network,
        history
    } from './store.js';
    import { onDestroy, onMount } from 'svelte';
    import { ElectrumxClient } from '$lib/electrumx-client.js';
    import { readData,writeData } from '$lib/indexedDBUtil.js';
    import { conv } from 'binstring'
    import Buffer from 'vite-plugin-node-polyfills/shims/buffer/index.js';

    let txs = [];
    let doiAddress = "dc1qg3ra4h6xdp870u5xu7neq3htzgyd7qx0plt8dj";
    let balance = { confirmed:0 ,unconfirmed:0 }
    let pageSize = 10;
    let page = 1;
    let filteredRowIds = [];

    $:console.log("txs",txs)

    const connectElectrum = async () => {
        $electrumClient = new ElectrumxClient('big-parrot-60.doi.works', 50004, 'wss');
        await $electrumClient.connect("electrum-client-js", "1.4.2");
        $electrumServerVersion = await $electrumClient.request('server.version');
        $electrumServerBanner = await $electrumClient.request('server.banner');
        $electrumBlockchainBlockHeaders = await $electrumClient.request('blockchain.block.headers', [10000, 10]);
        $electrumBlockchainBlockHeadersSubscribe = await $electrumClient.request('blockchain.headers.subscribe');
        $electrumBlockchainRelayfee = await $electrumClient.request('blockchain.relayfee');
        await getAddressTxs();
    };

    const getAddressTxs = async () => {

        let script = address.toOutputScript(doiAddress, $network);
        let hash = crypto.sha256(script);
        let reversedHash = Buffer.from(hash.reverse()).toString("hex");

        balance = await $electrumClient.request('blockchain.scripthash.get_balance', [reversedHash.toString("hex")]);

        let _history = await readData(reversedHash + "_history");
        if (_history) {
          $history = _history.data;
        } else {
          $history = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash]);
          await writeData({ id: reversedHash + "_history", data: $history });
        }

        txs = [];
        for (const tx of $history) {

            let cachedTx = await readData(tx.tx_hash);
            let decryptedTx;
            if (false) { //TODO enable with cachedTx
                decryptedTx = JSON.parse(cachedTx);
            } else {
                decryptedTx = await $electrumClient.request('blockchain.transaction.get', [tx.tx_hash, 1]);
                await writeData({id: tx.tx_hash,  data: JSON.stringify(decryptedTx)});
            }
            //console.log("Decrypted tx:", decryptedTx);

            decryptedTx.formattedBlocktime = moment.unix(decryptedTx.blocktime).format('YYYY-MM-DD HH:mm:ss');
            decryptedTx.value = 0; // Update this as per your logic

            for (const [index, vin] of decryptedTx.vin.entries()) {
                const prevTx = await $electrumClient.request('blockchain.transaction.get', [vin.txid, 1], true); // true for verbose to get detailed transaction
                const spentOutput = prevTx.vout[vin.vout]; // vin.vout is the index of the output in prevTx that vin is spending
                if (spentOutput.scriptPubKey.addresses.includes(doiAddress)) {
                    // This input spends from doiAddress
                    // console.log("---->")
                    const _tx = JSON.parse(JSON.stringify(decryptedTx));
                    _tx.id = decryptedTx.txid+'_in_'+index
                    _tx.value = -spentOutput.value; // Negative because it's spent
                    _tx.address = spentOutput.scriptPubKey.addresses[0]

                    txs = [...txs, _tx];
                    //break; // Assuming you only care about the first occurrence
                }
            }

            for (const [index, vout] of decryptedTx.vout.entries()) {
                const _tx = JSON.parse(JSON.stringify(decryptedTx));
                //const prevTx = await $electrumClient.request('blockchain.transaction.get', [vout.txid, 1], true); // true for verbose to get detailed transaction

                _tx.id = decryptedTx.txid+'_out_'+index;
                let address, nameId, nameValue

                const asm = vout.scriptPubKey.asm
                const asmParts = asm.split(" ")

                if (asmParts[0] !== 'OP_10' && asmParts[0] !== 'OP_NAME_DOI') {
                    _tx.address = vout.scriptPubKey.addresses[0]
                    console.log('address', _tx.address)
                    // for (let i = 0; i < addressList.length; i++) { //TODO what is this?
                    //     if (address == addressList[i]) {
                    //         utxo = true
                    //         break
                    //     }
                    // }
                } else {
                    const chunks = vout.scriptPubKey.asm.split(" ")
                    nameId = vout.scriptPubKey.nameOp.name
                    nameValue = vout.scriptPubKey.nameOp.value
                    address = conv(chunks[7], { in: 'hex', out: 'binary' })

                    console.log('name_op nameId', nameId)
                    console.log('name_op nameValue', nameValue)
                    console.log('name_op address', address)
                }

                _tx.value=vout.value
                _tx.n=vout.n

                let existingTxIndex = txs.findIndex(tx => tx.txid === _tx.txid && tx.address === _tx.address);
                console.log("existingTxIndex",existingTxIndex)
                if (existingTxIndex !== -1) {
                    console.log("aaaa")
                    // txs = txs.splice(existingTxIndex,1)
                //     // If found, update the existing transaction's value by subtracting the current value from it
                  //  txs[existingTxIndex].value -= _tx.value;
                 } //else {
                //     // If not found, add the new transaction to the txs array
                //     txs = [...txs, _tx];
                // }
                if(_tx.address===doiAddress)
                    txs = [...txs, _tx];
            }
        }
        txs.sort((a, b) => b.blocktime - a.blocktime);
    };

    onMount(()=>{
        connectElectrum()
        getAddressTxs();
    });
    onDestroy(() => $electrumClient ? $electrumClient.close() : null);
</script>

<h2>Transactions</h2>
<div class="margin">Electrum Server Version {$electrumServerVersion || 'not connected'}
    <br/>
    Electrum Server Banner {$electrumServerBanner || 'not connected'}
</div>
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
        <!--{#if cell.key === "blocktime"}-->
        <!--{ moment.unix(cell.value).format('YYYY-MM-DD HH:mm:ss') }-->
        <!--{:else}-->
          {cell.value}
        <!--{/if}-->
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
