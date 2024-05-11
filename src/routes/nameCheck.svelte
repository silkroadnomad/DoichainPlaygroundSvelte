<script>
	import { Button, Column, Grid, Row, TextInput } from 'carbon-components-svelte';
	import { address, crypto, script } from 'bitcoinjs-lib';
	import { getNameOPStackScript } from '$lib/getNameOPStackScript.js';
	import {
		electrumClient,
		network
	} from './store.js';

let nameToCheck = 'hello'
let valueToCheck =new Uint8Array([]) // 'world' //new Uint8Array([]) //'world'
let holderAddress = 'N8YtTBMRqMq9E45VMT9KVbfwt5X5oLD4vt'

function computeScriptHash(scriptBuffer) {
	let hash = crypto.sha256(scriptBuffer);
	return Buffer.from(hash.reverse()).toString("hex");

	// const sha256 = crypto.createHash('sha256').update(scriptBuffer).digest();
	// return Buffer.from(sha256).reverse().toString('hex');  // Reverse the hash for little-endian format
}

const checkName = async () => {

	// const scriptHash = nameIdentifierToScripthash(nameToCheck)
	// sh = name_identifier_to_scripthash(identifier_bytes)
	const op_name = Buffer.from(nameToCheck).toString('hex');
	const op_value = Buffer.from(valueToCheck).toString('hex')
	let op_address;
	try {
		const decoded = address.fromBase58Check(holderAddress, $network);
		op_address = decoded.hash.toString('hex');
	} catch (error) {
		op_address = new Uint8Array([])
		//throw new Error(ERRORS.INVALID_ADDRESS + error.message);
	}

	const opCodesStackScript = script.fromASM(
		`OP_10
     ${op_name}
     ${op_value}
     OP_2DROP
     OP_DROP
		 OP_RETURN
     `.trim().replace(/\s+/g, ' '))
	console.log("opCodesSTack",opCodesStackScript)
	// const opCodesStackScript = script.fromASM(
	// 	`OP_10
  //    ${op_name}
  //    ${op_value}
  //    OP_2DROP
  //    OP_DROP
	// 	 OP_DUP
	// 	 OP_HASH160
  //    ${op_address}
  //    OP_EQUALVERIFY
  //    OP_CHECKSIG
  //    `.trim().replace(/\s+/g, ' '))

	const scriptHash = computeScriptHash(opCodesStackScript)
 	// const script = getNameOPStackScript(nameToCheck,'world',holderAddress,$network)

	// let script = address.toOutputScript(holderAddress, $network);
	// let hash = crypto.sha256(script);
	// let reversedHash = Buffer.from(hash.reverse()).toString("hex");
	console.log("scriptHash",scriptHash)
	const txs = await $electrumClient.request('blockchain.scripthash.get_history', [scriptHash]);
	console.log("txs", txs)

}

	function nameIdentifierToScripthash(identifier) {

		const op_name = Buffer.from(identifier).toString('hex');
		const op_value = Buffer.from( new Uint8Array([])).toString('hex');
		let asm_ = 			`OP_10
       ${op_name}
       ${op_value}
       OP_2DROP
       OP_DROP
       `.trim().replace(/\s+/g, ' ')

		// let asm = "OP_10\n" +
		// 	"68656c6c6f\n" +
		// 	"776f726c64\n" +
		// 	"OP_2DROP\n" +
		// 	"OP_DROP\nOP_DUP\nOP_HASH160\n8359edeb2dcbec1c9117500de7bfdbf5f14e4215\nOP_EQUALVERIFY\nOP_CHECKSIG\n".trim().replace(/\s+/g, ' ')

		console.log("asm",asm_)
		let _script = script.fromASM(asm_)
		console.log("_script",_script)
		return scriptToScripthash(_script)
	}

	function scriptToScripthash(script) {
		let hash = crypto.sha256(script);
		let reversedHash = Buffer.from(hash.reverse()).toString("hex");
		return reversedHash;
	}

	const opcodes = {
// push value
		OP_0: 0x00,
		OP_FALSE: 0x00,//opcodes.OP_0,
		OP_PUSHDATA1: 0x4c,
		OP_PUSHDATA2: 0x4d,
		OP_PUSHDATA4: 0x4e,
		OP_1NEGATE: 0x4f,
		OP_RESERVED: 0x50,
		OP_1: 0x51,
		OP_TRUE: 0x51, //opcodes.OP_1,
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
		OP_NOP2: 0xb1, //opcodes.OP_CHECKLOCKTIMEVERIFY,
		OP_CHECKSEQUENCEVERIFY: 0xb2,
		OP_NOP3: 0xb2, //opcodes.OP_CHECKSEQUENCEVERIFY,
		OP_NOP4: 0xb3,
		OP_NOP5: 0xb4,
		OP_NOP6: 0xb5,
		OP_NOP7: 0xb6,
		OP_NOP8: 0xb7,
		OP_NOP9: 0xb8,
		OP_NOP10: 0xb9,

		OP_INVALIDOPCODE: 0xff

	};

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
</Grid>
