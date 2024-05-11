import { crypto } from 'bitcoinjs-lib';


const opcodes = {
// push value
	OP_0: 0x00,
	OP_FALSE: OP_0,
	OP_PUSHDATA1: 0x4c,
	OP_PUSHDATA2: 0x4d,
	OP_PUSHDATA4: 0x4e,
	OP_1NEGATE: 0x4f,
	OP_RESERVED: 0x50,
	OP_1: 0x51,
	OP_TRUE: OP_1,
	OP_2: 0x52,
	OP_3: 0x53,
	OP_4: 0x54,
	OP_5: 0x55,
	OP_6: 0x56,
	OP_7: 0x57,
	OP_8: 0x58,
	OP_9: 0x59,
	OP_10: 0x5a,
	OP_11: 0x5b,
	OP_12: 0x5c,
	OP_13: 0x5d,
	OP_14: 0x5e,
	OP_15: 0x5f,
	OP_16: 0x60,

// control
	OP_NOP: 0x61,
	OP_VER: 0x62,
	OP_IF: 0x63,
	OP_NOTIF: 0x64,
	OP_VERIF: 0x65,
	OP_VERNOTIF: 0x66,
	OP_ELSE: 0x67,
	OP_ENDIF: 0x68,
	OP_VERIFY: 0x69,
	OP_RETURN: 0x6a,

// stack ops
	OP_TOALTSTACK: 0x6b,
	OP_FROMALTSTACK: 0x6c,
	OP_2DROP: 0x6d,
	OP_2DUP: 0x6e,
	OP_3DUP: 0x6f,
	OP_2OVER: 0x70,
	OP_2ROT: 0x71,
	OP_2SWAP: 0x72,
	OP_IFDUP: 0x73,
	OP_DEPTH: 0x74,
	OP_DROP: 0x75,
	OP_DUP: 0x76,
	OP_NIP: 0x77,
	OP_OVER: 0x78,
	OP_PICK: 0x79,
	OP_ROLL: 0x7a,
	OP_ROT: 0x7b,
	OP_SWAP: 0x7c,
	OP_TUCK: 0x7d,

// splice ops
	OP_CAT: 0x7e,
	OP_SUBSTR: 0x7f,
	OP_LEFT: 0x80,
	OP_RIGHT: 0x81,
	OP_SIZE: 0x82,

// bit logic
	OP_INVERT: 0x83,
	OP_AND: 0x84,
	OP_OR: 0x85,
	OP_XOR: 0x86,
	OP_EQUAL: 0x87,
	OP_EQUALVERIFY: 0x88,
	OP_RESERVED1: 0x89,
	OP_RESERVED2: 0x8a,

// numeric
	OP_1ADD: 0x8b,
	OP_1SUB: 0x8c,
	OP_2MUL: 0x8d,
	OP_2DIV: 0x8e,
	OP_NEGATE: 0x8f,
	OP_ABS: 0x90,
	OP_NOT: 0x91,
	OP_0NOTEQUAL: 0x92,

	OP_ADD: 0x93,
	OP_SUB: 0x94,
	OP_MUL: 0x95,
	OP_DIV: 0x96,
	OP_MOD: 0x97,
	OP_LSHIFT: 0x98,
	OP_RSHIFT: 0x99,

	OP_BOOLAND: 0x9a,
	OP_BOOLOR: 0x9b,
	OP_NUMEQUAL: 0x9c,
	OP_NUMEQUALVERIFY: 0x9d,
	OP_NUMNOTEQUAL: 0x9e,
	OP_LESSTHAN: 0x9f,
	OP_GREATERTHAN: 0xa0,
	OP_LESSTHANOREQUAL: 0xa1,
	OP_GREATERTHANOREQUAL: 0xa2,
	OP_MIN: 0xa3,
	OP_MAX: 0xa4,

	OP_WITHIN: 0xa5,

// crypto
	OP_RIPEMD160: 0xa6,
	OP_SHA1: 0xa7,
	OP_SHA256: 0xa8,
	OP_HASH160: 0xa9,
	OP_HASH256: 0xaa,
	OP_CODESEPARATOR: 0xab,
	OP_CHECKSIG: 0xac,
	OP_CHECKSIGVERIFY: 0xad,
	OP_CHECKMULTISIG: 0xae,
	OP_CHECKMULTISIGVERIFY: 0xaf,

// expansion
	OP_NOP1: 0xb0,
	OP_CHECKLOCKTIMEVERIFY: 0xb1,
	OP_NOP2: OP_CHECKLOCKTIMEVERIFY,
	OP_CHECKSEQUENCEVERIFY: 0xb2,
	OP_NOP3: OP_CHECKSEQUENCEVERIFY,
	OP_NOP4: 0xb3,
	OP_NOP5: 0xb4,
	OP_NOP6: 0xb5,
	OP_NOP7: 0xb6,
	OP_NOP8: 0xb7,
	OP_NOP9: 0xb8,
	OP_NOP10: 0xb9,

	OP_INVALIDOPCODE: 0xff

};

