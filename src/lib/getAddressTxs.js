import { address, crypto, payments, networks } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import BIP32Factory from 'bip32';
import moment from 'moment';
import { txs, inputCount, outputCount, namesCount } from '../routes/store.js';
import bs58 from 'bs58';

let _inputCount, _outputCount, _namesCount = 0;
inputCount.subscribe((v) => _inputCount = v);
outputCount.subscribe((v) => _outputCount = v);
namesCount.subscribe((v) => _namesCount = v);

// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc);

export function deriveAddress(zpub, derivationPath, network, type) {
    try {
        if (!zpub.startsWith('zpub')) {
            throw new Error('Only ZPUB is supported');
        }

        // Decode ZPUB and convert to Buffer
        const decodedData = bs58.decode(zpub);
        const data = Buffer.from(decodedData);
        
        // Validate decoded data length
        if (data.length !== 82) {
            throw new Error('Invalid ZPUB length');
        }

        // Extract and check version bytes
        const versionBytes = data.subarray(0, 4);
        const versionHex = versionBytes.toString('hex');
        console.log('ZPUB version bytes:', versionHex);

        // Check ZPUB type
        if (versionHex === '04b24746') {
            console.log('Detected Doichain ZPUB');
        } else if (versionHex === '04b24746') { // Bitcoin mainnet ZPUB
            console.log('Detected Bitcoin ZPUB');
        } else {
            console.log('Unknown ZPUB type:', versionHex);
            throw new Error('Unsupported ZPUB version');
        }

        // Create version bytes for XPUB (0x0488b21e for mainnet xpub)
        const xpubVersionBytes = Buffer.from([0x04, 0x88, 0xb2, 0x1e]);
        
        // Concatenate version bytes with the rest of the data
        const xpubBuffer = Buffer.concat([
            xpubVersionBytes,
            data.subarray(4)
        ]);
        
        // Encode to XPUB
        const xpub = bs58.encode(xpubBuffer);

        // Create BIP32 node
        const node = bip32.fromBase58(xpub, network);
        
        // Derive child key
        const child = node.derivePath(derivationPath);

        return payments.p2wpkh({ 
            pubkey: child.publicKey, 
            network 
        }).address;
    } catch (error) {
        console.error('Error in deriveAddress:', error);
        throw error;
    }
}

export function isValidBitcoinAddress(addressStr, network) {
    try {
        address.toOutputScript(addressStr, network);
        return true;
    } catch (e) {
        return false;
    }
}


