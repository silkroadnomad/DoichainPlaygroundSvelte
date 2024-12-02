import { expect, test } from '@playwright/test';

test.describe('Wallet Generation Tests', () => {

    test('test', async ({ page }) => {
        await page.goto('http://localhost:5173/');
        await page.waitForSelector('text=You are connected to an', { state: 'visible' });
        await page.getByLabel('Select Wallet').first().selectOption('electrum-legacy');
        //await page.getByRole('button', { name: 'Decrypt' }).click();
        await page.getByRole('button', { name: 'Generate Mnemonic' }).click();
        //await expect(page.getByLabel('Mnemonic')).toBeVisible();
        const mnemonic = await page.inputValue('#mnemonicTextarea');
        await page.getByLabel('Mnemonic').click();
        expect(mnemonic).not.toBe('');
        // await expect(page.getByLabel('Mnemonic')).toHaveValue('gentle model squirrel point soldier suit daring april ketchup soon lemon year');
    });
    // test('should generate a new mnemonic and test all wallet types', async ({ page }) => {
    //     // Navigate to the page
    //     await page.goto('/');
    //     await page.waitForSelector('text=You are connected to an', { state: 'visible' });


    //     // Ensure the button is visible
    //     await page.waitForSelector('button:has-text("Generate Mnemonic")', { state: 'visible' });

    //     // Generate a new mnemonic
    //     await page.click('button:has-text("Generate Mnemonic")');
    //     await page.waitForFunction(() => document.querySelector('#mnemonicTextarea').value !== '');
    //     const mnemonic = await page.inputValue('#mnemonicTextarea');
    //     console.log('mnemonic', mnemonic);
    //     expect(mnemonic).not.toBe('');

    //     // Test each derivation standard
    //     const derivationStandards = [
    //         'electrum-legacy',
    //         'electrum-segwit',
    //         'bip32',
    //         'bip32-p2wpkh',
    //         'bip84'
    //     ];

    //     for (const standard of derivationStandards) {
    //         // Select the derivation standard
    //         await page.selectOption('select[labelText="Select Wallet"]', { value: standard });

    //         // Generate addresses
    //         await page.click('button:has-text("Save")');

    //         // Verify that addresses are generated
    //         const addresses = await page.$$eval('.datatable .address', nodes => nodes.map(n => n.textContent));
    //         expect(addresses.length).toBeGreaterThan(0);

    //         // Optionally, verify the first address format or other properties
    //         console.log(`Addresses for ${standard}:`, addresses);
    //     }
    // });
});
