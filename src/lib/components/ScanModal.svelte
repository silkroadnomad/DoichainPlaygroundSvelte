<script>
    import { createEventDispatcher } from "svelte";
    import { Column, Modal, Grid, Row } from 'carbon-components-svelte';
    import {Scanner} from '@peerpiper/qrcode-scanner-svelte'
    const dispatch = createEventDispatcher();
    let result = "";
    $:{
        if(result){
            scanData=result
            scanOpen=false
        }
    }
    export let scanOpen
    export let scanData
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