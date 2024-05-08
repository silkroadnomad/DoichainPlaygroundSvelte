export function nameIdentifierToScripthash(identifier) {
	const nameOp = {
		op: OP_NAME_UPDATE,  // OP_NAME_UPDATE must be defined or imported in your JS context
		name: identifier,
		value: new Uint8Array([])
	};
	let script = nameOpToScript(nameOp);  // nameOpToScript must be a defined function in your JS context
	script += '6a'; // OP_RETURN in hex

	return scriptToScripthash(script); // scriptToScripthash must be a defined function in your JS context
}

export function nameFromStr(name) {
	// Assuming name should be UTF-8 encoded and then converted to a hexadecimal string
	const encoder = new TextEncoder();
	const encodedName = encoder.encode(name);
	return Array.from(encodedName).map(byte => byte.toString(16).padStart(2, '0')).join('');
}
