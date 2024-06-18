import moment from 'moment';

/**
 * Takes a transactionId and returns name_op utxos in order to
 * extract and display nameIds and nameValues
 *
 * @param tx
 * @returns {Promise<void>}
 */
export async function getNameOpUTXOsOfTxHash(electrumClient, tx) {

	const nameOpUtxos = []
	let outputsScanned = 0

	const txDetails = await electrumClient.request('blockchain.transaction.get', [tx, true]);
	for (const vout of txDetails.vout) {

		const asm = vout.scriptPubKey.asm;
		const asmParts = asm.split(" ");
		if (asmParts[0] === 'OP_10' && asmParts[0] === 'OP_NAME_DOI') {

			let _tx = {};
			_tx.nameId = vout.scriptPubKey.nameOp.name;
			_tx.nameValue = vout.scriptPubKey.nameOp.value;
			_tx.address = vout.scriptPubKey?.addresses ? vout.scriptPubKey.addresses[0] : undefined;

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