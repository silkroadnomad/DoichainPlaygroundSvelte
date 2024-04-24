import { address, crypto } from 'bitcoinjs-lib';
import { readData, writeData } from '$lib/indexedDBUtil.js';
import moment from 'moment';
import Buffer from 'vite-plugin-node-polyfills/shims/buffer/index.js';

export const getAddressTxs = async (_doiAddress, _historyStore, _electrumClient, _network) => {

    let script = address.toOutputScript(_doiAddress, _network);
    let hash = crypto.sha256(script);
    let reversedHash = Buffer.from(hash.reverse()).toString("hex");

    let _history;

    if (navigator.onLine) {
        try {
            _historyStore = await _electrumClient.request('blockchain.scripthash.get_history', [reversedHash]);
            await writeData({ id: reversedHash + "_history", data: _historyStore });
        } catch (error) {
            console.error("Error fetching online, trying cache...", error);
            _history = await readData(reversedHash + "_history");
            _historyStore = _history ? _history.data : null;
        }
    } else {
        _history = await readData(reversedHash + "_history");
        _historyStore = _history ? _history.data : null;
    }

    if (!_historyStore) {
        console.error("No history available offline.");
        return []; // Handle case where no data is available
    }

    let txs = [];
    for (const tx of _historyStore) {
        let cachedTx = await readData(tx.tx_hash);
        let decryptedTx;
        if (cachedTx) {
            decryptedTx = JSON.parse(cachedTx.data);
        } else {
            decryptedTx = await _electrumClient.request('blockchain.transaction.get', [tx.tx_hash, 1]);
            await writeData({id: tx.tx_hash,  data: JSON.stringify(decryptedTx)});
        }

        decryptedTx.formattedBlocktime = moment.unix(decryptedTx.blocktime).format('YYYY-MM-DD HH:mm:ss');
        decryptedTx.value = 0; // Update this as per your logic

        for (const [index, vin] of decryptedTx.vin.entries()) {
            const prevTx = await _electrumClient.request('blockchain.transaction.get', [vin.txid, 1], true); // true for verbose to get detailed transaction
            const spentOutput = prevTx.vout[vin.vout]; // vin.vout is the index of the output in prevTx that vin is spending
            if (spentOutput.scriptPubKey.addresses.includes(_doiAddress)) {
                const _tx = JSON.parse(JSON.stringify(decryptedTx));
                _tx.id = decryptedTx.txid+'_in_'+index
                _tx.value = -spentOutput.value; // Negative because it's spent
                _tx.address = spentOutput.scriptPubKey.addresses[0]
                txs.push(_tx);
            }
        }

        for (const [index, vout] of decryptedTx.vout.entries()) {
            const _tx = JSON.parse(JSON.stringify(decryptedTx));
            _tx.id = decryptedTx.txid+'_out_'+index;
            let address, nameId, nameValue

            const asm = vout.scriptPubKey.asm
            const asmParts = asm.split(" ")

            if (asmParts[0] !== 'OP_10' && asmParts[0] !== 'OP_NAME_DOI') {
                _tx.address = vout.scriptPubKey.addresses[0]
                console.log('address', _tx.address)
                // for (let i = 0; i < addressList.length; i++) { //TODO when displaying a complete xpub with all addresses this becomes interesting
                //     if (address == addressList[i]) {
                //         utxo = true
                //         break
                //     }
                // }
            } else {
                const chunks = vout.scriptPubKey.asm.split(" ")
                nameId = vout.scriptPubKey.nameOp.name
                nameValue = vout.scriptPubKey.nameOp.value
                address = conv(chunks[7], { in: 'hex', out: 'binary' })

                console.log('name_op nameId', nameId)
                console.log('name_op nameValue', nameValue)
                console.log('name_op address', address)
            }

            _tx.value=vout.value
            _tx.n=vout.n

            if(_tx.address===_doiAddress) //add tx if its an utxo of our address
                txs.push(_tx);
        }
    }

    // Group transactions by txid and accumulate values for transactions with the same txid
    const groupedTxs = txs.reduce((acc, tx) => {
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

    txs = Object.values(groupedTxs);
    txs = txs.sort((a, b) => b.blocktime - a.blocktime);
    console.log("txs",txs)
    return txs
};