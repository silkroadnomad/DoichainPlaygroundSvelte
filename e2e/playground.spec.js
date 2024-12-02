import { expect, test } from '@playwright/test';
import axios from 'axios';
import WebSocket from 'ws';
const websocketUrl = 'wss://127.0.0.1:8443';
const rpcUrl = 'http://127.0.0.1:18332';
const rpcUser = 'admin';
const rpcPassword = 'adminpw';
const credentials = Buffer.from(`${rpcUser}:${rpcPassword}`).toString('base64');


async function callRpc(method, params = []) {
    try {
        const response = await axios.post(rpcUrl, {
            jsonrpc: '1.0',
            id: 'curltest',
            method: method,
            params: params
        }, {
            auth: {
                username: rpcUser,
                password: rpcPassword
            }
        });
        return response.data.result;
    } catch (error) {
        console.error(`Error calling RPC method ${method}:`, error.message);
        throw error;
    }
}

function generateRandomName() {
    return 'wallet_' + Math.random().toString(36).substring(2, 15);
}

test.use({
    ignoreHTTPSErrors: true,
});


test.describe('Wallet Generation Tests', () => {

    test.beforeAll(async () => {
        const ws = new WebSocket(websocketUrl, {
            headers: {
                Authorization: `Basic ${credentials}`
            },
            rejectUnauthorized: false // Allows connections to servers with self-signed certificates
        });

        // Create a promise that resolves when the connection is open
        const connectionPromise = new Promise((resolve, reject) => {
            ws.on('open', () => {
                console.log('WebSocket connection established');
                ws.send('Hello Server!');
                resolve();
            });

            ws.on('error', (err) => {
                console.error('WebSocket error:', err);
                reject(new Error('WebSocket connection failed'));
            });

            ws.on('close', () => {
                console.log('WebSocket connection closed');
            });
        });

        // Wait for the connection to be established or fail
        await connectionPromise;
        
        const walletName = generateRandomName();
        console.log(`Creating wallet with name: ${walletName}`);
        
        // Create a new wallet with a random name
        // // await callRpc('createwallet', [walletName]);
        // console.log(await callRpc('getwalletinfo'));
        // console.log(await callRpc('getnewaddress'));
        // // Generate 200 blocks to mine 200 DOI
        // // Replace 'your_address_here' with a valid address from the created wallet
        // await callRpc('generatetoaddress', [200, 'your_address_here']);
    });


    test('Change to ElectrumX-Doi Regtest', async ({ page, browser }) => {
   
        await page.goto('http://localhost:5173/');
        await page.waitForSelector('text=You are connected to an', { state: 'visible' });
        await page.getByRole('button', { name: 'Doichain-Mainnet Open menu' }).click();
        await page.getByText('Doichain-Regtest').click();
        await page.getByLabel('Select Wallet').first().selectOption('electrum-legacy');
        await page.getByRole('button', { name: 'Generate Mnemonic' }).click();
        const mnemonic = await page.inputValue('#mnemonicTextarea');
        await page.getByLabel('Mnemonic').click();
        expect(mnemonic).not.toBe('');
    });

    // ... other tests ...
});
