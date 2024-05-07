<script>
    import {
        ComposedModal, ModalHeader, ModalBody, ModalFooter, Button,
        RadioButtonGroup,
        RadioButton, Column, Grid, Row, TextInput
    } from 'carbon-components-svelte';

    import { createEventDispatcher, onMount } from 'svelte';
    import {
        electrumClient,
        network,
        electrumBlockchainRelayfee,
        currentWif,
        currentAddressP2pkh
    } from '../../routes/store.js';
    import * as bitcoin from 'bitcoinjs-lib';
    import * as ecc from 'tiny-secp256k1';
    import ECPairFactory from 'ecpair';
    import {VERSION} from "$lib/doichain.js"
    import { getNameOPStackScript } from '$lib/getNameOPStackScript.js';

    const ECPair = ECPairFactory(ecc);
    /** dispatches the events when a button was clicked*/
    const dispatch = createEventDispatcher();

    /** the header of the modal @type {string} [heading='deContact Protocol Action'] */
    export let heading = 'Simple Coin Transaction ';
    export let PrimaryButtonText = 'Sign transaction'
    export let CancelOperationButtonText = 'Cancel'
    export let senderAddress = $currentAddressP2pkh
    export let recipientAddress = $currentAddressP2pkh
    export let nameId
    export let nameValue

    export let doiAmount = 100000000 //in schwartz
    export let changeAmount = 0
    export let selectedRowIds
    export let txs


    let utxos = []
    // const signMethods = ["Seed in browser wallet", "Wif (PrivKey)", "Copy & paste seed phrase", "External Pst (E.g. Ethereum)", "Hardware Wallet"];
    const signMethods = ["Wif (PrivKey)"] //, "Wif (PrivKey)", "Copy & paste seed phrase", "External Pst (E.g. Ethereum)", "Hardware Wallet"];
    let selectedSigningMethod = signMethods[1];

    let changeAddress = senderAddress 
    let transactionFee = selectedRowIds.length * 180 + 3 * 34
    let schwartzPerByte = 210 //TODO why is that so high? shoulld be 50x lower
    let storageFee = 500000  //or 88100 - a roughly estimated transaction fee
    let byteLength = 0
    if(nameId) transactionFee += storageFee //storageFee
    
    $: transactionFee = byteLength*schwartzPerByte+(nameId?storageFee:0) //add storagefee when nameId was set
    $: transactionFee<Number($electrumBlockchainRelayfee*100000000)?transactionFee=Number($electrumBlockchainRelayfee*100000000):0
    $: utxoSum = 0 //TODO utxos.reduce((sum, utxo) => sum + (utxo.value*100000000), 0); //get sum of all utxo values
    $: changeAmount = utxoSum - (doiAmount+transactionFee)

    onMount(()=>{
        parseSelectedRowIds()
        signTransaction().then((tx)=>{
            byteLength = tx.byteLength()//schwartz per byte
            transactionFee = byteLength*schwartzPerByte
            console.log("test sign transaction to calculated tx byte length",tx.byteLength())
            console.log("transactionFee",transactionFee)
        })
    })

    function parseSelectedRowIds() {
        const parsedUtxos = [];
        selectedRowIds.forEach(rowId => {
            const underscoreIndex = rowId.lastIndexOf('_');
            const txid = rowId.substring(0, underscoreIndex);
            const n = parseInt(rowId.substring(underscoreIndex + 1), 10);

            txs.forEach(tx => {
                tx.vout.forEach(vout => {
                    if (vout.n === n && tx.txid === txid) {
                        parsedUtxos.push({
                            txid: tx.txid,
                            vout: [vout] // Wrap in an array to maintain structure
                        });
                    }
                });
            });
        });
        utxos = parsedUtxos;
        console.log("parsedUtxos",parsedUtxos)
    }

    async function signTransaction() {

        let keyPair
        if($currentWif)
            keyPair = ECPair.fromWIF($currentWif,$network);

        const psbt = new bitcoin.Psbt({ network: $network });
        let totalInputAmount = 0;

        utxos.forEach(utxo => {
            //TODO https://bitcoin.stackexchange.com/questions/116128/how-do-i-determine-whether-an-input-or-output-is-segwit-revisited
            // const valueInSatoshis = Math.round(utxo.value * 100000000);
            console.log("adding utxo to transaction",utxo)
            // utxo.vout.forEach(vout =>{
            //     const scriptPubKeyHex = vout.scriptPubKey.hex
            //     const isSegWit = scriptPubKeyHex?.startsWith('0014') || scriptPubKeyHex?.startsWith('0020');
            //     if(vout.scriptPubKey.addresses[0]===senderAddress){
            //         console.log("adding ",utxo)
            //         if (isSegWit) {
            //             // This is a SegWit UTXO
            //             psbt.addInput({
            //                 hash: utxo.txid,
            //                 index: vout.n,
            //                 witnessUtxo: {
            //                     script: Buffer.from(scriptPubKeyHex, 'hex'),
            //                     value: valueInSatoshis,
            //                 }
            //             });
            //         } else {     // This is a non-SegWit UTXO
            //             psbt.addInput({
            //                 hash: utxo.txid,
            //                 index: vout.n,
            //                 nonWitnessUtxo: Buffer.from(utxo.hex, 'hex')
            //             });
            //         }
            //         totalInputAmount += valueInSatoshis;
            //     }
            //
            // });
        })


        let totalOutputAmount = 0;
        if(!nameId){
            console.log("recipientAddress coin output",recipientAddress)
            psbt.addOutput({
                address: recipientAddress,
                value: doiAmount,
            });
            totalOutputAmount += doiAmount;
        }
        else{
            console.log("recipientAddress namescript output",recipientAddress)
            const opCodesStackScript = getNameOPStackScript(nameId,nameValue,recipientAddress,$network)
            psbt.setVersion(VERSION) //use this for name transactions
            psbt.addOutput({
                script: opCodesStackScript,
                value: doiAmount
            })
            totalOutputAmount += doiAmount;
        }
        psbt.addOutput({
            address: changeAddress,
            value: changeAmount,
        });
        totalOutputAmount += changeAmount;
        console.log("changeAddress:     ", changeAmount);
        console.log("Total Input Amount:", totalInputAmount);
        console.log("Total Output Amount:", totalOutputAmount);

        utxos.forEach(utxo => {
            utxo.vout.forEach((utxo, index) => {
                if(utxo.scriptPubKey.addresses[0]===senderAddress){
                    console.log("singing utxo",utxo)
                    console.log("singing index",index)
                    psbt.signInput(index, keyPair);
                }
            });
        });

            // psbt.validateSignaturesOfInput(0, validator); //TODO https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts
            psbt.finalizeAllInputs();

            return psbt.extractTransaction()
    }
    // })

