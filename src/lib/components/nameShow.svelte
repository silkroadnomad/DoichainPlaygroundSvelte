<script>
	import { onMount } from 'svelte';
	import { nameShow } from '$lib/nameShow.js'
	import { getImageUrlFromIPFS } from '$lib/nft/getImageUrlFromIPFS.js'
	import { getMetadataFromIPFS } from '$lib/nft/getMetadataFromIPFS.js'
	import { 
		Button,
		TextInput,
		Tile,
		Grid,
		Row,
		Column,
		Loading
	} from 'carbon-components-svelte';

	export let nameToCheck = 'PeaceDove-CC'
    export let electrumClient;
    export let helia;

	let results = [];
	
	onMount(async () => {
        if (nameToCheck && electrumClient) {
            results = await nameShow(electrumClient, nameToCheck);
        }
    });
</script>

<div class="nameShow">
	<Grid>
		<Row>
			<Column>
				<TextInput
					on:keydown={
						async (event) => { if (event.key === 'Enter') { results = await nameShow(electrumClient,nameToCheck)} }}
						 bind:value={nameToCheck} />
			</Column>
			<Column>
				<Button on:click={ async () => results = await nameShow(electrumClient,nameToCheck)} >NameShow</Button>
			</Column>
		</Row>
	</Grid>
<p>&nbsp;</p>
	{#if results.length > 0}
		{#each results as tx}
			{#if tx.scriptPubKey.nameOp }
				<Tile>
					<Grid>
						<Row>
							<Column>
								<h4>{tx.scriptPubKey.nameOp.name} ({tx.formattedBlocktime})</h4>
							</Column>
						</Row>
						<Row>
							<Column>
								{#await getMetadataFromIPFS(helia,tx.scriptPubKey.nameOp.value)}
									<Loading description="Loading NFT data..." small />
								{:then nft}
									<h5>NFT: {nft.name}</h5>
									<p>Description: {nft.description}</p>
									
									{#await getImageUrlFromIPFS(helia,nft.image)}
										<Loading 
											description="Loading image from IPFS... (can take some time - helia node needs to find enough peers!)" 
											small 
										/>
									{:then img}
										{#if img}
											<img src={img} alt={nft.name} style="max-width: 300px; max-height: 300px; object-fit: contain;" />
										{/if}
									{:catch error}
										<p class="error">Error loading image: {error.message}</p>
									{/await}
								{:catch error}
									<p class="error">Error loading NFT data: {error.message}</p>
								{/await}
							</Column>
						</Row>
						<Row>
							<Column>
								<Grid narrow>
									<Row>
										<Column>Wallet address:</Column>
										<Column>{tx.scriptPubKey.addresses[0]}</Column>
									</Row>
									<Row>
										<Column>txid:</Column>
										<Column>{tx.txid}</Column>
									</Row>
									<Row>
										<Column>time:</Column>
										<Column>{tx.formattedBlocktime}</Column>
									</Row>
									<Row>
										<Column>name:</Column>
										<Column>{tx.scriptPubKey.nameOp.name}</Column>
									</Row>
									<Row>
										<Column>value:</Column>
										<Column>{tx.scriptPubKey.nameOp.value}</Column>
									</Row>
									<Row>
										<Column>DOI amount:</Column>
										<Column>{tx.value}</Column>
									</Row>
								</Grid>
							</Column>
						</Row>
						<Row>
							<Column>
								<Button 
									kind="tertiary"
									on:click={() => alert('coming soon')}
								>
									Buy
								</Button>
							</Column>
						</Row>
					</Grid>
				</Tile>
				{/if}
			{/each}
		{:else}
			<p>No NameId found for given entry.</p>
		{/if}
</div>
<style>
    .nameShow {
				padding: 1rem;
				font-size: small !important;
				background-color: #f1f3f5; 
				color: var(--text-3);
		}
    .nameShow p {
        font-size: inherit;
    }
		.nameShow img {
        max-width: 300px;
        max-height: 300px;
        object-fit: contain;
        margin: 1rem 0;
    }
    .error {
        color: #da1e28;
    }
</style>