const OP_NAME_NEW = opcodes.OP_1;
const OP_NAME_FIRSTUPDATE = opcodes.OP_2;
const OP_NAME_UPDATE = opcodes.OP_3;
const OP_NAME_DOI = opcodes.OP_4;

export function name_show() {

}

class MalformedBitcoinScript extends Error {
	constructor(message = "Malformed Bitcoin script") {
		super(message);
		this.name = "MalformedBitcoinScript";
	}
}

class OPPushDataGeneric {
	constructor(pushlen = null) {
		if (pushlen !== null) {
			this.checkDataLen = pushlen;
		}
	}

	static checkDataLen(datalen) {
		// Opcodes below OP_PUSHDATA4 all just push data onto stack, and are equivalent.
		return opcodes.OP_PUSHDATA4 >= datalen && datalen >= 0;
	}

	static isInstance(item) {
		// Accept objects that are instances of this class
		// or other classes that are subclasses
		return item instanceof this || (typeof item === 'function' && item.prototype instanceof this);
	}
}

const OPPushDataPubkey = new OPPushDataGeneric(x => x === 33 || x === 65);

const SCRIPTPUBKEY_TEMPLATE_P2PKH = [opcodes.OP_DUP, opcodes.OP_HASH160,
	new OPPushDataGeneric(x => x === 20),
	opcodes.OP_EQUALVERIFY, opcodes.OP_CHECKSIG];
const SCRIPTPUBKEY_TEMPLATE_P2SH = [opcodes.OP_HASH160, new OPPushDataGeneric(x => x === 20), opcodes.OP_EQUAL];
const SCRIPTPUBKEY_TEMPLATE_WITNESS_V0 = [opcodes.OP_0, new OPPushDataGeneric(x => x === 20 || x === 32)];
const SCRIPTPUBKEY_TEMPLATE_P2WPKH = [opcodes.OP_0, new OPPushDataGeneric(x => x === 20)];
const SCRIPTPUBKEY_TEMPLATE_P2WSH = [opcodes.OP_0, new OPPushDataGeneric(x => x === 32)];

function matchScriptAgainstTemplate(script, template) {
    if (script === null) {
        return false;
    }
    // Optionally decode script now:
    if (script instanceof Buffer || script instanceof Uint8Array) {
        try {
            script = Array.from(scriptGetOp(script));
        } catch (error) {
            if (error instanceof MalformedBitcoinScript) {
                return false;
            }
            throw error; // rethrow if it's not a MalformedBitcoinScript error
        }
    }
    if (script.length !== template.length) {
        return false;
    }
    for (let i = 0; i < script.length; i++) {
        const templateItem = template[i];
        const scriptItem = script[i];
        if (OPPushDataGeneric.isInstance(templateItem) && templateItem.checkDataLen(scriptItem[0])) {
            continue;
        }
        if (templateItem !== scriptItem[0]) {
            return false;
        }
    }
    return true;
}


