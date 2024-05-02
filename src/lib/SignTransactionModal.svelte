<script>
    import {
        ComposedModal, ModalHeader, ModalBody, ModalFooter, Button,
        RadioButtonGroup,
        RadioButton, Column, Grid, Row, TextInput
    } from 'carbon-components-svelte';

    import { createEventDispatcher, onMount } from 'svelte';
    import { electrumClient, network } from '../routes/store.js';
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
    export let senderAddress 
    export let recipientAddress
    export let txName
    export let txValue
    // export let doiAddress
    export let doiAmount = 100000000 //in schwartz
    export let changeAmount = 0
    export let utxos
    export let wifPrivKey = "cMhr8icXFKEhfrCEq823DsPhQauwwsSgm89bcYyELdMEozoh7gk3" //TODO remove this test-key

    // const signMethods = ["Seed in browser wallet", "Wif (PrivKey)", "Copy & paste seed phrase", "External Pst (E.g. Ethereum)", "Hardware Wallet"];
    const signMethods = ["Wif (PrivKey)"] //, "Wif (PrivKey)", "Copy & paste seed phrase", "External Pst (E.g. Ethereum)", "Hardware Wallet"];
    let selectedSigningMethod = signMethods[1];

    let changeAddress = senderAddress 
    let transactionFee = utxos.length * 180 + 3 * 34
    let schwartzPerByte = 1000 //TODO why is that so high? shoulld be 50x lower
    let storageFee = 500000  //or 88100 - a roughly estimated transaction fee
    let byteLength = 0
    if(txName) transactionFee += storageFee //storageFee
    
    $: transactionFee = byteLength*schwartzPerByte+(txName?storageFee:0) //add storagefee when txName was set
    $: utxoSum = utxos.reduce((sum, utxo) => sum + (utxo.value*100000000), 0); //get sum of all utxo values
    $: changeAmount = utxoSum - (doiAmount+transactionFee)

    console.log("utxos",utxos)
    console.log("utxoSum",utxoSum)

    onMount(()=>{
        signTransaction().then((tx)=>{
            byteLength = tx.byteLength()//schwartz per byte
            transactionFee = byteLength*schwartzPerByte
            console.log("test sign transaction to calculated tx byte length",tx.byteLength())
            console.log("transactionFee",transactionFee)
        })
    })

    async function signTransaction() {

        let keyPair
        if(wifPrivKey)
            keyPair = ECPair.fromWIF(wifPrivKey,$network);

        const psbt = new bitcoin.Psbt({ network: $network });
        utxos.forEach(utxo => {

            //TODO https://bitcoin.stackexchange.com/questions/116128/how-do-i-determine-whether-an-input-or-output-is-segwit-revisited
            const scriptPubKeyHex = utxo.scriptPubKey; // Assuming this is provided in hex format
            const isSegWit = scriptPubKeyHex?.startsWith('0014') || scriptPubKeyHex?.startsWith('0020');

            if (isSegWit) {
                // This is a SegWit UTXO
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.n,
                    witnessUtxo: {
                        script: Buffer.from(scriptPubKeyHex, 'hex'),
                        value: utxo.value,
                    }
                });
            } else {     // This is a non-SegWit UTXO
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.n,
                    nonWitnessUtxo: Buffer.from(utxo.hex, 'hex')
                });
            }
        });

        if(!txName){
            console.log("recipientAddress coin output",recipientAddress)
            psbt.addOutput({
                address: recipientAddress,
                value: doiAmount,
            });
        }
        else{
            console.log("recipientAddress namescript output",recipientAddress)
            const opCodesStackScript = getNameOPStackScript(txName,txValue,recipientAddress,$network)
            psbt.setVersion(VERSION) //use this for name transactions
            psbt.addOutput({
                script: opCodesStackScript,
                value: doiAmount
            })
        }
        psbt.addOutput({
            address: changeAddress,
            value: changeAmount,
        });

        utxos.forEach((utxo, index) => {
             psbt.signInput(index, keyPair);
        });

        // psbt.validateSignaturesOfInput(0, validator); //TODO https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts
        psbt.finalizeAllInputs();

        return psbt.extractTransaction()
    }

</script>

<!--
@component
Opens a confirmation modal that should sign a transaction and send it to ElectrumX
-->
<ComposedModal open on:close={() => dispatch('result', false)} on:submit={ async () => {
    const signedTx = await signTransaction()

    console.log("sending transaction to ElectrumX",signedTx.toHex())
    const txHash = await $electrumClient.request('blockchain.transaction.broadcast',[signedTx.toHex()]);
    console.log("txid received from node",txHash)
    dispatch('result', true); // Dispatch the result with the transaction hex
}}>
    <ModalHeader label="Sign transaction" title={heading} />

    <ModalBody hasForm>
        <Grid>
            <Row>
                <Column><h5>TxName:</h5></Column>
                <Column><h5>{txName}</h5></Column>
            </Row>
            <Row>
                <Column><h5>TxValue:</h5></Column>
                <Column><h5>{txValue}</h5></Column>
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
                <Column><h5>Storage Fee:</h5></Column>
                <Column>
                    <TextInput type="number" bind:value={storageFee}  min="0" />
                </Column>
            </Row>
            <Row>
                <Column><h5>Transaction Fee:</h5></Column>
                <Column>
                    <TextInput type="number" bind:value={transactionFee}  min="0" />
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
                                <TextInput bind:value={wifPrivKey} labelText="PrivateKey (Wif)" placeholder="Enter wif..." />
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
