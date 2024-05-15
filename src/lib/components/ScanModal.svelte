<script>
    import { createEventDispatcher } from "svelte";
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
    $: {
        if (result && parts.indexOf(result) === -1) {
            clearTimeout(scanTimeout);
            parts.push(result);
            scanTimeout = setTimeout(() => {
                if (parts.length === 1 || foundParts === parts.length) {
                    console.log("parts",parts)
                    const reassembled = joinQRs(parts)
                    console.log(reassembled.fileType); // true
                    console.log(reassembled.encoding); // true
                    const decoder = new TextDecoder('utf-8'); // Assuming UTF-8 encoding
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
</script>

<Modal bind:open={ scanOpen }
       modalHeading="Scanner"
       primaryButtonText="OK"
       secondaryButtonText="Close"
       on:click:button--primary={ () => { scanOpen=false; scanData=result; dispatch('close') } }
       on:click:button--secondary={ () => { scanOpen=false; scanData=undefined; dispatch('close') }  }
       on:submit={ () => () => { scanOpen=false; scanData=result; dispatch('close') }}
       on:close={ () => dispatch('close')}>
    <Grid>
        <Row>
            <Column>

                <Scanner bind:result>
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