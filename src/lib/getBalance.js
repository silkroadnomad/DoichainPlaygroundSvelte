import { address, crypto } from 'bitcoinjs-lib';

/**
 *
 *
 * @param _doiAddress
 * @param _electrumClient
 * @param _network
 * @returns {Promise<*>}
 */
export const getBalance = async (_doiAddress, _electrumClient, _network) => {
    if(!_doiAddress) return {confirmed:0,unconfirmed:0}
    let script = address.toOutputScript(_doiAddress, _network);
    let hash = crypto.sha256(script);
    let reversedHash = Buffer.from(hash.reverse()).toString("hex");

    const balance = await _electrumClient.request('blockchain.scripthash.get_balance', [reversedHash]);
    return balance;
};