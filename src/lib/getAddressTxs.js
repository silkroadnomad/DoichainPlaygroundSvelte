// Primary imports (core functionality)
import { address, crypto, payments, networks } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import BIP32Factory from 'bip32';

// Secondary imports (utilities)
import moment from 'moment';
import bs58 from 'bs58';
import { txs, inputCount, outputCount, namesCount, logs } from '../routes/store.js';

/** @type {BIP32} - Initialized BIP32 instance with secp256k1 support */
const bip32 = BIP32Factory(ecc);

/** @type {Map<string, {path: string, standard: string, type: string}>} - Maps addresses to their derivation paths */
let addressDerivationPaths = new Map();

/** @type {Map<string, {confirmed: number, unconfirmed: number}>} - Maps addresses to their balances */
let addressBalances = new Map();

// Secondary state management
let _inputCount, _outputCount, _namesCount = 0;
inputCount.subscribe((v) => _inputCount = v);
outputCount.subscribe((v) => _outputCount = v);
namesCount.subscribe((v) => _namesCount = v);

/**
 * Fetches and processes transactions for a given xpub or DOI address
 * @param {string} xpubOrDoiAddress - Extended public key or DOI address to process
 * @param {Array} _historyStore - Transaction history store
 * @param {Object} _electrumClient - Initialized Electrum client instance
 * @param {Object} _network - Network configuration object
 * @returns {Promise<Array>} Array of processed transactions
 */
