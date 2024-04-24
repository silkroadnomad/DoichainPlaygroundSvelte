<script>
    import { ComposedModal, ModalHeader, ModalBody, ModalFooter, ExpandableTile, Column, Grid, Row, Checkbox } from "carbon-components-svelte";
    import { onMount, createEventDispatcher } from "svelte";
    import * as bitcoin from 'bitcoinjs-lib';

    /** dispatches the events when a button was clicked*/
    const dispatch = createEventDispatcher();

    /** the header of the modal @type {string} [heading='deContact Protocol Action'] */
    export let heading = 'Simple Coin Transaction ';
    export let PrimaryButtonText = 'Sign transaction'
    export let CancelOperationButtonText = 'Cancel'
    export let recipientAddress
    export let doiAmount
    export let utxos
    
    onMount(() => {

    });

    function signTransaction() {
        const keyPair = bitcoin.ECPair.makeRandom(); // Generate a random keypair for example purposes
        const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
        const txb = new bitcoin.TransactionBuilder();
        txb.setVersion(1);
        utxos.forEach(utxo => {
            txb.addInput(utxo.txid, utxo.n); // Add each UTXO as an input
        });
        txb.addOutput(recipientAddress, amount); // The recipient and amount to send
        utxos.forEach((utxo, index) => {
            txb.sign(index, keyPair); // Sign each input
        });
        const transaction = txb.build();
        const txHex = transaction.toHex();

        console.log("Signed Transaction: ", txHex);
        dispatch('result', true, txHex); // Dispatch the result with the transaction hex
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
