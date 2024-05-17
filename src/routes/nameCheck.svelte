<script>
	import { Button, Column, Grid, Row, TextInput } from 'carbon-components-svelte';
	import { address, crypto, script } from 'bitcoinjs-lib';

	import { electrumClient } from './store.js';
	
let HASHX_LEN = 11
let nameToCheck = 'hello'
let valueToCheck =new Uint8Array([]) // 'world' //new Uint8Array([]) //'world'
let holderAddress = 'N8YtTBMRqMq9E45VMT9KVbfwt5X5oLD4vt'

function computeScriptHash(scriptBuffer) {
	let hash = crypto.sha256(scriptBuffer);
	return Buffer.from(hash.reverse()).toString("hex");
}

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

	buffer = buffer.concat(Array.from(data));
	return buffer;
}

function pushData2(data) {
	const len = data.length;
	if (len < opcodes.OP_PUSHDATA1) {
		return new Uint8Array([len, ...data]);
	} else if (len <= 0xff) {
		return new Uint8Array([opcodes.OP_PUSHDATA1, len, ...data]);
	} else if (len <= 0xffff) {
		const nLow = len & 0xff;
		const nHigh = (len >> 8) & 0xff;
		return new Uint8Array([opcodes.OP_PUSHDATA2, nLow, nHigh, ...data]);
	} else {
		const nLow = len & 0xff;
		const nMidLow = (len >> 8) & 0xff;
		const nMidHigh = (len >> 16) & 0xff;
		const nHigh = (len >> 24) & 0xff;
		return new Uint8Array([opcodes.OP_PUSHDATA4, nLow, nMidLow, nMidHigh, nHigh, ...data]);
	}
}

	function hashXFromScript(script,slicehash) {
		let hash = crypto.sha256(Buffer.from(script, 'hex'))
		if(!slicehash)
			return hash
		else return hash.slice(0, HASHX_LEN);
	}

	// function scriptToScripthash(script) {
	// 	let hash = crypto.sha256(Buffer.from(script, 'hex'));
	// 	return Buffer.from(hash.reverse()).toString('hex');
	// }
	// function createScript() {
	// 	const op_name = Buffer.from(nameToCheck).toString('hex');
	// 	console.log("op_name",op_name)
	// 	const op_value = Buffer.from(new Uint8Array([]) ).toString('hex');
	// 	console.log("op_value",op_value)
	// 	let res = [];
	// 	res.push(opcodes.OP_3); // Example opcode, replace with actual if needed
	// 	res.push(op_name); // Push name data onto the script
	// 	res.push(op_value); // Push value data onto the script
	// 	res.push(opcodes.OP_2DROP); // OP_2DROP
	// 	res.push(opcodes.OP_DROP); // OP_DROP
	// 	res.push(opcodes.OP_RETURN); // OP_RETURN
	// 	return res
	// }


	function createScript0() {
		let res = [];
		res.push('OP_3');
		res.push(pushData(nameToCheck))
		res.push(pushData(new Uint8Array([])))
		res.push('OP_2DROP');
		res.push('OP_DROP');
		res.push('OP_RETURN');
		return res
	}

	function createScript1() {
		let res = [];
		res.push('OP_3');
		res.push(nameToCheck)
		res.push(new Uint8Array([]))
		res.push('OP_2DROP');
		res.push('OP_DROP');
		res.push('OP_RETURN');
		return res
	}

	function createScript2() {
		let res = [];
		res.push(opcodes.OP_3);
		res.push(pushData(nameToCheck))
		res.push(pushData(new Uint8Array([])))
		res.push(opcodes.OP_2DROP);
		res.push(opcodes.OP_DROP);
		res.push(opcodes.OP_RETURN);
		return res
	}
	function createScript3() {
		let res = '';
		res += '53';
		res += pushData(nameToCheck);
		res += pushData(new Uint8Array([]));
		res += '6d';
		res += '75';
		res += '6a';

		return res;
	}

	function createScript4(){
		const op_name = Buffer.from(nameToCheck).toString('hex');
		const op_value = Buffer.from(new Uint8Array([]) ).toString('hex');

		const opCodesStackScript = script.fromASM(
			`
			OP_3
		  ${op_name}
		  ${op_value}
		  OP_2DROP
		  OP_DROP
			OP_RETURN
		   `.trim().replace(/\s+/g, ' '))
		return opCodesStackScript
	}

	const checkName = async () => {

		const script0 = createScript0()
		const script1 = createScript1()
		const script2 = createScript2()
		const script3 = createScript3()
		const script4 = createScript4()

		const scriptHash0 = hashXFromScript(script0)
		const scriptHash1 = hashXFromScript(script1)
		const scriptHash2 = hashXFromScript(script2)
		const scriptHash3 = hashXFromScript(script3)
		const scriptHash4 = hashXFromScript(script4)

		// const scriptHash5 = hashXFromScript(script5)

		let reversedHash0 = Buffer.from(scriptHash0.reverse()).toString("hex");
		let reversedHash1 = Buffer.from(scriptHash1.reverse()).toString("hex");
		let reversedHash2 = Buffer.from(scriptHash2.reverse()).toString("hex");
		let reversedHash3 = Buffer.from(scriptHash3.reverse()).toString("hex");
		let reversedHash4 = Buffer.from(scriptHash4.reverse()).toString("hex");

		console.log("reversedHash0", reversedHash0)
		const txs0 = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash0]);
		console.log("txs0", txs0)

		console.log("reversedHash1", reversedHash1)
		const txs1 = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash1]);
		console.log("txs1", txs1)

		console.log("reversedHash2", reversedHash2)
		const txs2 = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash2]);
		console.log("txs2", txs2)

		console.log("reversedHash3", reversedHash3)
		const txs3 = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash3]);
		console.log("txs3", txs3)

		console.log("reversedHash4", reversedHash4)
		const txs4 = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash4]);
		console.log("txs4", txs4)

		let identifer = new TextEncoder();
		identifer.encode(nameToCheck);

		// const identifer = Buffer.from(nameToCheck).toString('hex');
		const identifierBytes = Buffer.from(identifer) //.toString('hex');
		console.log("identifierBytes",identifierBytes)
		// const name_op = {"op": OP_NAME_UPDATE, "name": identifier, "value": bytes([])}
		// script = name_op_to_script(name_op)
		const op_value = Buffer.from(new Uint8Array([])).toString('hex');
		let script = '53'    //                             # OP_NAME_UPDATE
		script += identifierBytes //push_script(bh2u(name_op["name"]))
		script += op_value//push_script(bh2u(name_op["value"]))
		script += '6d'     //                           # OP_2DROP
		script += '75'
		script += '6a' //# OP_RETURN
		const bufferString = Buffer.from(script, 'hex');
		console.log("bufferString",bufferString.toString('hex'))
		const hashString = crypto.sha256(script)
		console.log("hashString",hashString)
		let reversedHash = Buffer.from(hashString.reverse()).toString("hex");
		console.log("reversedHash",reversedHash)

		const reversedHash5 = '7998aa47625f11094797e96910b8812d1d4b14f8b010e47d918730c58ccf3914'
		console.log("reversedHash5", reversedHash5)
		const txs5 = await $electrumClient.request('blockchain.scripthash.get_history', [reversedHash5]);
		console.log("txs5", txs5)
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

		console.log("asm",asm_)
		let _script = script.fromASM(asm_)
		console.log("_script",_script)
		return scriptToScripthash(_script)
	}

	// function scriptToScripthash(script) {
	// 	let hash = crypto.sha256(script);
	// 	let reversedHash = Buffer.from(hash.reverse()).toString("hex");
	// 	return reversedHash;
	// }

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
