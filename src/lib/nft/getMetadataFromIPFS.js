import { unixfs } from '@helia/unixfs'

/**
 * getMetadataFromIPFS
 *
 * @param helia
 * @param tokenURI the tokenUri (from Doichain Transaction)
 * @returns {Promise<any>}
 */
export async function getMetadataFromIPFS(helia, tokenURI) {
	const fs = unixfs(helia)
	const decoder = new TextDecoder()
	let text = ''
	let cid
	if (tokenURI.startsWith('ipfs://') || tokenURI.startsWith('ipns://')) {
		cid = tokenURI.split('//')[1];
	}
	for await (const chunk of fs.cat(cid)) {
		text += decoder.decode(chunk, {
			stream: true
		})
	}
	console.log("text",text)
	return JSON.parse(text);
}