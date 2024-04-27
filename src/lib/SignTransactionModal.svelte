<script>
    import {
        ComposedModal, ModalHeader, ModalBody, ModalFooter, Button,
        RadioButtonGroup,
        RadioButton, Column, Grid, Row, TextInput
    } from 'carbon-components-svelte';

    import { createEventDispatcher } from "svelte";
    import { network } from '../routes/store.js';
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
    export let doiAmount = "1"
    export let utxos
    export let wifPrivKey = "cW345pfTEn4wTRqv8qyu5U5SoQ37dqth83Wg93qkPmWT61WqreGC"

    const signMethods = ["Seed in browser wallet", "Wif (PrivKey)", "Copy & paste seed phrase", "External Pst (E.g. Ethereum)", "Hardware Wallet"];
    let selectedSigningMethod = signMethods[1];

    function signTransaction() {

        let keyPair
        if(wifPrivKey)
            keyPair = ECPair.fromWIF(wifPrivKey,$network);

        const psbt = new bitcoin.Psbt({ network: $network });
        psbt.setVersion(2); // These are defaults. This line is not needed.
        psbt.setLocktime(0); // These are defaults. This line is not needed.
        console.log("utxos",utxos)
        utxos.forEach(utxo => {
            //txb.addInput(utxo.txid, utxo.n); // Add each UTXO as an input
            psbt.addInput({
                // if hash is string, txid, if hash is Buffer, is reversed compared to txid
                hash: utxo.txid,
                // hash: '0000000000000000000000000000000000000000000000000000000000000000',
                index: utxo.n,
                // index: 0xffffffff,
                sequence: 0xffffffff, // These are defaults. This line is not needed.
                // coinbase: Buffer.from('02ca000101', 'hex'),

                // non-segwit inputs now require passing the whole previous tx as Buffer
                nonWitnessUtxo: Buffer.from(utxo.hex,'hex'
                  // value in satoshis (Int64LE) = 0x015f90 = 90000
                  // '0x12A607200' +
                  // // scriptPubkey length in hex (50 characters = 25 bytes)
                  // '19' +
                  // // scriptPubkey
                  // '76a914171ea14e42f1893cf4a3b7775798cd472881d52788ac' +
                  // // locktime
                  // '00000000',
                  // 'hex',
                ),

                // // If this input was segwit, instead of nonWitnessUtxo, you would add
                // // a witnessUtxo as follows. The scriptPubkey and the value only are needed.
                // witnessUtxo: {
                //   script: Buffer.from('0000000000000000000000000000000000000000000000000000000000000000','hex'),
                //   value: 5000000000,
                // },
                // witnessUtxo: {
                //     script: Buffer.from('76a914000000000000000000000000000000000000000088ac', 'hex'), // A dummy P2PKH script, replace with actual if known.
                //     value: 5000000000, // The value in satoshis rewarded by the coinbase transaction, adjust as necessary.
                // },

  // The witness stack for the coinbase transaction, if required.
  // witnessScript: Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')


                // Not featured here:
                //   redeemScript. A Buffer of the redeemScript for P2SH
                //   witnessScript. A Buffer of the witnessScript for P2WSH
            })
        });
        console.log("recipientAddress",recipientAddress)
        psbt.addOutput({
            address: recipientAddress,
            value: 4999991900,
        });

        utxos.forEach((utxo, index) => {
             psbt.signInput(index, keyPair);
        });

        // psbt.validateSignaturesOfInput(0, validator); //TODO https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts
        psbt.finalizeAllInputs();

        const txHex = psbt.extractTransaction().toHex()
        // txb.setVersion(1);
        // utxos.forEach(utxo => {
        //     txb.addInput(utxo.txid, utxo.n); // Add each UTXO as an input
        // });
        // txb.addOutput(recipientAddress, doiAmount); // The recipient and amount to send

        // utxos.forEach((utxo, index) => {
        //     txb.sign(index, keyPair); // Sign each input
        // });
        // const transaction = txb.build();
        // const txHex = transaction.toHex();
        //
        console.log("Signed Transaction: ", txHex);
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
