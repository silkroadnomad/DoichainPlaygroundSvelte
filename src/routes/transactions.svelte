<script>
    // Svelte imports
    import { afterUpdate, onDestroy, onMount } from 'svelte';
    import { fade } from "svelte/transition";
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
    import { getAddressTxs, getTotalBalance } from '$lib/getAddressTxs.js';
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
        logs,
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
    let showAsSchwartz = false;
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
    $: utxoSum = Array.isArray($txs) 
        ? $txs.filter(tx => tx.utxo && tx.type === 'output').length
        : 0;
    $: utxoSelected = Array.isArray($txs) 
        ? $txs.filter(tx => tx.utxo && selectedRowIds.includes(tx.id)).length
        : 0;
    $: {
        if ($txs) {
            balance = getTotalBalance();
        }
    }
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
        // if(xPubOrDoiAddress) await getAddressTxs(xPubOrDoiAddress, $history, $electrumClient, $network)
    });

    onDestroy( () => $electrumClient ? $electrumClient.close() : null);

    const getTransactions = async () => {
        localStorage.setItem('doiAddress',xPubOrDoiAddress)
        $txs=[]
        $namesCount=0
        $inputCount=0
        $outputCount=0
        // balance = await getBalance(xPubOrDoiAddress, $electrumClient, $network);
        await getAddressTxs(xPubOrDoiAddress,$history,$electrumClient,$network);
    }
</script>

<div class="two-column-layout">
    <div class="left-column">
        <h2>Transactions</h2>
        <Grid class="grid-spacing">
            <Row>
                <Column>{$electrumServerBanner || 'not connected'}</Column>
            </Row>
            <Row>
                <Column>Connection URL:</Column>
                <Column>{$connectedServer}</Column>
            </Row>
            <Row>
                <Column>Tip:</Column>
                <Column>{$electrumBlockchainBlockHeadersSubscribe?.height}</Column>
            </Row>
            <Row>
                <Column>
                    <span on:click={() => showAsSchwartz = !showAsSchwartz} style="cursor: pointer;">
                        Balance (confirmed):
                    </span>
                </Column>
                <Column>
                    <span on:click={() => showAsSchwartz = !showAsSchwartz} style="cursor: pointer;">
                        {showAsSchwartz ? balance.confirmed : balance.confirmedBTC} {showAsSchwartz ? 'schwartz' : 'DOI'}
                    </span>
                </Column>
            </Row>
            <Row>
                <Column>
                    <span on:click={() => showAsSchwartz = !showAsSchwartz} style="cursor: pointer;">
                        Balance (unconfirmed):
                    </span>
                </Column>
                <Column>
                    <span on:click={() => showAsSchwartz = !showAsSchwartz} style="cursor: pointer;">
                        {showAsSchwartz ? balance.unconfirmed : balance.unconfirmedBTC} {showAsSchwartz ? 'schwartz' : 'DOI'}
                    </span>
                </Column>
            </Row>
            <Row>
                <Column>Utxos found:</Column>
                <Column>{utxoSum}</Column>
            </Row>
            <Row>
                <Column>Utxos selected:</Column>
                <Column>{utxoSelected}</Column>
            </Row>
            <Row><Column>Transactions count:</Column><Column>{$txs.length}</Column></Row>
            <Row><Column>Inputs count:</Column><Column>{$inputCount}</Column></Row>
            <Row><Column>Output count:</Column><Column>{$outputCount}</Column></Row>
            <Row><Column>Names count:</Column><Column>{$namesCount}</Column></Row>
        </Grid>
    </div>
    
    <div class="right-column">
        <h2>Logs</h2>
        <div class="logs-container">
            {#each $logs as log}
                <div class="log-entry {log.type}">
                    <span class="timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span class="message">{log.message}</span>
                </div>
            {/each}
        </div>
    </div>
</div>

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
            { key: "address", value: "Address" },
            { key: "derivationPath", value: "Derivation Path" },
            { key: "n", value: "n" },
            { key: "nameId", value: "NameId" },
            { key: "nameValue", value: "NameValue" },
            { key: "fee", value: "Fee" },
            { key: "confirmations", value: "Confirmations" },
            { key: "value", value: "Amount (DOI)" }
        ]}
        rows={[...(new Map($txs.map(tx => [tx.id, tx])).values())]}
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
        {:else if cell.key === "derivationPath"}
            <div>{cell.value || 'N/A'}</div>
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
    
    .timestamp {
        color: #666;
        margin-right: 8px;
        font-size: 0.8rem;
    }

    .error { color: #ff5555; }
    .success { color: #50fa7b; }
    .info { color: #d4d4d4; }

    h3 {
        margin: 0 0 1rem 0;
    }

    .two-column-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin: 1rem;
    }

    h2 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        font-weight: 500;
        line-height: 1.2;
    }

    .left-column, .right-column {
        min-width: 0;
    }

    .logs-container {
        flex-grow: 1;
        height: 200px; /* Fixed default height */
        overflow-y: auto;
        font-family: monospace;
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 1rem;
        border-radius: 4px;
        font-size: 0.9rem;
        line-height: 1.4;
        transition: height 0.3s ease;
        position: relative;
        z-index: 10;
    }

    .logs-container:hover {
        height: calc(100vh - 200px);
        position: absolute;
        right: 1rem;
        width: calc(50% - 2rem);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .log-entry {
        padding: 2px 0;
        white-space: pre-wrap;
        border-bottom: 1px solid #333;
    }
</style>
