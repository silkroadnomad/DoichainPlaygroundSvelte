// import * as conv from 'conv'
// import { conv } from 'conv';
// import converter from "javascript-binary-converter";

import {address,script} from 'bitcoinjs-lib';

export const NAME_MAX_LENGTH = 255
export const VALUE_MAX_LENGTH = 520

/**
 * Creates a NameOPStackScript from a nameId, nameValue and recipientAddress
 * https://github.com/brandonrobertz/bitcore-namecoin/blob/master/lib/names.js
 * https://github.com/doichain/doichain-transaction
 *
 * @param nameId
 * @param nameValue
 * @param destAddress
 * @returns {*}
 */
export const getNameOPStackScript = (nameId,nameValue,recipientAddress,network) => {
	if(!nameId || !nameValue)
		throw new Error("nameId and nameValue must defined");

	if(nameId.length > NAME_MAX_LENGTH || nameId.length < 3)
		throw new Error(`nameId must be at least 3 characters and not longer then ${NAME_MAX_LENGTH}`);

	if(nameValue.length > VALUE_MAX_LENGTH)
		throw new Error(`nameValue must be not longer then ${VALUE_MAX_LENGTH}`);

	const op_name = Buffer.from(nameId).toString('hex');
	const op_value = Buffer.from(nameValue).toString('hex');

	//const op_name = converter(nameId).toHexString() //conv(nameId, {in: 'binary', out: 'hex'})
	//let op_value = converter(nameValue).toHexString() //conv(nameValue, {in: 'binary', out: 'hex'})
	// const op_name = Buffer.from(nameId, 'binary').toString('hex');
	// let op_value = Buffer.from(nameValue, 'binary').toString('hex');

	//TODO support segwit addrsses
	// const op_address = base58.decode(recipientAddress).toString('hex').substr(2, 40);
	let op_address;
	try {
		const decoded = address.fromBase58Check(recipientAddress,network);
		op_address = decoded.hash.toString('hex');
	} catch (error) {
		throw new Error("Invalid recipient address: " + error.message);
	}
	//op_address = op_address.substring(2,40)

	const opCodesStackScript = script.fromASM(
		`
                                              OP_10
                                              ${op_name}
                                              ${op_value}
                                              OP_2DROP
                                              OP_DROP
                                              OP_DUP
                                              OP_HASH160
                                              ${op_address}
                                              OP_EQUALVERIFY
                                              OP_CHECKSIG
                                        `.trim().replace(/\s+/g, ' '),
	)
	console.log(opCodesStackScript)
	return opCodesStackScript
}