</script>

<!--
@component
Opens a confirmation modal that should sign a transaction and send it to ElectrumX
-->
<ComposedModal open on:close={() => dispatch('result', false)} on:submit={ async () => {

    try {
        const signedTx = await signTransaction()
        console.log("sending transaction to ElectrumX",signedTx.toHex())
        const txHash = await $electrumClient.request('blockchain.transaction.broadcast',[signedTx.toHex()]);
        console.log("txid received from node",txHash)
        dispatch('result', true); // Dispatch the result with the transaction hex
    }
    catch(ex){
        console.log("ex",ex)
        dispatch('result', false);
    }



}}>
    <ModalHeader label="Sign transaction" title={heading} />

    <ModalBody hasForm>
        <Grid>
            <Row>
                <Column><h5>NameId:</h5></Column>
                <Column><h5>{nameId}</h5></Column>
            </Row>
            <Row>
                <Column><h5>NameValue:</h5></Column>
                <Column><h5>{nameValue}</h5></Column>
            </Row>
            <Row>
                <Column><h5>Recipient Address:</h5></Column>
                <Column><h5>{recipientAddress}</h5></Column>
            </Row>
            <Row>
                <Column><h5>Change Address:</h5></Column>
                <Column><h5>{changeAddress}</h5></Column>
            </Row>
            <Row>
                <Column><h5>Transfer Amount:</h5></Column>
                <Column><h5>{doiAmount}</h5></Column>
            </Row>
            <Row>
                <Column><h5>Utxo Sum:</h5></Column>
                <Column><h5>{utxoSum}</h5></Column>
            </Row>
            <Row>
                <Column><h5>Transaction Size (in byte):</h5></Column>
                <Column>
                    <TextInput type="number" value={byteLength}  min="0" />
                </Column>
            </Row>
            <Row>
                <Column><h5>Schwartz Per Byte:</h5></Column>
                <Column>
                    <TextInput type="number" bind:value={schwartzPerByte}  min="0" />
                </Column>
            </Row>
            <Row>
                <Column><h5>Transaction Fee:</h5></Column>
                <Column>
                    <TextInput type="number" bind:value={transactionFee}  min="0" />
                </Column>
            </Row>
            {#if nameId}
              <Row>
                  <Column><h5>Storage Fee:</h5></Column>
                  <Column>
                  <TextInput type="number" bind:value={storageFee}  min="0" />
                  </Column>
              </Row>
            {/if}

            <Row>
                <Column><h5>Min Relay Fee:</h5></Column>
                <Column>
                    <TextInput type="number" value={Number($electrumBlockchainRelayfee*100000000)}  min="0" />
                </Column>
            </Row>
            <Row>
                <Column><h5>Change Amount:</h5></Column>
                <Column><h5>{changeAmount}</h5></Column>
            </Row>
            <Row>
                <RadioButtonGroup
                  legendText="Sign with"
                  name="signature"
                  bind:selected={selectedSigningMethod}
                >
                {#each signMethods as value (value)}
                    <RadioButton labelText={value} {value} />
                {/each}
                </RadioButtonGroup>

                <div style="margin: var(--cds-layout-03) 0">
                    {#each signMethods as value (value)}
                        <Button
                          size="small"
                          kind="secondary"
                          disabled={selectedSigningMethod === value}
                          on:click={() => (selectedSigningMethod = value)}
                        >
                            {#if value==='Wif (PrivKey)'}
                                <TextInput bind:value={$currentWif} labelText="PrivateKey (Wif)" placeholder="Enter wif..." />
                            {:else}
                                not implemented yet
                            {/if}
                        </Button>
                    {/each}
                </div>
                Selected Signature Method:
                <strong>{selectedSigningMethod}</strong>
            </Row>
        </Grid>
    </ModalBody>

    <ModalFooter
        primaryButtonText={PrimaryButtonText}
        selectorPrimaryFocus=".bx--btn--primary"
        secondaryButtons={[
            { text: CancelOperationButtonText }
        ]}
        on:click:button--secondary={({ detail }) => {
             if (detail.text === CancelOperationButtonText) dispatch('result', false);
            // if (detail.text === SendMyContactData) dispatch('result', (dontRequestData || !exchangeData)?"ONLY_HANDOUT":true)
        }}
    />
</ComposedModal>
<style>

</style>
