import { expect, test } from '@playwright/test';
import axios from 'axios';
import WebSocket from 'ws';
import { hostname } from 'os';

const isPlaywright = hostname() === 'playwright';

const websocketUrl = isPlaywright ? 'wss://electrumx:8443' : 'wss://localhost:8443';
let rpcUrl = isPlaywright ? 'http://regtest:18332/' : 'http://localhost:18332/';
const rpcUser = 'admin';
const rpcPassword = 'adminpw';
const credentials = Buffer.from(`${rpcUser}:${rpcPassword}`).toString('base64');

async function callRpc(method, params = [], alternativeRPCURL) {
    console.log(alternativeRPCURL?alternativeRPCURL:rpcUrl,method,params);
    try {
        const response = await axios.post(alternativeRPCURL?alternativeRPCURL:rpcUrl, {
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
        try {
            // Check the current block height
            const blockHeight = await callRpc('getblockcount', [], rpcUrl);

            if (blockHeight === 0) {
                const walletName = generateRandomName();
                console.log(`Creating wallet with name: ${walletName}`);
                
                // Create a new wallet with a random name
                await callRpc('createwallet', [walletName]);

                // Update rpcUrl based on the hostname
                rpcUrl = isPlaywright 
                    ? `http://regtest:18332/wallet/${walletName}` 
                    : `http://localhost:18332/wallet/${walletName}`;

                const newAddress = await callRpc('getnewaddress', [], rpcUrl);
                console.log(newAddress);
                console.log(await callRpc('getbalance', [], rpcUrl));
                const mining = await callRpc('generatetoaddress', [200, newAddress], rpcUrl);
                console.log(mining);
            } else {
                console.log(`Block height is already greater than 0: ${blockHeight}`);
            }
        } catch (error) {
            console.error('Error during setup:', error.message);
            throw error;
        }

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
        // console.log(await callRpc('getnewaddress'));
        // // Generate 200 blocks to mine 200 DOI
        // // Replace 'your_address_here' with a valid address from the created wallet
        // await callRpc('generatetoaddress', [200, 'your_address_here']);
    });


    test('Basic Wallet Generation Test', async ({ page, browser }) => {
   
        await page.goto('/');
        await page.waitForSelector('text=You are connected to an', { state: 'visible' });
        await page.getByRole('button', { name: 'Doichain-Mainnet Open menu' }).click();
        await page.getByText('Doichain-Regtest').click();
        await page.selectOption('#derivationStandardSelect', 'electrum-legacy');
        await page.getByRole('button', { name: 'Generate Mnemonic' }).click();
        const mnemonic = await page.inputValue('#mnemonicTextarea');
        await page.getByLabel('Mnemonic').click();
        expect(mnemonic).not.toBe('');
    });

    test('Basic Address Generation Test', async ({ page, browser }) => {
        await page.goto('/');
        await page.waitForSelector('text=You are connected to an', { state: 'visible' });
        await page.getByRole('button', { name: 'Doichain-Mainnet Open menu' }).click();
        await page.getByText('Doichain-Regtest').click();
        await page.selectOption('#derivationStandardSelect', 'electrum-legacy');
        
        // Set the mnemonic to the specified seed phrase
        await page.fill('#mnemonicTextarea', 'test test test test test test test test test test test test');
        
        // Fill in the password for decryption
        await page.fill('#passwordInput', 'mnemonic');
        
        // Click to decrypt
        await page.getByRole('button', { name: 'Decrypt' }).click();
        
        // Extract the generated address
        const generatedAddress = await page.inputValue('#nextUnusedAddress');
        
        // Verify the generated address
        expect(generatedAddress).toBe('n3csERn5LkYxgmNQ1XH4qfRR5Ak8v3p3HU');
    });

    // ... other tests ...
});
