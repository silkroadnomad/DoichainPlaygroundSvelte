import AES from 'crypto-js/aes.js';
import Utf8 from 'crypto-js/enc-utf8.js';

export function decryptMnemonic(_encryptedMnemonic,_password) {
	const bytes = AES.decrypt(_encryptedMnemonic || '', _password);
	let originalText
	try { originalText = bytes.toString(Utf8)}catch(ex){}
	return originalText;
}