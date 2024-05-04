<script>
    import "carbon-components-svelte/css/all.css";
    import { fade } from "svelte/transition";
    import {
        Button,
        TextArea,
        Grid,
        Row,
        Column,
        TextInput,
        ToastNotification,
        SelectItem, Select
    } from 'carbon-components-svelte';
    import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
    import { payments } from 'bitcoinjs-lib';
    import * as ecc from 'tiny-secp256k1';
    import { currentWif, network,
     currentAddressP2pkh, 
     currentAddressP2wpkh, 
     currentAddressP2wpkhP2Sh } from './store.js';
    import { DB_NAME, openDB, readData, addData, deleteData } from '$lib/indexedDBUtil.js';
    import AES from 'crypto-js/aes';
    import Utf8 from 'crypto-js/enc-utf8';
    import BIP32Factory from 'bip32';
    import { onMount } from 'svelte';
    const bip32 = BIP32Factory(ecc);

    let wallets = [];
    let mnemonic = '';
    let selectedMnemonic = localStorage.getItem('selectedMnemonic') || 0
    let password = 'mnemonic';
    let root = '';
    let xpriv = '';
    let xpub = '';
    let derivationPath = 'm/0/0/0';

    let derivationWif = ''
    let addressP2pkh = '';
    let addressP2wpkh = '';
    let addressP2wpkhP2Sh = '';

    //address generation function
    function generateAddresses() {

        derivationWif = root.derivePath(derivationPath).toWIF()
        $currentWif=derivationWif

        addressP2pkh = payments.p2pkh({ pubkey: root.derivePath(derivationPath).publicKey, network: $network }).address;
        $currentAddressP2pkh=addressP2pkh
        addressP2wpkh = payments.p2wpkh({ pubkey: root.derivePath(derivationPath).publicKey, network: $network }).address;
        $currentAddressP2wpkh=addressP2wpkh
        addressP2wpkhP2Sh = payments.p2sh({
            redeem: payments.p2wpkh({ pubkey: root.derivePath(derivationPath).publicKey, network: $network })
        }).address;
        $currentAddressP2wpkhP2Sh=addressP2wpkhP2Sh
    }

    // Generate master seed root, xpriv, and xpub
    async function generateKeys() {
        const seed = mnemonicToSeedSync(mnemonic, password);
        root = bip32.fromSeed(seed, $network);
        xpriv = root.toBase58();
        xpub = root.neutered().toBase58();
        generateAddresses();
    }

    $: if (password) wallets = wallets //as password changes we need to rerender the wallets in order to decrypt the contents
    $: if (mnemonic && password) { try { generateKeys() } catch(e){ console.error(e) }}
    $: if ($network &&derivationPath && root) {try { generateAddresses() } catch(e){ console.error(e) }}
    $: {
        if(wallets?.length>0 && selectedMnemonic){
            localStorage.setItem("selectedMnemonic",selectedMnemonic)
            const selectedWallet = wallets.find(w => w.id.toString() === selectedMnemonic)
            mnemonic = decryptMnemonic(selectedWallet.mnemonic)

        }
    }

    let timeout
    let toastNotification
    $: showNotification = timeout !== undefined;

    async function storeMnemonic() {
        try {
            const db = await openDB(DB_NAME, "wallets");
            if (!db) {
                toastNotification = "Mnemonic or password is empty";
                throw new Error("Failed to open database");
            }
            wallets = await readData(db) || [];
            if (!mnemonic || !password) {
                toastNotification = "Mnemonic or password is empty.";
                throw new Error("Mnemonic or password is empty");
            }
            const encryptedMnemonic = AES.encrypt(mnemonic, password).toString();
            const data = { id: (wallets.length + 1), mnemonic: encryptedMnemonic, date: new Date() };
            wallets.push(data);
            await addData(db, data);
            toastNotification = "Mnemonic has been successfully stored.";
            timeout = 3000;
        } catch (error) {
            console.error("Error storing mnemonic:", error);
            toastNotification = "Failed to add mnemonic to db: " + error.message;
            timeout = 3000;
        }
    }

    async function loadMnemonic() {
        try {
            const db = await openDB(DB_NAME, "wallets")
            wallets = await readData(db) || []
            selectedMnemonic = localStorage.getItem('selectedMnemonic'); // Get the mnemonic ID directly
            console.log("Wallets loaded", wallets);
            toastNotification = "Mnemonics have been successfully loaded.";
            timeout = 3000;
        } catch (error) {
            toastNotification = "Failed to load mnemonics from db";
            timeout = 3000;
        }
    }

    async function deleteMnemonic() {
        const db = await openDB(DB_NAME, "wallets");
        const selectedWallet = wallets.find(w => w.id === selectedMnemonic);
        if (selectedWallet) {
            await deleteData(db, selectedWallet.id);
            wallets = wallets.filter(w => w.id !== selectedWallet.id);
            mnemonic = ''; // Clear the current mnemonic
            toastNotification = "Mnemonic has been successfully deleted.";
            timeout = 3000;
        } else {
            toastNotification = "Mnemonic not found.";
            timeout = 3000;
        }
    }

    function decryptMnemonic(encryptedMnemonic) {
        const bytes = AES.decrypt(encryptedMnemonic || '', password);
        let originalText
          try { originalText = bytes.toString(Utf8)}catch(ex){}
        return originalText;
    }
    
    onMount(async () => {
        await loadMnemonic();
        selectedMnemonic = localStorage.getItem('selectedMnemonic'); // Get the mnemonic ID directly
        await generateKeys()
    });

</script>

<h1>Welcome to Doichain Developer Playground</h1>
<h2>Key and Address Generation</h2>

<Grid>
    <Row>
        <Column><h2>1. Generate mnemonic for a new wallet</h2></Column>
        <Column>
            <Select labelText="Select Wallet" bind:selected={selectedMnemonic}>
                <SelectItem disabled value="" text="Choose a wallet" />
                {#each wallets as wallet}
                    <SelectItem value={wallet.id.toString()} text={`${decryptMnemonic(wallet.mnemonic)?.substring(0,20)}  ${wallet.date.toLocaleString()}`} />
                {/each}
            </Select>
            <TextArea labelText="Mnemonic" rows={2} bind:value={mnemonic} />
            <Button on:click={async () => {
                mnemonic = generateMnemonic()
            }}>Generate Mnemonic</Button>
            <Button on:click={storeMnemonic}>Store Mnemonic</Button>
            <Button on:click={deleteMnemonic} class="delete-button">Delete Mnemonic</Button>
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
        <Column><h3>Wif (PrivKey):</h3></Column>
        <Column><h4>{derivationWif || ''}</h4></Column>
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

{#if showNotification}
    <div transition:fade>
        <ToastNotification
            {timeout}
            kind="success"
            title="Success"
            subtitle={toastNotification}
            caption={new Date().toLocaleString()}
            on:close={() => {
                timeout = undefined;
            }}
        />
    </div>
{/if}

<style>
    h1, h2, h3, h4 {
        margin-left: 20px;
        margin-top: 20px;
    }
</style>