function splitNameScript(decoded) {
	if (decoded === null) {
		return { name_op: null, address_scriptPubKey: decoded };
	}

	let match = [OP_NAME_NEW, 'OPPushDataGeneric', opcodes.OP_2DROP];
	if (matchScriptAgainstTemplate(decoded.slice(0, match.length), match)) {
		return { name_op: { op: OP_NAME_NEW, commitment: decoded[1][1] }, address_scriptPubKey: decoded.slice(match.length) };
	}

	match = [OP_NAME_FIRSTUPDATE, 'OPPushDataGeneric', 'OPPushDataGeneric', 'OPPushDataGeneric', opcodes.OP_2DROP, opcodes.OP_2DROP];
	if (matchScriptAgainstTemplate(decoded.slice(0, match.length), match)) {
		return { name_op: { op: OP_NAME_FIRSTUPDATE, name: decoded[1][1], salt: decoded[2][1], value: decoded[3][1] }, address_scriptPubKey: decoded.slice(match.length) };
	}

	match = [OP_NAME_UPDATE, 'OPPushDataGeneric', 'OPPushDataGeneric', opcodes.OP_2DROP, opcodes.OP_DROP];
	if (matchScriptAgainstTemplate(decoded.slice(0, match.length), match)) {
		return { name_op: { op: OP_NAME_UPDATE, name: decoded[1][1], value: decoded[2][1] }, address_scriptPubKey: decoded.slice(match.length) };
	}

	return { name_op: null, address_scriptPubKey: decoded };
}

