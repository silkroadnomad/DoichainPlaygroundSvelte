import { address, crypto } from 'bitcoinjs-lib';
import { DB_NAME, openDB, readData, addData } from '$lib/indexedDBUtil.js';
import moment from 'moment';
import Buffer from 'vite-plugin-node-polyfills/shims/buffer/index.js';
import { txs, inputCount, outputCount, namesCount } from '../routes/store.js';

let _inputCount,_outputCount,_namesCount = 0;
inputCount.subscribe((v) => _inputCount = v);
outputCount.subscribe((v) => _outputCount = v);
namesCount.subscribe((v) => _namesCount = v);

export const getAddressTxs = async (_doiAddress, _historyStore, _electrumClient, _network) => {
    console.log("now getting transactions of ", _doiAddress)

    let script = address.toOutputScript(_doiAddress, _network);
    let hash = crypto.sha256(script);
    let reversedHash = Buffer.from(hash.reverse()).toString("hex");

    let _history;
    let ourTxs = []
    let electrumUTXOs = []
    if (navigator.onLine) {
        console.log("opening db", DB_NAME)
        // const db = await openDB(DB_NAME,"history")
        try {
            electrumUTXOs = await _electrumClient.request('blockchain.scripthash.listunspent', [reversedHash]);
            console.log("electrumUTXOs", electrumUTXOs)
            _historyStore = await _electrumClient.request('blockchain.scripthash.get_history', [reversedHash]);
            console.log("_historyStore", _historyStore)
            // await addData(db,{ id: reversedHash + "_history", data: _historyStore });
        } catch (error) {
            console.error("Error fetching online, trying cache...", error);
            // _history = await readData(db,reversedHash + "_history");
            // _historyStore = _history ? _history.data : null;
        }
    } else {
        //_history = await readData(db,reversedHash + "_history");
        _historyStore = _history ? _history.data : null;
    }

    // console.log('_historyStore', _historyStore)
    for (const tx of _historyStore) {

        // const db = await openDB(DB_NAME,"txs")
        // let cachedTx = await readData(db,tx.tx_hash);
        let decryptedTx;
        if (false) { //TODO cachedTx
            decryptedTx = JSON.parse(cachedTx);
        } else {
            decryptedTx = await _electrumClient.request('blockchain.transaction.get', [tx.tx_hash, 1]);

            // await addData(db,{id: tx.tx_hash,  data: JSON.stringify(decryptedTx)});
        }
        decryptedTx.formattedBlocktime = decryptedTx.blocktime ? moment.unix(decryptedTx.blocktime).format('YYYY-MM-DD HH:mm:ss') : 'mempool'
        decryptedTx.value = 0;
        let inputTotal = 0;
        let outputTotal = 0;

        // console.log("decryptedTx.formattedBlocktime",decryptedTx.formattedBlocktime)

        for (const [index, vin] of decryptedTx.vin.entries()) {
            if (!vin.coinbase) {
                const prevTx = await _electrumClient.request('blockchain.transaction.get', [vin.txid, 1], true); // true for verbose to get detailed transaction
                const spentOutput = prevTx.vout[vin.vout]; // vin.vout is the index of the output in prevTx that vin is spending
                if (spentOutput.scriptPubKey.addresses === undefined //could be undefined for some reason? coinbase?
                  || spentOutput.scriptPubKey.addresses.includes(_doiAddress)) {
                    const _tx = JSON.parse(JSON.stringify(decryptedTx));
                    _tx.id = decryptedTx.txid + '_in_' + index
                    _tx.value = -spentOutput.value; // Negative because it's spent
                    _tx.address = spentOutput.scriptPubKey?.addresses //?spentOutput.scriptPubKey?.addresses[0]:_doiAddress //if coinbase tx no addresses in scriptpbukey
                    _tx.fee = decryptedTx.fee
                    ourTxs.push(_tx);
                    // txs.update(_txs => {
                    //     _txs.push(_tx);
                    //     return _txs;
                    // });
                }
                inputTotal += spentOutput.value; // Sum up all input values
            }
            inputCount.set(_inputCount += 1)
        }

        for (const [index, vout] of decryptedTx.vout.entries()) {
            const _tx = JSON.parse(JSON.stringify(decryptedTx));
            _tx.id = decryptedTx.txid + '_out_' + index;

            const asm = vout.scriptPubKey.asm
            const asmParts = asm.split(" ")

            if (asmParts[0] !== 'OP_10' && asmParts[0] !== 'OP_NAME_DOI') {
                _tx.address = vout.scriptPubKey?.addresses ? vout.scriptPubKey?.addresses[0] : _doiAddress
            } else {
                const chunks = vout.scriptPubKey.asm.split(" ")

                _tx.nameId = vout.scriptPubKey.nameOp.name
                _tx.nameValue = vout.scriptPubKey.nameOp.value
                _tx.address = vout.scriptPubKey?.addresses[0]

                namesCount.set(_namesCount += 1)
                //_tx.address = Buffer.from(chunks[7], 'hex').toString() //.toString('utf-8');

                // console.log(asciiString);
                // _tx.address = conv(chunks[7], { in: 'hex', out: 'binary' })
                console.log("tx", _tx.id)
                console.log('name_op nameId', _tx.nameId)
                console.log('name_op nameValue', _tx.nameValue)
                console.log('name_op address', _tx.address)
            }

            _tx.fee = decryptedTx.fee
            _tx.value = vout.value
            _tx.n = vout.n
            outputTotal += vout.value; // Sum up all output values

            //compare all electrumUTXOYs has one of our utxos and mark it as utxo
            if (_tx.address === _doiAddress) {
                const isUTXO = electrumUTXOs.some(utxo => utxo.tx_hash === _tx.txid && utxo.tx_pos === _tx.n);
                if (isUTXO) {
                    console.log("is utxos",_tx)
                    _tx.utxo = true;
                }
                ourTxs.push(_tx);
                // txs.update(_txs => {
                //     _txs.push(_tx);
                //     return _txs;
                // });
                outputCount.set(_outputCount += 1)
            }
        }

        const fee = inputTotal - outputTotal; // Calculate the fee
        // console.log("fee",fee)
        //we forgot the fee we need to add it now
        ourTxs.forEach(__tx => {
            // console.log("__tx.txid",__tx.txid)
            // console.log("tx",decryptedTx.txid)
            if (__tx.txid.startsWith(decryptedTx.txid)) {
                __tx.fee = fee;
            }
        });

        // console.log("ourTxs", ourTxs)
        // Group txs by txid and accumulate values for txs with the same txid
        const groupedTxs = ourTxs.reduce((acc, tx) => {
            // Use txid as the key for grouping
            const key = tx.txid;
            if (!acc[key]) {
                // If this txid hasn't been seen before, add it directly
                acc[key] = { ...tx };
            } else {
                // If this txid has been seen, accumulate the value
                acc[key].value += tx.value;
            }
            return acc;
        }, {});

        // ourTxs = Object.values(groupedTxs);
        ourTxs = ourTxs.sort((a, b) => b.blocktime - a.blocktime);
        txs.set(ourTxs)
    }
    return ourTxs
}