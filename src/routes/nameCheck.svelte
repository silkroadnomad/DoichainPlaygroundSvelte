<script>
	import { Button, Column, Grid, Row, TextInput } from 'carbon-components-svelte';
	import { crypto } from 'bitcoinjs-lib';
	import { electrumClient } from './store.js';
	import { processTransactionDetails } from '../lib/processTransactionDetail.js'

	let nameToCheck = 'hello'
    let results = []; 

	function pushData(data) {
		let buffer = [];
		const len = data.length;

		if (len < 0x4c) { 
			buffer.push(len);
		} else if (len <= 0xff) { 
			buffer.push(0x4c, len);
		} else if (len <= 0xffff) { 
			buffer.push(0x4d, len & 0xff, len >>> 8);
		} else {
			buffer.push(0x4e, len & 0xff, (len >>> 8) & 0xff, (len >>> 16) & 0xff, len >>> 24);
		}

		buffer = Buffer.from(buffer).toString('hex').concat(Buffer.from(data).toString('hex'));
		return buffer;
	}

	const checkName = async () => {
		
		let script = '53' + pushData(nameToCheck) + pushData(new Uint8Array([])) + '6d' + '75' + '6a';
		let hash = crypto.sha256(Buffer.from(script, 'hex'));
		let reversedHash = Buffer.from(hash.reverse()).toString("hex");
		results = []
		const result = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash]);
        for (const item of result) {
            const detailResults = await processTransactionDetails($electrumClient,item.tx_hash);
						results = [...results, ...detailResults.nameOpUtxos];
        }
	}
	$:console.log("results", results);
</script>

<h1>Doichain Name Check</h1>
<Grid>
	<Row>
		<Column>
			<TextInput bind:value={nameToCheck}/>
		</Column>
		<Column>
			<Button on:click={checkName}
				kind="primary"
				size="small">Check</Button>
		</Column>
	</Row>
	<Row>
		<Column>
&nbsp;
		</Column>
	</Row>
    <Row>
        <Column>
            {#if results.length > 0}
                <ul>
                    {#each results as tx}
											<p>Name found in Doichain TX
												<li>txid: {tx.txid}</li>
												<li>time: {tx.formattedBlocktime}</li>
												<li>nameId: {tx.nameId}</li>
												<li>nameValue: {tx.nameValue}</li>
												<li>DOI amount:{tx.value}</li>
											</p>
											<p>&nbsp;</p>
                    {/each}
                </ul>
            {:else}
                <p>No NameId found for given entry.</p>
            {/if}
        </Column>
    </Row>
</Grid>