export const getAddressTxs = async (xpubOrDoiAddress, _historyStore, _electrumClient, _network) => {
    // Reset the txs store at the start
    txs.set([]);
    let ourTxs = [];

    log(`Now getting transactions of ${xpubOrDoiAddress}`);

    // Check if xpubOrDoiAddress is a valid Bitcoin address
    const isAddress = isValidBitcoinAddress(xpubOrDoiAddress, _network);
    let electrumUTXOs = []; // Declare electrumUTXOs at the top level

    let index = 0;
    let gapLimit = 20;
    let transactionsFound = true;
    let allTxs = [];
    let derivedAddresses = [];

    /**
     * @type {Object.<string, string[]>}
     * @const
     */
    const derivationPaths = {
        'electrum-legacy': ['m/0', 'm/1'],
        'electrum-segwit': ["m/0'", "m/1'"],
        // 'bip32': ['m/0/0/0', 'm/0/0/1'],
        // 'bip84': ['m/84/0/0/0', 'm/84/0/0/1'],
        // 'bip44': ['m/44/0/0/0', 'm/44/0/0/1'],
    };

    /**
     * @type {Object.<string, string>}
     * @const
     */
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
            const balance = await _electrumClient.request('blockchain.scripthash.get_balance', [reversedHash]);
            addressBalances.set(xpubOrDoiAddress, {
                confirmed: balance.confirmed,
                unconfirmed: balance.unconfirmed
            });
        } catch (error) {
            log("Error fetching data from Electrum client", error);
            electrumUTXOs = []; // Ensure it's an empty array if request fails
        }

        if (!Array.isArray(_historyStore)) {
            log("_historyStore is not an array", _historyStore);
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
        for (const [standard, derivationPathBases] of Object.entries(derivationPaths)) {
            const addressType = addressTypes[standard];
            log(`\n Scanning standard: ${standard}`);
            log(`└── Address Type: ${addressType}`);

            for (const derivationPathBase of derivationPathBases) {
                log(`├── Base Path: ${derivationPathBase}`);
                
                index = 0;
                transactionsFound = true;

                const MAX_ADDRESSES = 20; // Or whatever reasonable limit you want to set

                while ((transactionsFound || index < gapLimit) && index < MAX_ADDRESSES) {
                    for (let i = 0; i < batchSize && (transactionsFound || index < gapLimit) && index < MAX_ADDRESSES; i++, index++) {
                        const derivationPath = `${derivationPathBase}/${index}`;
                        log(`\n📍 Deriving address batch ${Math.floor(index/batchSize)}:`);
                        log(`├── Path: ${derivationPath}`);
                        log(`├── Index: ${index}`);
                        
                        try {
                            const derivedAddress = deriveAddress(xpubOrDoiAddress, derivationPath, _network, addressType);
                            log(`└── ✅ Generated: ${derivedAddress}`);
                            derivedAddresses.push(derivedAddress);
                            addressDerivationPaths.set(derivedAddress, {
                                path: derivationPath,
                                standard: standard,
                                type: addressType
                            });
                        } catch (error) {
                            log(`└── ❌ Error: ${error.message}`);
                            continue;
                        }
                    }

                    // After batch derivation, log the electrum requests
                    log(`\n🔄 Checking transactions for ${derivedAddresses.length} addresses`);
                    
                    const scripts = derivedAddresses.map(addr => {
                        try {
                            return address.toOutputScript(addr, _network);
                        } catch (error) {
                            log(`❌ Script creation failed for ${addr}: ${error.message}`);
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
                            const currentAddress = derivedAddresses[idx];
                            log(`\n🔎 Checking address ${currentAddress}`);
                            
                            // Get balance for this address
                            const balance = await _electrumClient.request('blockchain.scripthash.get_balance', [hash]);
                            addressBalances.set(currentAddress, {
                                confirmed: balance.confirmed,
                                unconfirmed: balance.unconfirmed
                            });
                            log(`└── 💰 Balance: ${balance.confirmed/100000000} BTC (confirmed)`);

                            const utxos = await _electrumClient.request('blockchain.scripthash.listunspent', [hash]);
                            electrumUTXOs.push(...utxos); // Accumulate UTXOs for all addresses
                            const history = await _electrumClient.request('blockchain.scripthash.get_history', [hash]);
                            if (history.length > 0) {
                                log(`└── ✨ Found ${history.length} transactions`);
                                batchHistory.push(...history);
                            } else {
                                log(`└── 📭 No transactions found`);
                            }
                        }

                        if (batchHistory.length === 0) {
                            log(`\n💤 No transactions in this batch, gap: ${gapLimit - index}`);
                            transactionsFound = false;
                        } else {
                            log(`\n🎯 Found ${batchHistory.length} total transactions in this batch`, 'success');
                            transactionsFound = true;
                            // Add logging here to track transaction processing
                            log(`\n📝 Processing transactions...`);
                            batchHistory.forEach(tx => {
                                tx.derivationStandard = standard;
                                allTxs.push(tx);
                                log(`├── Added tx: ${tx.tx_hash.slice(0, 8)}...`);
                            });
                        }
                    } catch (error) {
                        log(`\n❌ Electrum request failed: ${error.message}`);
                    }
                }
            }
        }
    }

    // Process all transactions
    log(`Processing ${allTxs.length} transactions...`);
    for (const tx of allTxs) {
        log(`\nProcessing transaction: ${tx.tx_hash}`);
        let decryptedTx = await _electrumClient.request('blockchain.transaction.get', [tx.tx_hash, 1]);
        decryptedTx.formattedBlocktime = decryptedTx.blocktime ? 
            moment.unix(decryptedTx.blocktime).format('YYYY-MM-DD HH:mm:ss') : 'mempool';
        let inputTotal = 0;
        let outputTotal = 0;
        let involvesDerivedAddress = false;

        // Process inputs
        log(`- Processing ${decryptedTx.vin.length} inputs...`);
        for (const [index, vin] of decryptedTx.vin.entries()) {
            if (!vin.coinbase) {
                const prevTx = await _electrumClient.request('blockchain.transaction.get', [vin.txid, 1]);
                const spentOutput = prevTx.vout[vin.vout];
                const inputAddress = spentOutput.scriptPubKey?.addresses?.[0];
                
                log(`  Checking input address: ${inputAddress}`);
                log(`  Derived addresses to check against:`, derivedAddresses);
                log(`  Is address in derived addresses?`, derivedAddresses.includes(inputAddress));
                
                if (derivedAddresses.includes(inputAddress)) {
                    log(`  ✓ Found matching input address: ${inputAddress}`);
                    log(`  Creating transaction with:`);
                    log(`    - ID: ${decryptedTx.txid}_in_${index}`);
                    log(`    - Value: ${-spentOutput.value}`);
                    involvesDerivedAddress = true;
                    const _tx = {
                        ...decryptedTx,
                        id: `${decryptedTx.txid}_in_${index}`,
                        value: -spentOutput.value,
                        address: inputAddress,
                        type: 'input',
                        derivationPath: addressDerivationPaths.get(inputAddress)?.path || 'unknown',
                        derivationStandard: addressDerivationPaths.get(inputAddress)?.standard || 'unknown',
                        addressType: addressDerivationPaths.get(inputAddress)?.type || 'unknown'
                    };
                    log(`  Added transaction:`, _tx);
                    ourTxs.push(_tx);
                } else {
                    log(`  ✗ No match for input address: ${inputAddress}`);
                }
                inputTotal += spentOutput.value;
            }
            inputCount.set(_inputCount += 1);
        }

        // Process outputs
        log(`- Processing ${decryptedTx.vout.length} outputs...`);
        for (const [index, vout] of decryptedTx.vout.entries()) {
            const outputAddress = vout.scriptPubKey?.addresses?.[0];
            
            if (derivedAddresses.includes(outputAddress)) {
                log(`  Found matching output address: ${outputAddress}`);
                involvesDerivedAddress = true;
                const _tx = {
                    ...decryptedTx,
                    id: `${decryptedTx.txid}_out_${index}`,
                    value: vout.value,
                    address: outputAddress,
                    type: 'output',
                    n: vout.n,
                    derivationPath: addressDerivationPaths.get(outputAddress)?.path || 'unknown',
                    derivationStandard: addressDerivationPaths.get(outputAddress)?.standard || 'unknown',
                    addressType: addressDerivationPaths.get(outputAddress)?.type || 'unknown'
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
                    log(`  Found name operation: ${vout.scriptPubKey.nameOp.name}`);
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
            log(`- Transaction fee: ${fee}`);
            
            // Sort and update the store with each new batch of transactions
            ourTxs = ourTxs.sort((a, b) => b.blocktime - a.blocktime);
            txs.set(ourTxs); // Update the store incrementally
        }
    }
    log('\nTransaction processing complete!',ourTxs.length);

    // Final sort and update (though might not be necessary since we're updating incrementally)
    ourTxs = ourTxs.sort((a, b) => b.blocktime - a.blocktime);
    txs.set(ourTxs);

    return ourTxs;
}

/**
 * Derives a Bitcoin address from an extended public key
 * @param {string} xpubOrZpub - Extended public key (xpub or zpub format)
 * @param {string} derivationPath - BIP32 derivation path
 * @param {Object} network - Network configuration object
 * @param {('p2wpkh'|'p2pkh'|'segwit')} type - Address type to generate
 * @returns {string} Derived Bitcoin address
 * @throws {Error} If derivation fails or input is invalid
 */
export function deriveAddress(xpubOrZpub, derivationPath, network, type) {
    try {
        log(`\n Deriving address:`);
        log(`├── Input Key: ${xpubOrZpub.slice(0, 20)}...`);
        log(`├── Path: ${derivationPath}`);
        log(`└── Type: ${type}`);

        const decodedData = bs58.decode(xpubOrZpub);
        const data = Buffer.from(decodedData);
        
        if (data.length !== 82) {
            throw new Error('Invalid extended public key length');
        }

        const versionBytes = data.subarray(0, 4);
        const versionHex = versionBytes.toString('hex');
        log(`├── Version bytes: ${versionHex}`);

        let xpub = xpubOrZpub;
        
        // Handle ZPUB conversion to XPUB if needed
        if (versionHex === '04b24746') { // ZPUB (Doichain/Bitcoin mainnet)
            log(`├── Converting ZPUB to XPUB`);
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
            log(`├── Using native segwit network configuration`);
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
            log(`├── Using regular network configuration`);
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
            log(`└── ✅ Generated segwit: ${address}`);
            return address;
        } else { // legacy p2pkh
            const address = payments.p2pkh({ 
                pubkey: child.publicKey, 
                network 
            }).address;
            log(`└── ✅ Generated legacy: ${address}`);
            return address;
        }
    } catch (error) {
        log(`└── ❌ Error in deriveAddress: ${error}`, 'error');
        throw error;
    }
}

/**
 * Calculates total balance across all tracked addresses
 * @returns {{
 *   confirmed: number,
 *   unconfirmed: number,
 *   confirmedBTC: number,
 *   unconfirmedBTC: number,
 *   total: number
 * }} Balance information in satoshis and BTC
 */
export function getTotalBalance() {
    let total = {
        confirmed: 0,
        unconfirmed: 0
    };

    for (const balance of addressBalances.values()) {
        total.confirmed += balance.confirmed;
        total.unconfirmed += balance.unconfirmed;
    }

    return {
        confirmed: total.confirmed,
        unconfirmed: total.unconfirmed,
        confirmedBTC: total.confirmed / 100000000,
        unconfirmedBTC: total.unconfirmed / 100000000,
        total: (total.confirmed + total.unconfirmed) / 100000000
    };
}

/**
 * Validates if a string is a valid Bitcoin address for the given network
 * @param {string} addressStr - Address to validate
 * @param {Object} network - Network configuration object
 * @returns {boolean} True if address is valid
 */
export function isValidBitcoinAddress(addressStr, network) {
    try {
        address.toOutputScript(addressStr, network);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Logs a message with timestamp and type
 * @param {string} message - Message to log
 * @param {('info'|'error'|'success')} [type='info'] - Type of log entry
 * @private
 */
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        message,
        type // 'info', 'error', 'success'
    };
    
    logs.update(currentLogs => {
        const newLogs = [logEntry, ...currentLogs];
        // Optionally limit the number of logs kept
        return newLogs.slice(0, 1000); // Keep last 1000 logs
    });
    
    // Still keep console.log for debugging
    console.log(message);
}

// Exports
export { addressBalances };