<script>
    import {createEventDispatcher} from "svelte";
    import { Column, Modal, Toggle, Grid, Row, Checkbox } from 'carbon-components-svelte';
    import QrCode from "svelte-qrcode"
    const dispatch = createEventDispatcher();

    export let qrCodeData
    export let qrCodeOpen
</script>

    <Modal bind:open={ qrCodeOpen }
       modalHeading="Scan"
       primaryButtonText="OK"
       secondaryButtonText="Close"
       on:click:button--primary={ () => { qrCodeOpen=false; qrCodeData=undefined; dispatch('close') } }
       on:click:button--secondary={ () => { qrCodeOpen=false; qrCodeData=undefined; dispatch('close') }  }
       on:submit={() => () => { qrCodeOpen=false; qrCodeData=undefined; dispatch('close') }}
       on:close={ () => dispatch('close')}>
    <Grid>
        <Row>
            <h3>Scan QR-Code</h3>
        </Row>
        <Row>
            <Column>
                {#if qrCodeData && qrCodeOpen}
                    <div class="container" on:click={ async () => {
                            await navigator.clipboard.writeText(qrCodeData);
                            qrCodeOpen=false;
                            dispatch('close')
                        }}>
                        <QrCode  value={qrCodeData} />
                    </div>
                {/if}
            </Column>
        </Row>
    </Grid>
</Modal>