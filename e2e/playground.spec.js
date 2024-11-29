import { expect, test } from '@playwright/test';

test.describe('Wallet Generation Tests', () => {
    test('should generate a new mnemonic and test all wallet types', async ({ page }) => {
        // Navigate to the page
        await page.goto('https://doichain-playground-svelte.vercel.app/');

        // Generate a new mnemonic
        await page.click('button:has-text("Generate Mnemonic")');
        const mnemonic = await page.inputValue('textarea[labelText="Mnemonic"]');
        expect(mnemonic).not.toBe('');

        // Test each derivation standard
        const derivationStandards = [
            'electrum-legacy',
            'electrum-segwit',
            'bip32',
            'bip32-p2wpkh',
            'bip84'
        ];

        for (const standard of derivationStandards) {
            // Select the derivation standard
            await page.selectOption('select[labelText="Select Wallet"]', { value: standard });

            // Generate addresses
            await page.click('button:has-text("Save")');

            // Verify that addresses are generated
            const addresses = await page.$$eval('.datatable .address', nodes => nodes.map(n => n.textContent));
            expect(addresses.length).toBeGreaterThan(0);

            // Optionally, verify the first address format or other properties
            console.log(`Addresses for ${standard}:`, addresses);
        }
    });
});
