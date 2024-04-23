<script>
    import "carbon-components-svelte/css/all.css";
    import { Button, TextArea, Grid, Row, Column, TextInput } from 'carbon-components-svelte';
    import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
    import { payments } from 'bitcoinjs-lib';
    import * as ecc from 'tiny-secp256k1';
    import { network } from './store.js';
    import BIP32Factory from 'bip32';
    const bip32 = BIP32Factory(ecc);

    let mnemonic = '';
    let password = 'mnemonic';
    let root = '';
    let xpriv = '';
    let xpub = '';
    let derivationPath = 'm/0/0/0';

    let addressP2pkh = '';
    let addressP2wpkh = '';
    let addressP2wpkhP2Sh = '';

    // Consolidated address generation function
    function generateAddresses() {
        addressP2pkh = payments.p2pkh({ pubkey: root.derivePath(derivationPath).publicKey, network: $network }).address;
        addressP2wpkh = payments.p2wpkh({ pubkey: root.derivePath(derivationPath).publicKey, network: $network }).address;
        addressP2wpkhP2Sh = payments.p2sh({
            redeem: payments.p2wpkh({ pubkey: root.derivePath(derivationPath).publicKey, network: $network })
        }).address;
    }

    // Generate master seed root, xpriv, and xpub
    async function createKeys() {
        const seed = mnemonicToSeedSync(mnemonic, password);
        root = bip32.fromSeed(seed, $network);
        xpriv = root.toBase58();
        xpub = root.neutered().toBase58();
        generateAddresses();
    }

    // Reactively watch for changes
    $: {
        if (mnemonic && password) {
            try { createKeys() } catch(e){ console.error(e) }
        }
    }

    $: {
        if (derivationPath && root) {
            try { generateAddresses() } catch(e){ console.error(e) }
        }
    }
</script>

<h1>Welcome to the Doichain Playground</h1>
<h2>Key and Address Generation</h2>

<Grid>
    <Row>
        <Column><h2>1. Generate mnemonic for a new wallet</h2></Column>
        <Column>
            <TextArea labelText="Mnemonic" rows={2} bind:value={mnemonic} />
            <Button on:click={() => mnemonic = generateMnemonic()}>Generate Mnemonic</Button>
        </Column>
    </Row>
    <Row>
        <Column><h2>2. Get XPriv and XPub from mnemonic</h2></Column>
        <Column><TextInput labelText="Password" bind:value={password}/></Column>
    </Row>
    <Row>
        <Column><h2>xpriv (HD node root key) (base58)</h2></Column>
        <Column><TextInput labelText="xpriv" bind:value={xpriv} readonly/></Column>
    </Row>
    <Row>
        <Column><h2>xpub</h2></Column>
        <Column><TextInput labelText="xpub" bind:value={xpub} readonly /></Column>
    </Row>
    <Row>
        <Column><h2>3. Derive addresses from derivation path (bip32)</h2></Column>
        <Column><TextInput labelText="Derivation Path" bind:value={derivationPath} /></Column>
    </Row>
    <Row>
        <Column><h3>Address (Legacy):</h3></Column>
        <Column><h4>{addressP2pkh || ''}</h4></Column>
    </Row>
    <Row>
        <Column><h3>Address (Segwit):</h3></Column>
        <Column><h4>{addressP2wpkh || ''}</h4></Column>
    </Row>
    <Row>
        <Column><h3>Address (Segwit via P2SH):</h3></Column>
        <Column><h4>{addressP2wpkhP2Sh || ''}</h4></Column>
    </Row>
</Grid>

<style>
    h1, h2, h3, h4 {
        margin-left: 20px;
        margin-top: 20px;
    }
</style>