export const getAddressTxs = async (xpubOrDoiAddress, _historyStore, _electrumClient, _network) => {
    console.log("now getting transactions of ", xpubOrDoiAddress);

    // Check if xpubOrDoiAddress is a valid Bitcoin address
    const isAddress = isValidBitcoinAddress(xpubOrDoiAddress, _network);

    let index = 0;
    let gapLimit = 20;
    let transactionsFound = true;
    let allTxs = [];
    let ourTxs = [];

    const derivationPaths = {
        'electrum-legacy': 'm/0/0',
        'electrum-segwit': "m/0/0",
        'bip32': 'm/0/0/0',
        'bip84': 'm/84/0/0/0',
        'bip44': 'm/44/0/0/0',
    };

    const addressTypes = {
        'electrum-legacy': 'p2pkh',
        'electrum-segwit': 'p2wpkh',
        'bip32': 'p2pkh',
        'bip84': 'p2wpkh',
        'bip44': 'p2pkh',
    };

    const batchSize = 10; // Define the batch size for requests

    if (isAddress) {
        // Directly use the address to fetch transactions
        const script = address.toOutputScript(xpubOrDoiAddress, _network);
        const hash = crypto.sha256(script);
        const reversedHash = Buffer.from(hash.reverse()).toString("hex");

        try {
            const electrumUTXOs = await _electrumClient.request('blockchain.scripthash.listunspent', [reversedHash]);
            _historyStore = await _electrumClient.request('blockchain.scripthash.get_history', [reversedHash]);
        } catch (error) {
            console.error("Error fetching data from Electrum client", error);
        }

        if (!Array.isArray(_historyStore)) {
            console.error("_historyStore is not an array", _historyStore);
            return [];
        }

        if (_historyStore.length > 0) {
            _historyStore.forEach(tx => {
                tx.derivationStandard = 'direct'; // Mark as direct address
                allTxs.push(tx);
            });
        }
    } else {
        // Derive addresses from xpub
        for (const [standard, derivationPathBase] of Object.entries(derivationPaths)) {
            const addressType = addressTypes[standard];
            console.log(`Crawling standard: ${standard}, path: ${derivationPathBase}, type: ${addressType}`);

            index = 0;
            transactionsFound = true;

            while (transactionsFound || index < gapLimit) {
                const derivedAddresses = [];
                for (let i = 0; i < batchSize && (transactionsFound || index < gapLimit); i++, index++) {
                    const derivationPath = `${derivationPathBase}/${index}`;
                    const derivedAddress = deriveAddress(xpubOrDoiAddress, derivationPath, _network, addressType);
                    console.log("derivedAddress", derivedAddress, "derivationPath", derivationPath);
                    derivedAddresses.push(derivedAddress);
                }

                const scripts = derivedAddresses.map(addr => address.toOutputScript(addr, _network));
                const hashes = scripts.map(script => {
                    const hash = crypto.sha256(script);
                    return Buffer.from(hash.reverse()).toString("hex");
                });

                let electrumUTXOs = [];
                let _historyStore = [];

                try {
                    // Initialize arrays to collect UTXOs and history from each request
                    electrumUTXOs = [];
                    _historyStore = [];

                    for (const hash of hashes) {
                        // Request UTXOs for each hash
                        const utxos = await _electrumClient.request('blockchain.scripthash.listunspent', [hash]);
                        electrumUTXOs.push(...utxos);

                        // Request history for each hash
                        const history = await _electrumClient.request('blockchain.scripthash.get_history', [hash]);
                        _historyStore.push(...history);
                    }
                } catch (error) {
                    console.error("Error fetching data from Electrum client", error);
                }

                if (!Array.isArray(_historyStore)) {
                    console.error("_historyStore is not an array", _historyStore);
                    return [];
                }

                if (_historyStore.length === 0) {
                    transactionsFound = false;
                } else {
                    transactionsFound = true;
                    _historyStore.forEach(tx => {
                        tx.derivationStandard = standard; // Mark the standard
                        allTxs.push(tx);
                    });
                }
            }
        }
    }

    // Process all transactions found
    for (const tx of allTxs) {
        let decryptedTx = await _electrumClient.request('blockchain.transaction.get', [tx.tx_hash, 1]);
        decryptedTx.formattedBlocktime = decryptedTx.blocktime ? moment.unix(decryptedTx.blocktime).format('YYYY-MM-DD HH:mm:ss') : 'mempool';
        decryptedTx.value = 0;
        let inputTotal = 0;
        let outputTotal = 0;

        for (const [index, vin] of decryptedTx.vin.entries()) {
            if (!vin.coinbase) {
                const prevTx = await _electrumClient.request('blockchain.transaction.get', [vin.txid, 1], true);
                const spentOutput = prevTx.vout[vin.vout];
                if (!spentOutput.scriptPubKey.addresses || spentOutput.scriptPubKey.addresses.includes(_doiAddress)) {
                    const _tx = { ...decryptedTx, id: `${decryptedTx.txid}_in_${index}`, value: -spentOutput.value, address: spentOutput.scriptPubKey?.addresses, fee: decryptedTx.fee };
                    ourTxs.push(_tx);
                }
                inputTotal += spentOutput.value;
            }
            inputCount.set(_inputCount += 1);
        }

        for (const [index, vout] of decryptedTx.vout.entries()) {
            const _tx = { ...decryptedTx, id: `${decryptedTx.txid}_out_${index}`, fee: decryptedTx.fee, value: vout.value, n: vout.n };
            const asmParts = vout.scriptPubKey.asm.split(" ");
            if (!['OP_10', 'OP_NAME_DOI', 'OP_2', 'OP_NAME_FIRSTUPDATE', 'OP_3', 'OP_NAME_UPDATE'].includes(asmParts[0])) {
                _tx.address = vout.scriptPubKey?.addresses ? vout.scriptPubKey?.addresses[0] : _doiAddress;
            } else {
                _tx.nameId = vout.scriptPubKey.nameOp.name;
                _tx.nameValue = vout.scriptPubKey.nameOp.value;
                _tx.address = vout.scriptPubKey?.addresses[0];
                namesCount.set(_namesCount += 1);
            }
            outputTotal += vout.value;

            if (derivedAddresses.includes(_tx.address)) {
                const isUTXO = electrumUTXOs.some(utxo => utxo.tx_hash === _tx.txid && utxo.tx_pos === _tx.n);
                if (isUTXO) {
                    _tx.utxo = true;
                }
                ourTxs.push(_tx);
                outputCount.set(_outputCount += 1);
            }
        }

        const fee = inputTotal - outputTotal;
        ourTxs.forEach(__tx => {
            if (__tx.txid.startsWith(decryptedTx.txid)) {
                __tx.fee = fee;
            }
        });

        ourTxs = ourTxs.sort((a, b) => b.blocktime - a.blocktime);
        txs.set(ourTxs);
    }
    return allTxs;
}