async function nameShow(identifier, nameEncoding = 'ascii', valueEncoding = 'ascii', options = null, wallet = null) {
	// Handle Namecoin-Core-style options
	if (options !== null) {
		if ("nameEncoding" in options) {
			nameEncoding = options["nameEncoding"];
		}
		if ("valueEncoding" in options) {
			valueEncoding = options["valueEncoding"];
		}
	}

	nameEncoding = new Encoding(nameEncoding);
	valueEncoding = new Encoding(valueEncoding);

	const identifierBytes = nameFromStr(identifier, nameEncoding);
	const sh = nameIdentifierToScripthash(identifierBytes);

	const txs = await network.getHistoryForScripthash(sh);

	const localChainHeight = network.getLocalHeight();
	const serverChainHeight = network.getServerHeight();
	const maxChainHeight = Math.max(localChainHeight, serverChainHeight);

	const unexpiredHeight = maxChainHeight - constants.net.NAME_EXPIRATION + 1;
	const unSemiExpiredHeight = maxChainHeight - constants.net.NAME_SEMI_EXPIRATION + 1;
	const unverifiedHeight = localChainHeight - 12 + 1;
	const unminedHeight = maxChainHeight - 18 + 1;

	let txBest = null;
	let expiredTxExists = false;
	let expiredTxHeight = null;
	let semiExpiredTxExists = false;
	let semiExpiredTxHeight = null;
	let unminedTxExists = false;
	let unminedTxHeight = null;

	for (let i = txs.length - 1; i >= 0; i--) {
		const txCandidate = txs[i];
		if (txCandidate.height < unexpiredHeight) {
			expiredTxExists = true;
			if (expiredTxHeight === null) {
				expiredTxHeight = txCandidate.height;
			}
			continue;
		}
		if (txCandidate.height < unSemiExpiredHeight) {
			semiExpiredTxExists = true;
			if (semiExpiredTxHeight === null) {
				semiExpiredTxHeight = txCandidate.height;
			}
			continue;
		}
		if (txCandidate.height > unverifiedHeight) {
			if (txCandidate.height > unminedHeight) {
				unminedTxExists = true;
				unminedTxHeight = txCandidate.height;
				continue;
			}
			throw new NotSynchronizedException(`The blockchain is still syncing (latest purported transaction height ${txCandidate.height}, local chain height ${localChainHeight}, server chain height ${serverChainHeight})`);
		}
		txBest = txCandidate;
		break;
	}

	if (unminedTxExists) {
		throw new NameUnconfirmedError(`Name is purportedly unconfirmed (registration height ${unminedTxHeight}, latest verified height ${unverifiedHeight})`);
	}
	if (semiExpiredTxExists) {
		throw new NameSemiExpiredError(`Name is purportedly semi-expired (latest renewal height ${semiExpiredTxHeight}, latest un-semi-expired height ${unSemiExpiredHeight}); if this name is yours, renew it ASAP to restore resolution and avoid losing ownership of the name`);
	}
	if (expiredTxExists) {
		throw new NameExpiredError(`Name is purportedly expired (latest renewal height ${expiredTxHeight}, latest unexpired height ${unexpiredHeight})`);
	}
	if (txBest === null) {
		throw new NameNeverExistedError("Name purportedly never existed");
	}
	const txid = txBest.tx_hash;
	const height = txBest.height;

	const header = await network.blockchain().readHeader(height);
	if (header === null) {
		if (height < constants.net.maxCheckpoint()) {
			await network.requestChunk(height, null);
		}
	}

	const merkle = await network.getMerkleForTransaction(txid, height);
	if (height !== merkle.block_height) {
		throw new Exception(`requested height ${height} differs from received height ${merkle.block_height} for txid ${txid}`);
	}
	const pos = merkle.pos;
	const merkleBranch = merkle.merkle;
	const header = await waitForHeader();
	verifyTxIsInBlock(txid, merkleBranch, pos, header, height);

	let tx = null;
	if (wallet && txid in wallet.db.transactions) {
		tx = wallet.db.transactions[txid];
	} else {
		const raw = await network.getTransaction(txid);
		if (raw) {
			tx = new Transaction(raw);
			tx = new Transaction(raw);
		} else {
			throw new Exception(`Unknown transaction (txid ${txid})`);
		}

		if (tx.txid() !== txid) {
			throw new Exception(`txid mismatch (${tx.txid()} vs ${txid})`);
		}

		for (let idx = 0; idx < tx.outputs().length; idx++) {
			const o = tx.outputs()[idx];
			if (o.nameOp !== null) {
				if ("name" in o.nameOp) {
					if (o.nameOp["name"] !== identifierBytes) {
						continue;
					}

					const expiresInfo = nameExpirationDatetimeEstimate(height, network.blockchain());
					const semiExpiresInfo = nameExpirationDatetimeEstimate(height, network.blockchain(), nameSemiExpiresIn);

					const isMine = wallet ? wallet.isMine(o.address) : null;

					return {
						name: nameToStr(o.nameOp["name"], nameEncoding),
						nameEncoding: nameEncoding.value,
						value: nameToStr(o.nameOp["value"], valueEncoding),
						valueEncoding: valueEncoding.value,
						txid: txid,
						vout: idx,
						address: o.address,
						height: height,
						expires_in: expiresInfo.expiresIn,
						expires_time: Math.round(expiresInfo.expiresTime.getTime() / 1000),
						expired: false,
						semi_expires_in: semiExpiresInfo.expiresIn,
						semi_expires_time: Math.round(semiExpiresInfo.expiresTime.getTime() / 1000),
						semi_expired: false,
						isMine: isMine
					};
				}
			}
		}

		throw new Exception(`missing name op (txid ${txid})`);
	}
}

// Skeletons for missing functions and classes
	class Encoding {
		constructor(value) {
			this.value = value;
		}
	}

/**
 * Todo deprecated unescape
 * @param name
 * @param encoding
 * @returns {Uint8Array|*|string}
 */
function nameFromStr(name, encoding) {
	if (encoding.value === 'ascii') {
		for (let i = 0; i < name.length; i++) {
			const code = name.charCodeAt(i);
			if (code < 0x20) {
				throw new Error(`Control characters forbidden at position ${i}`);
			}
			if (code >= 0x80) {
				throw new Error(`Non-ASCII character at position ${i}`);
			}
		}
		return name; // ASCII is directly compatible with JavaScript strings
	}
	if (encoding.value === 'utf-8') {
			return unescape(encodeURIComponent(name)); // UTF-8 encoding
	}
	if (encoding.value === 'hex') {
		try {
			return hexStringToBytes(name);
		} catch (e) {
			throw new Error(`Invalid hex string: ${e.message}`);
		}
	}
	throw new Error(`Unsupported encoding: ${encoding.value}`);
}

