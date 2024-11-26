<script>
    // Svelte imports
    import { afterUpdate, onDestroy, onMount } from 'svelte';
    import { fade } from "svelte/transition";
    
    // Carbon components imports (alphabetically ordered)
    import {
        Button,
        Column,
        DataTable,
        FileUploaderDropContainer,
        Grid,
        Pagination,
        Row,
        TextInput,
        Toolbar,
        ToolbarBatchActions,
        ToolbarContent,
        ToolbarSearch
    } from 'carbon-components-svelte';
    import Scan from "carbon-icons-svelte/lib/Scan.svelte";

    // Local imports (alphabetically ordered)
    import { getAddressTxs } from '$lib/getAddressTxs.js';
    import { getBalance } from '$lib/getBalance.js';
    import ScanModal from '$lib/components/ScanModal.svelte';
    import { sign } from '$lib/components/signTransactionModal.js';
    import { path } from './router.js';
    import {
        connectedServer,
        currentAddress,
        electrumBlockchainBlockHeadersSubscribe,
        electrumClient,
        electrumServerBanner,
        history,
        inputCount,
        namesCount,
        network,
        outputCount,
        txs,
    } from './store.js';

    // Variables (grouped by type)
    // Addresses and amounts
    let xPubOrDoiAddress = $currentAddress || $path.substring($path.lastIndexOf("/")+1)!=='transactions'?$path.substring($path.lastIndexOf("/")+1):localStorage.getItem('doiAddress') || '';
    let recipientAddress = $currentAddress || xPubOrDoiAddress;
    let doiAmount = 0;
    let balance = { confirmed: 0, unconfirmed: 0 };

    // Names
    let nameId = "";
    let nameValue = "";

    // Table related
    let page = 1;
    let pageSize = 100;
    let filteredRowIds = [];
    let selectedRowIds = [];
    let batchSelection = true;
    let active = true;

    // Notification related
    let timeout;
    let toastNotification;

    // Scan related
    let scanOpen = false;
    let scanData;

    // Reactive declarations (grouped by functionality)
    $: showNotification = timeout !== undefined;
    $: doiAmount = Number(doiAmount);
    $: utxoSum = Array.isArray($txs) ? $txs.reduce((sum, utxo) => sum + (utxo.value * 100000000), 0) : 0;
    $: utxoSelected = Array.isArray($txs) ? $txs.filter(tx => selectedRowIds.includes(tx.id)).reduce((sum, utxo) => sum + (utxo.value*100000000), 0) : 0;
    $: if (scanData) xPubOrDoiAddress = scanData;
    $: xPubOrDoiAddress ? localStorage.setItem('xPubOrDoiAddress', xPubOrDoiAddress) : null;

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
        xPubOrDoiAddress = $currentAddress || localStorage.getItem('xPubOrDoiAddress') || '';
        if(xPubOrDoiAddress) await getAddressTxs(xPubOrDoiAddress, $history, $electrumClient, $network)
    });

    onDestroy( () => $electrumClient ? $electrumClient.close() : null);

    const getTransactions = async () => {
        localStorage.setItem('doiAddress',xPubOrDoiAddress)
        $txs=[]
        $namesCount=0
        $inputCount=0
        $outputCount=0
        balance = await getBalance(xPubOrDoiAddress, $electrumClient, $network);
        await getAddressTxs(xPubOrDoiAddress,$history,$electrumClient,$network);
    }
</script>

<h2>Transactions</h2>
<Grid class="grid-spacing">
    <Row>
        <Column>{$electrumServerBanner || 'not connected'}</Column>
    </Row>
    <Row>
        <Column>Connection URL:</Column>
        <Column>{$connectedServer} </Column>
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
    <Row style="align-items: flex-end;">
        <Column style="display: flex; flex-direction: column; flex-grow: 1;">
            <TextInput
                class="margin address-input"
                labelText="Enter Doichain address and hit enter to display txs"
                bind:value={xPubOrDoiAddress}
                on:keydown={async (event) => {
                    if (event.key === 'Enter') await getTransactions()
                }}
            />
        </Column>
        <Column style="display: flex; align-items: center; gap: 10px;">
            <Button 
                size="field" 
                kind="ghost" 
                iconDescription="Scan QR code"
                class="scan-button"
                on:click={() => scanOpen = true}
            >
                <Scan size={20}/>
            </Button>
            <Button 
                size="field" 
                kind="primary" 
                on:click={async ()=> await getTransactions()}
            >
                List TXS
            </Button>
        </Column>
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
            { key: "n", value: "n" },
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
        {:else if cell.key === "n"}
            <div style="text-align: right;">{Number(cell.value || 0)}</div>
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
        ><Grid class="grid-spacing">
            <Row>
                <Column>
                    <FileUploaderDropContainer
                      labelText="Drag and drop a file here or click to upload"
                      validateFiles={(files) => {

                      if (files && files.length > 0) {
                            const file = files[0]; // Assuming you're handling the first file
                            const reader = new FileReader();
                            reader.readAsArrayBuffer(file);
                            reader.onload = async (event) => {
                                const hashBuffer = await crypto.subtle.digest('SHA-256', event.target.result);
                                const hashHex = Buffer.from(hashBuffer).toString("hex");
                                console.log("SHA-256 Hash:", hashHex);
                                nameId="pe/"+hashHex
                                nameValue='poe'
                            };
                      }
                return true //files.filter((file) => file.size < 1_024);
              }}
              on:change={(e) => {
                    // console.log("files", e.detail);
              }}
            />
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
                </Column>
                <Column>
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
                         senderAddress: xPubOrDoiAddress,
                         recipientAddress,
                         doiAmount,
                         nameId,
                         nameValue,
                         selectedRowIds,
                         txs: $txs
                     })
                         if(result) {
                            toastNotification = "Transaction has been successfully sent";
                            timeout = 3000;
                         }else{
                            toastNotification = "Transaction failed";
                            timeout = 3000;
                         }
                }}>Sign</Button>
                </Column>
            </Row>
        </Grid>
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
{#if scanOpen}
    <ScanModal 
        bind:scanOpen 
        bind:scanData
        on:close={() => {
            if (scanData) getTransactions();
        }}
    />
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
    :global(.address-input-container) {
        display: flex;
        align-items: flex-end;
        gap: 1rem;
    }

    :global(.address-input) {
        flex: 1;
    }

    :global(.scan-button) {
        margin-bottom: 20px; /* Matches the margin class */
    }
</style>
