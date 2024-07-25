<script>
    import { createEventDispatcher } from 'svelte';
    import { Column, Modal, Grid, Row } from 'carbon-components-svelte';
    import { detectFileType, renderQRImage, splitQRs } from 'bbqr';

    /**
     *     T for transaction
     *     P for PSBT
     *     J for a text file that can be successfully parsed as JSON.
     *     U for all other text files.
     *     B for all other binary files.
     */
    const dispatch = createEventDispatcher();

    export let qrCodeData
    export let qrCodeOpen

    let detected, splitResult, imgDataUrl

    const generateQRCode = (_generateQRCode) => {
        if(_generateQRCode){
            detectFileType(_generateQRCode).then(_detected => {
                detected=_detected
                console.log("detected.fileType",detected.fileType);
                splitResult = splitQRs(_detected.raw, _detected.fileType, {
                    // these are optional - default values are shown
                    encoding: 'Z', // Zlib compressed base32 encoding
                    minSplit: 1, // minimum number of parts to return
                    maxSplit: 1295, // maximum number of parts to return
                    minVersion: 5, // minimum QR code version
                    maxVersion: 40, // maximum QR code version
                });

                console.log("splitResult.version",splitResult.version)
                console.log("splitResult.encoding",splitResult.encoding)
                console.log("splitResult.parts",splitResult.parts)

                renderQRImage(splitResult.parts, splitResult.version, {
                    // optional settings - values here are the defaults
                    frameDelay: 250,
                    randomizeOrder: false,
                }).then( imgBuffer => {
                    // convert to data URL for display
                    const base64String = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
                    imgDataUrl = `data:image/png;base64,${base64String}`;
                })
            });
        }
    }
    $:generateQRCode(qrCodeData)
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
                        <img src={imgDataUrl} />
<!--                        <QrCode  value={qrCodeData} />-->
                    </div>
                {/if}
            </Column>
        </Row>
    </Grid>
</Modal>