function hexStringToBytes(hexString) {
	if (hexString.length % 2 !== 0) {
		throw new Error("Hex string must have an even length");
	}
	const bytes = new Uint8Array(hexString.length / 2);
	for (let i = 0, j = 0; i < hexString.length; i += 2, j++) {
		bytes[j] = parseInt(hexString.substring(i, 2), 16);
		if (isNaN(bytes[j])) throw new Error(`Invalid byte sequence: ${hexString.substring(i, 2)}`);
	}
	return bytes;
}

function nameIdentifierToScripthash(identifier) {

   //OP_NAME_UPDATE; // You need to define this opcode based on your setup
	//const OP_RETURN = 0x6a; // Hexadecimal for OP_RETURN

	// Create a name operation object //TODO this could be a OP_NAME_DOI too
	const nameOp = {
		op: OP_NAME_UPDATE,
		name: identifier,
		value: new Uint8Array([]) // Empty byte array
	};

	// Convert name operation to script
	let script = nameOpToScript(nameOp);
	script += OP_RETURN.toString(16); // Append '6a' for OP_RETURN

	// Convert script to script hash
	return scriptToScripthash(script);
}

function scriptToScripthash(script) {
	let hash = crypto.sha256(script);
	let reversedHash = Buffer.from(hash.reverse()).toString("hex");
	return reversedHash;
}

function nameOpToScript(nameOp) {
	let script = '';

	if (nameOp === null) {
		return script;
	}

	switch (nameOp.op) {
		case OP_NAME_NEW:
			// validateNewLength(nameOp);
			script += '51'; // OP_NAME_NEW
			script += pushScript(bytesToHex(nameOp.commitment));
			script += '6d'; // OP_2DROP
			break;
		case OP_NAME_FIRSTUPDATE:
			validateFirstUpdateLength(nameOp);
			script += '52'; // OP_NAME_FIRSTUPDATE
			script += pushScript(bytesToHex(nameOp.name));
			script += pushScript(bytesToHex(nameOp.salt));
			script += pushScript(bytesToHex(nameOp.value));
			script += '6d6d'; // OP_2DROP OP_2DROP
			break;
		case OP_NAME_UPDATE:
			validateUpdateLength(nameOp);
			script += '53'; // OP_NAME_UPDATE
			script += pushScript(bytesToHex(nameOp.name));
			script += pushScript(bytesToHex(nameOp.value));
			script += '6d75'; // OP_2DROP OP_DROP
			break;
		case OP_NAME_DOI:
			validateUpdateLength(nameOp);
			script += '54'; // OP_NAME_UPDATE
			script += pushScript(bytesToHex(nameOp.name));
			script += pushScript(bytesToHex(nameOp.value));
			script += '6d75'; // OP_2DROP OP_DROP
			break;
		default:
			throw new Error(`Unknown name op: ${nameOp.op}`);
	}

	return script;
}

function nameToStr(nameBytes, encoding) {
	if (encoding.value === 'ascii' || encoding.value === 'utf-8') {
		return decodeURIComponent(escape(String.fromCharCode(...nameBytes)));
	}
	if (encoding.value === 'hex') {
		return bytesToHexString(nameBytes);
	}
	throw new Error(`Unsupported encoding: ${encoding.value}`);
}

	function nameExpirationDatetimeEstimate(height, blockchain, blocksFunc = nameExpiresIn) {
		// Estimate expiration date and time for a name
	}

	function nameExpiresIn(height) {
		// Calculate expiration in blocks
	}

	function nameSemiExpiresIn(height) {
		// Calculate semi-expiration in blocks
	}

	function verifyTxIsInBlock(txid, merkleBranch, pos, header, height) {
		// Verify that transaction is in the block
	}

	async function waitForHeader() {
		// Wait for header sync/reorg to complete
	}

	class NotSynchronizedException extends Error {}
	class NameUnconfirmedError extends Error {}
	class NameSemiExpiredError extends Error {}
	class NameExpiredError extends Error {}
	class NameNeverExistedError extends Error {}
	class Transaction {
		constructor(raw) {
			// Parse raw transaction data
		}

		txid() {
			// Return transaction ID
		}

		outputs() {
			// Return transaction outputs
		}
	}