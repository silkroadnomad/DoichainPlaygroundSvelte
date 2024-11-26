<script>
    import { createEventDispatcher, onDestroy } from "svelte";
    import { Column, Modal, Grid, Row } from 'carbon-components-svelte';
    import { Scanner } from '@peerpiper/qrcode-scanner-svelte'
    import { joinQRs } from 'bbqr';

    const dispatch = createEventDispatcher();
    
    let result = "";
    let parts = []
    let foundParts = 0
    let scanTimeout;
    const scanTimeoutDuration = 1000;
    export let scanOpen
    export let scanData
    let scanner;

    $: {
        if (result && parts.indexOf(result) === -1) {
            clearTimeout(scanTimeout);
            parts.push(result);
            scanTimeout = setTimeout(() => {
                if (parts.length === 1 || foundParts === parts.length) {
                    const reassembled = joinQRs(parts)
                    console.log(reassembled.fileType);
                    console.log(reassembled.encoding);
                    const decoder = new TextDecoder('utf-8');
                    const decodedString = decoder.decode(new Uint8Array(reassembled.raw));
                    console.log(JSON.parse(decodedString));

                    scanData = JSON.parse(decodedString);
                    scanOpen = false;
                    dispatch('close');
                }
            }, scanTimeoutDuration);
        } else {
            foundParts += 1;
        }

        if (foundParts === parts.length && parts.length > 1) {
            scanOpen = false;
            dispatch('close');
        }
    }

    onDestroy(() => {
        if (scanner) {
            scanner = undefined;
        }
    });

    const handleClose = () => {
        console.log('ScanModal: handleClose called');
        if (scanner) {
            console.log('ScanModal: stopping scanner');
            scanner = undefined;
        }
        console.log('ScanModal: setting scanOpen to false');
        scanOpen = false;
        console.log('ScanModal: dispatching close event');
        dispatch('close');
    };
</script>

<Modal bind:open={ scanOpen }
       modalHeading="Scanner"
       primaryButtonText="OK"
       secondaryButtonText="Close"
       on:click:button--primary={ () => { 
           console.log('ScanModal: Primary button clicked');
           scanData = result;
           handleClose();
       }}
       on:click:button--secondary={ () => { 
           console.log('ScanModal: Secondary button clicked');
           scanData = undefined;
           handleClose();
       }}
       on:submit={ () => { 
           scanData = result;
           handleClose();
       }}
       on:close={ () => {
           scanData = undefined;
           handleClose();
       }}>
    <Grid>
        <Row>
            <Column>

                <Scanner bind:this={scanner} bind:result>
                    <!-- Insert custom results component if you want to do something unique with the QR code data -->
                    <!-- override default by placing handler in here  -->
                    {#if result}
                        <div>
                            The result is: {result}
                        </div>
                        <div>
                            <button on:click={() => (result = null)}>Scan again</button>
                        </div>
                    {/if}
                </Scanner>
            </Column>
        </Row>
    </Grid>
</Modal>