<script>
	import { Button, Column, Grid, Row, TextInput } from 'carbon-components-svelte';
	import { crypto } from 'bitcoinjs-lib';
	import { electrumClient } from './store.js';

	let nameToCheck = 'hello'
	let result
	function pushData(data) {
		let buffer = [];
		const len = data.length;

		if (len < 0x4c) { // for data length less than 76 bytes
			buffer.push(len);
		} else if (len <= 0xff) { // for data length less than 256 bytes
			buffer.push(0x4c, len);
		} else if (len <= 0xffff) { // for data length less than 65536 bytes
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

		console.log("reversedHash", reversedHash);
		result = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash]);
		console.log("result", result);
	}

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

		</Column>
	</Row>
	{#if result && result.length > 0}
	    <ul>
	        {#each result as e}
						Name found in Doichain TX: {e.tx_hash}
	        {/each}
	    </ul>
	{:else}
	    <p>No NameId found for given entry.</p>
	{/if}
</Grid>

