import { address, crypto } from 'bitcoinjs-lib';
import { deriveAddress, isValidBitcoinAddress } from './getAddressTxs.js'; // Import your deriveAddress function

/**
 * Retrieves the balance for a given address or xpub, using an Electrum client
 * For xpub addresses, it derives multiple addresses using the derivation path and checks balances until the gap limit
 * For regular addresses, it directly fetches the balance
 *
 * @param {string} _doiAddress - The address or xpub to check balance for
 * @param {ElectrumClient} _electrumClient - Instance of Electrum client for making requests
 * @param {Network} _network - Network configuration (e.g., bitcoin mainnet or testnet)
 * @param {string} derivationPathBase - Base derivation path for xpub address derivation
 * @param {number} [gapLimit=20] - Number of empty addresses to check before stopping (default: 20)
 * @returns {Promise<{confirmed: number, unconfirmed: number}>} Object containing confirmed and unconfirmed balances in satoshis
 * @throws {Error} When there's an error connecting to Electrum server or invalid address format
 */
export const getBalance = async (_doiAddress, _electrumClient, _network, derivationPathBase, gapLimit = 20) => {
    if (!_doiAddress) return { confirmed: 0, unconfirmed: 0 };

    let totalBalance = { confirmed: 0, unconfirmed: 0 };
    const isXpub = !isValidBitcoinAddress(_doiAddress, _network); // Assuming you have a function to check this

    if (isXpub) {
        let index = 0;
        let transactionsFound = true;
        console.log(`Starting balance check for xpub with gap limit: ${gapLimit}`);

        while (transactionsFound || index < gapLimit) {
            const derivationPath = `${derivationPathBase}/${index}`;
            const derivedAddress = deriveAddress(_doiAddress, derivationPath, _network);
            console.log(`Checking address ${index}: ${derivedAddress}`);

            const script = address.toOutputScript(derivedAddress, _network);
            const hash = crypto.sha256(script);
            const reversedHash = Buffer.from(hash.reverse()).toString("hex");

            try {
                const balance = await _electrumClient.request('blockchain.scripthash.get_balance', [reversedHash]);
                totalBalance.confirmed += balance.confirmed;
                totalBalance.unconfirmed += balance.unconfirmed;
                console.log(`Balance for ${derivedAddress}: Confirmed=${balance.confirmed}, Unconfirmed=${balance.unconfirmed}`);
            } catch (error) {
                console.error(`Error fetching balance for address ${derivedAddress}:`, error.message);
            }

            // Check if there are transactions for this address
            const history = await _electrumClient.request('blockchain.scripthash.get_history', [reversedHash]);
            transactionsFound = history.length > 0;
            console.log(`Address ${derivedAddress} has ${history.length} transactions`);

            index++;
        }
        console.log(`Finished scanning. Total balance: Confirmed=${totalBalance.confirmed}, Unconfirmed=${totalBalance.unconfirmed}`);
    } else {
        // If it's a valid address, get balance directly
        console.log(`Checking balance for single address: ${_doiAddress}`);
        const script = address.toOutputScript(_doiAddress, _network);
        const hash = crypto.sha256(script);
        const reversedHash = Buffer.from(hash.reverse()).toString("hex");

        totalBalance = await _electrumClient.request('blockchain.scripthash.get_balance', [reversedHash]);
        console.log(`Balance found: Confirmed=${totalBalance.confirmed}, Unconfirmed=${totalBalance.unconfirmed}`);
    }

    return totalBalance;
};