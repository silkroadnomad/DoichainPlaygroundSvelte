<script>
    import { ComposedModal, ModalHeader, ModalBody, ModalFooter, ExpandableTile, Column, Grid, Row, Checkbox } from "carbon-components-svelte";
    import { onMount, createEventDispatcher } from "svelte";


    /** dispatches the events when a button was clicked*/
    const dispatch = createEventDispatcher();

    /** the header of the modal @type {string} [heading='deContact Protocol Action'] */
    export let heading = 'Simple Coin Transaction ';
    export let PrimaryButtonText = 'Sign transaction'
    export let CancelOperationButtonText = 'Cancel'
    export let recipientAddress
    export let doiAmount

    onMount(() => {

    });
</script>

<!--
@component
Opens a confirmation modal that should sign a transaction and send it.
-->
<ComposedModal open on:close={() => dispatch('result', false)} on:submit={() => dispatch('result', true)}>
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
