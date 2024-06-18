<script>
	import { Button, Column, Grid, Row, TextInput } from 'carbon-components-svelte';
	import { crypto } from 'bitcoinjs-lib';
	import { connectedServer, electrumClient, helia } from './store.js';
	import { getNameOpUTXOsOfTxHash } from '$lib/getNameOpUTXOsOfTxHash.js'
	import { getMetadataFromIPFS } from '$lib/nft/getMetadataFromIPFS.js';
	import { getImageUrlFromIPFS } from '$lib/nft/getImageUrlFromIPFS.js';
	import { path } from './router.js';

	let nameToCheck = $path.substring($path.lastIndexOf("/")+1)!=='nameCheck'?$path.substring($path.lastIndexOf("/")+1):''
	if(!nameToCheck) nameToCheck='PeaceDove-CC'

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
            const detailResults = await getNameOpUTXOsOfTxHash($electrumClient,item.tx_hash);
						results = [...results, ...detailResults.nameOpUtxos];
        }
	}
	$:($connectedServer && nameToCheck)?checkName():null
	$:console.log("results", results);

	const readMetaData = async (tokenUri) => {
		console.log("now reading metadata",tokenUri)
		return await getMetadataFromIPFS($helia,tokenUri)
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
&nbsp;
		</Column>
	</Row>
    <Row>
        <Column>
            {#if results.length > 0}
                <ul>
                    {#each results as tx}
											<p>Name found in Doichain TX
												<li>wallet address: {tx.address}</li>
												<li>txid: {tx.txid}</li>
												<li>time: {tx.formattedBlocktime}</li>
												<li>nameId: {tx.nameId}</li>
												<li>nameValue: {tx.nameValue}</li>
												<li>DOI amount: {tx.value}</li>
											</p>
											<p>&nbsp;</p>
											{#await readMetaData(tx.nameValue)}
												<p>loading for nft data...</p>
											{:then nft}

												<p>NFT: {nft.name}</p>
												<p>Description: {nft.description}</p>

												{#await getImageUrlFromIPFS($helia,nft.image)}
													<p>loading for img from ipfs url {nft.image}... <br>
														(can take some time - helia node needs to find enough peers!)</p>
												{:then img}
													{#if img}
														<img src={img} alt={nft.name} />
													{/if}
												{:catch error}

												{/await}
											{:catch error}

											{/await}
											<p>&nbsp;</p>
                    {/each}
                </ul>
            {:else}
                <p>No NameId found for given entry.</p>
            {/if}
        </Column>
    </Row>
</Grid>

