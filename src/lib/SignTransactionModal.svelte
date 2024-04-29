<script>
    import {
        ComposedModal, ModalHeader, ModalBody, ModalFooter, Button,
        RadioButtonGroup,
        RadioButton, Column, Grid, Row, TextInput
    } from 'carbon-components-svelte';

    import { createEventDispatcher } from "svelte";
    import { electrumClient, network } from '../routes/store.js';
    import * as bitcoin from 'bitcoinjs-lib';
    import * as ecc from 'tiny-secp256k1';
    import ECPairFactory from 'ecpair';
    const ECPair = ECPairFactory(ecc);
    /** dispatches the events when a button was clicked*/
    const dispatch = createEventDispatcher();

    /** the header of the modal @type {string} [heading='deContact Protocol Action'] */
    export let heading = 'Simple Coin Transaction ';
    export let PrimaryButtonText = 'Sign transaction'
    export let CancelOperationButtonText = 'Cancel'
    export let recipientAddress = "mhdCXgZDmpbZRrVyyHLPwYFg59HGLHRUMa"
    export let doiAmount = 1
    export let utxos
    export let wifPrivKey = "cW345pfTEn4wTRqv8qyu5U5SoQ37dqth83Wg93qkPmWT61WqreGC"

    const signMethods = ["Seed in browser wallet", "Wif (PrivKey)", "Copy & paste seed phrase", "External Pst (E.g. Ethereum)", "Hardware Wallet"];
    let selectedSigningMethod = signMethods[1];

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
        console.log("recipientAddress",recipientAddress)
        psbt.addOutput({
            address: recipientAddress,
            value: 4999911900,
        });

        utxos.forEach((utxo, index) => {
             psbt.signInput(index, keyPair);
        });

        // psbt.validateSignaturesOfInput(0, validator); //TODO https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts
        psbt.finalizeAllInputs();

        const txHex = psbt.extractTransaction().toHex()

        const txhash = await $electrumClient.request('blockchain.transaction.broadcast',[txHex]);
        console.log("transaction sent",txhash)
        dispatch('result', true); // Dispatch the result with the transaction hex
    }
</script>

<!--
@component
Opens a confirmation modal that should sign a transaction and send it.
-->
<ComposedModal open on:close={() => dispatch('result', false)} on:submit={signTransaction}>
    <ModalHeader label="Sign transaction" title={heading} />

    <ModalBody hasForm>
        <Grid>
            <Row>
                <Column><h5>recipientAddress</h5></Column>
                <Column><h5>{recipientAddress}</h5></Column>
            </Row>
            <Row>
                <Column><h5>doiAmount</h5></Column>
                <Column><h5>{doiAmount}</h5></Column>
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

                Selected plan:
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
