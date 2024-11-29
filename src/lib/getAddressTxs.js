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

export function deriveAddress(xpubOrZpub, derivationPath, network, type) {
    try {
        console.log(`\n Deriving address:`);
        console.log(`├── Input Key: ${xpubOrZpub.slice(0, 20)}...`);
        console.log(`├── Path: ${derivationPath}`);
        console.log(`└── Type: ${type}`);

        const decodedData = bs58.decode(xpubOrZpub);
        const data = Buffer.from(decodedData);
        
        if (data.length !== 82) {
            throw new Error('Invalid extended public key length');
        }

        const versionBytes = data.subarray(0, 4);
        const versionHex = versionBytes.toString('hex');
        console.log(`├── Version bytes: ${versionHex}`);

        let xpub = xpubOrZpub;
        
        // Handle ZPUB conversion to XPUB if needed
        if (versionHex === '04b24746') { // ZPUB (Doichain/Bitcoin mainnet)
            console.log(`├── Converting ZPUB to XPUB`);
            // Convert ZPUB to XPUB by changing version bytes
            const xpubVersionBytes = Buffer.from([0x04, 0x88, 0xb2, 0x1e]); // mainnet xpub
            const xpubBuffer = Buffer.concat([
                xpubVersionBytes,
                data.subarray(4)
            ]);
            xpub = bs58.encode(xpubBuffer);
        }

        let node;
        if (versionHex === '04b24746') { // ZPUB case
            console.log(`├── Using native segwit network configuration`);
            // Use appropriate network configuration for native segwit
            const segwitNetwork = {
                ...network,
                bip32: {
                    public: 0x04b24746,  // ZPUB version bytes
                    private: 0x04b2430c  // ZPRV version bytes
                }
            };
            node = bip32.fromBase58(xpubOrZpub, segwitNetwork);
        } else {
            // Regular XPUB case
            console.log(`├── Using regular network configuration`);
            node = bip32.fromBase58(xpub, network);
        }
        
        // Parse the derivation path
        const pathSegments = derivationPath
            .replace('m/', '')
            .split('/')
            .filter(segment => segment !== '');

        // Derive each segment individually
        let child = node;
        for (const segment of pathSegments) {
            const index = parseInt(segment.replace("'", ""), 10);
            if (isNaN(index)) {
                throw new Error(`Invalid path segment: ${segment}`);
            }
            child = child.derive(index);
        }

        // Generate address based on type
        if (type === 'p2wpkh' || type === 'segwit') {
            const address = payments.p2wpkh({ 
                pubkey: child.publicKey, 
                network 
            }).address;
            console.log(`└── ✅ Generated segwit: ${address}`);
            return address;
        } else { // legacy p2pkh
            const address = payments.p2pkh({ 
                pubkey: child.publicKey, 
                network 
            }).address;
            console.log(`└── ✅ Generated legacy: ${address}`);
            return address;
        }
    } catch (error) {
        console.error(`└── ❌ Error in deriveAddress:`, error);
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
    let electrumUTXOs = []; // Declare electrumUTXOs at the top level

    let index = 0;
    let gapLimit = 20;
    let transactionsFound = true;
    let allTxs = [];
    let ourTxs = [];
    let derivedAddresses = [];

    const derivationPaths = {
        'electrum-legacy': 'm',
        'electrum-segwit': "m/0'",
        // 'bip32': 'm/0/0/0',
        // 'bip84': 'm/84/0/0/0',
        // 'bip44': 'm/44/0/0/0',
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
        derivedAddresses.push(xpubOrDoiAddress);
        try {
            electrumUTXOs = await _electrumClient.request('blockchain.scripthash.listunspent', [reversedHash]);
            _historyStore = await _electrumClient.request('blockchain.scripthash.get_history', [reversedHash]);
        } catch (error) {
            console.error("Error fetching data from Electrum client", error);
            electrumUTXOs = []; // Ensure it's an empty array if request fails
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
            console.log(`\n Scanning standard: ${standard}`);
            console.log(`├── Base Path: ${derivationPathBase}`);
            console.log(`└── Address Type: ${addressType}`);

            index = 0;
            transactionsFound = true;

            const MAX_ADDRESSES = 20; // Or whatever reasonable limit you want to set

            while ((transactionsFound || index < gapLimit) && index < MAX_ADDRESSES) {
                for (let i = 0; i < batchSize && (transactionsFound || index < gapLimit) && index < MAX_ADDRESSES; i++, index++) {
                    const derivationPath = `${derivationPathBase}/${index}`;
                    console.log(`\n📍 Deriving address batch ${Math.floor(index/batchSize)}:`);
                    console.log(`├── Path: ${derivationPath}`);
                    console.log(`├── Index: ${index}`);
                    
                    try {
                        const derivedAddress = deriveAddress(xpubOrDoiAddress, derivationPath, _network, addressType);
                        console.log(`└── ✅ Generated: ${derivedAddress}`);
                        derivedAddresses.push(derivedAddress);
                    } catch (error) {
                        console.error(`└── ❌ Error: ${error.message}`);
                        continue;
                    }
                }

                // After batch derivation, log the electrum requests
                console.log(`\n🔄 Checking transactions for ${derivedAddresses.length} addresses`);
                
                const scripts = derivedAddresses.map(addr => {
                    try {
                        return address.toOutputScript(addr, _network);
                    } catch (error) {
                        console.error(`❌ Script creation failed for ${addr}: ${error.message}`);
                        return null;
                    }
                }).filter(Boolean);

                const hashes = scripts.map(script => {
                    const hash = crypto.sha256(script);
                    return Buffer.from(hash.reverse()).toString("hex");
                });

                try {
                    // Initialize arrays to collect UTXOs and history
                    let batchHistory = [];
                    
                    for (const [idx, hash] of hashes.entries()) {
                        console.log(`\n🔎 Checking address ${derivedAddresses[idx]}`);
                        const utxos = await _electrumClient.request('blockchain.scripthash.listunspent', [hash]);
                        electrumUTXOs.push(...utxos); // Accumulate UTXOs for all addresses
                        const history = await _electrumClient.request('blockchain.scripthash.get_history', [hash]);
                        if (history.length > 0) {
                            console.log(`└── ✨ Found ${history.length} transactions`);
                            batchHistory.push(...history);
                        } else {
                            console.log(`└── 📭 No transactions found`);
                        }
                    }

                    if (batchHistory.length === 0) {
                        console.log(`\n💤 No transactions in this batch, gap: ${gapLimit - index}`);
                        transactionsFound = false;
                    } else {
                        console.log(`\n🎯 Found ${batchHistory.length} total transactions in this batch`);
                        transactionsFound = true;
                        // Add logging here to track transaction processing
                        console.log(`\n📝 Processing transactions...`);
                        batchHistory.forEach(tx => {
                            tx.derivationStandard = standard;
                            allTxs.push(tx);
                            console.log(`├── Added tx: ${tx.tx_hash.slice(0, 8)}...`);
                        });
                    }
                } catch (error) {
                    console.error(`\n❌ Electrum request failed: ${error.message}`);
                }
            }
        }
    }

    // Process all transactions
    console.log(`Processing ${allTxs.length} transactions...`);
    for (const tx of allTxs) {
        console.log(`\nProcessing transaction: ${tx.tx_hash}`);
        let decryptedTx = await _electrumClient.request('blockchain.transaction.get', [tx.tx_hash, 1]);
        decryptedTx.formattedBlocktime = decryptedTx.blocktime ? 
            moment.unix(decryptedTx.blocktime).format('YYYY-MM-DD HH:mm:ss') : 'mempool';
        let inputTotal = 0;
        let outputTotal = 0;
        let involvesDerivedAddress = false;

        // Process inputs
        console.log(`- Processing ${decryptedTx.vin.length} inputs...`);
        for (const [index, vin] of decryptedTx.vin.entries()) {
            if (!vin.coinbase) {
                const prevTx = await _electrumClient.request('blockchain.transaction.get', [vin.txid, 1]);
                const spentOutput = prevTx.vout[vin.vout];
                const inputAddress = spentOutput.scriptPubKey?.addresses?.[0];
                
                console.log(`  Checking input address: ${inputAddress}`);
                console.log(`  Derived addresses to check against:`, derivedAddresses);
                console.log(`  Is address in derived addresses?`, derivedAddresses.includes(inputAddress));
                
                if (derivedAddresses.includes(inputAddress)) {
                    console.log(`  ✓ Found matching input address: ${inputAddress}`);
                    console.log(`  Creating transaction with:`);
                    console.log(`    - ID: ${decryptedTx.txid}_in_${index}`);
                    console.log(`    - Value: ${-spentOutput.value}`);
                    involvesDerivedAddress = true;
                    const _tx = {
                        ...decryptedTx,
                        id: `${decryptedTx.txid}_in_${index}`,
                        value: -spentOutput.value,
                        address: inputAddress,
                        type: 'input'
                    };
                    console.log(`  Added transaction:`, _tx);
                    ourTxs.push(_tx);
                } else {
                    console.log(`  ✗ No match for input address: ${inputAddress}`);
                }
                inputTotal += spentOutput.value;
            }
            inputCount.set(_inputCount += 1);
        }

        // Process outputs
        console.log(`- Processing ${decryptedTx.vout.length} outputs...`);
        for (const [index, vout] of decryptedTx.vout.entries()) {
            const outputAddress = vout.scriptPubKey?.addresses?.[0];
            
            if (derivedAddresses.includes(outputAddress)) {
                console.log(`  Found matching output address: ${outputAddress}`);
                involvesDerivedAddress = true;
                const _tx = {
                    ...decryptedTx,
                    id: `${decryptedTx.txid}_out_${index}`,
                    value: vout.value,
                    address: outputAddress,
                    type: 'output',
                    n: vout.n
                };

                // Check if this output is unspent
                const isUTXO = electrumUTXOs.some(utxo => 
                    utxo.tx_hash === _tx.txid && utxo.tx_pos === _tx.n
                );
                if (isUTXO) {
                    _tx.utxo = true;
                }

                // Handle name operations
                const asmParts = vout.scriptPubKey.asm.split(" ");
                if (['OP_10', 'OP_NAME_DOI', 'OP_2', 'OP_NAME_FIRSTUPDATE', 'OP_3', 'OP_NAME_UPDATE'].includes(asmParts[0])) {
                    console.log(`  Found name operation: ${vout.scriptPubKey.nameOp.name}`);
                    _tx.nameId = vout.scriptPubKey.nameOp.name;
                    _tx.nameValue = vout.scriptPubKey.nameOp.value;
                    namesCount.set(_namesCount += 1);
                }

                ourTxs.push(_tx);
                outputCount.set(_outputCount += 1);
            }
            outputTotal += vout.value;
        }

        if (involvesDerivedAddress) {
            const fee = inputTotal - outputTotal;
            console.log(`- Transaction fee: ${fee}`);
        }
    }
    console.log('\nTransaction processing complete!',ourTxs.length);

    // Sort transactions by blocktime
    ourTxs = ourTxs.sort((a, b) => b.blocktime - a.blocktime);
    txs.set(ourTxs);

    return ourTxs; // Return processed transactions instead of allTxs
}