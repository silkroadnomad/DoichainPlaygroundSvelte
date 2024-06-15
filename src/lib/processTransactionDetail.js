import nameOpUtxos from '../routes/nameOpUtxos.svelte';
import moment from 'moment';

/**
 * Takes a transactionId
 * @param tx
 * @returns {Promise<void>}
 */
export async function processTransactionDetails(electrumClient, tx) {
	console.log('Processing transaction details');
	const nameOpUtxos = []
	let outputsScanned = 0
	const txDetails = await electrumClient.request('blockchain.transaction.get', [tx, true]);
	for (const vout of txDetails.vout) {
		console.log(vout);
		const asm = vout.scriptPubKey.asm;
		const asmParts = asm.split(" ");
		if (asmParts[0] !== 'OP_10' && asmParts[0] !== 'OP_NAME_DOI') {
			// This condition is currently empty and can be used for other operations if needed.
		} else {
			let _tx = {};
			_tx.nameId = vout.scriptPubKey.nameOp.name;
			_tx.nameValue = vout.scriptPubKey.nameOp.value;
			_tx.address = vout.scriptPubKey?.addresses ? vout.scriptPubKey.addresses[0] : undefined;

			// if (_tx.nameId.indexOf('/') !== -1) {
			// 	const newNameSpace = _tx.nameId.substring(0, _tx.nameId.indexOf('/'));
			// 	if (!nameSpaces.includes(newNameSpace)) nameSpaces.push(newNameSpace);
			// } else {
			// 	quatsch.push(_tx.nameId);
			// }

			nameOpUtxos.push({
				txid: txDetails.txid,
				formattedBlocktime: txDetails.blocktime ? moment.unix(txDetails.blocktime).format('YYYY-MM-DD HH:mm:ss') : 'mempool',
				n: vout.n,
				value: vout.value,
				nameId: _tx.nameId,
				nameValue: _tx.nameValue,
				address: _tx.address
			});
		}
		outputsScanned++;
	}
	return {nameOpUtxos, outputsScanned}
}