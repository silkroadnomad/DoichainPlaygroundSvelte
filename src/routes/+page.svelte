<script>
    import "carbon-components-svelte/css/all.css";
    import { fade } from "svelte/transition";
    import QrCode from "carbon-icons-svelte/lib/QrCode.svelte";
    import Scan from "carbon-icons-svelte/lib/Scan.svelte";

    import {
        Button,
        TextArea,
        Grid,
        Row,
        Column,
        TextInput,
        ToastNotification,
        SelectItem, Select, DataTable
    } from 'carbon-components-svelte';
    import { generateMnemonic } from 'bip39';
    import { payments } from 'bitcoinjs-lib';
    import * as ecc from 'tiny-secp256k1';
    import {
        scanOpen,
        qrCodeOpen,
        qrCodeData,
        network,
        electrumClient,
        scanData,
        currentAddressP2pkh,
        currentWif
    } from './store.js';
    import { generateKeys } from '$lib/generateKeys.js'
    import { decryptMnemonic } from '$lib/decryptMnemonic.js';
    import { DB_NAME, openDB, readData, addData, deleteData } from '$lib/indexedDBUtil.js';
    import AES from 'crypto-js/aes';
    import BIP32Factory from 'bip32';
    import * as mn from 'electrum-mnemonic';
    import { onDestroy, onMount } from 'svelte';
    import { getBalance } from '$lib/getBalance.js';
    const bip32 = BIP32Factory(ecc);

    let wallets = [];
    let mnemonic = '';
    let selectedMnemonic = localStorage.getItem('selectedMnemonic') || 0
    let password = 'mnemonic';
    let root;
    let xpriv = '';
    let xpub = '';

    let derivationPath = 'm/0/0/0';

    let derivationStandards = [
        {id:'electrum-legacy', name:'Electrum-Legacy', path:'m'},
        {id:'electrum-segwit', name:'Electrum-Segwit', path:'m/0'},
        {id:'bip32', name:'BIP32', path:'m/0/0/0'}
    ]
    let selectedDerivationStandard = localStorage.getItem("selectedDerivationStandard") || 0
    let addresses = [];

    function generateAddresses() {
        addresses = []
        /*
         * Electrum Mnemonic Tools https://www.npmjs.com/package/electrum-mnemonic
         * Electrum Legacy https://github.com/BlueWallet/BlueWallet/blob/6aa4c25cd1cb91a5f7576243e8d2f2d6a1cbce95/class/wallets/hd-legacy-electrum-seed-p2pkh-wallet.ts
         */
        if(selectedDerivationStandard==='electrum-legacy'){
            console.log("generating ",selectedDerivationStandard)
            const PREFIX = mn.PREFIXES.standard;
            if(!mn.validateMnemonic(mnemonic,  mn.PREFIXES.standard))
                throw new Error("Mnemonic invalid")

            const args = { prefix: PREFIX}; //,   passphrase: '', skipCheck: true
            if (password) args.password = password;
            root = bip32.fromSeed(mn.mnemonicToSeedSync(mnemonic, args));
            xpriv = root.toBase58();
            xpub = root.neutered().toBase58();

            const node = bip32.fromBase58(xpub);
            const internal = 0 // or 1 for internal adddresses (change addresses)

            for (let index = 0; index <= 10; index++) {
                const publicKey = node.derive(internal).derive(index).publicKey
                const privateKey = root.derive(internal).derive(index).privateKey

                const wif = root.derive(internal).derive(index).toWIF()
                const address = payments.p2pkh({
                    pubkey: node.derive(internal).derive(index).publicKey,
                    network: $network
                }).address;

                if(index===0){
                    $currentAddressP2pkh=address
                    $currentWif=wif
                }

                const addr = {
                    id: index,
                    index,
                    path:`m/${internal}/${index}`,
                    address: address,
                    balance: address,
                    publicKey:publicKey.toString('hex'),
                    privateKey:privateKey.toString('hex'),
                    wif }

                addresses = [...addresses, addr];
            }
        }

        if(selectedDerivationStandard==='electrum-segwit'){

            const derivationPath = "m/0'";
            const PREFIX = mn.PREFIXES.segwit;
            const args = { prefix: PREFIX};
            if (password) args.password = password;
            root = bip32.fromSeed(mn.mnemonicToSeedSync(mnemonic, args));
            xpriv = root.toBase58();
            xpub = root.derivePath(derivationPath).neutered().toBase58();

            const node = bip32.fromBase58(xpub);
            const internal = 0 // or 1 for internal adddresses (change addresses)

            for (let index = 0; index <= 10; index++) {
                const publicKey = node.derive(internal).derive(index).publicKey
                const privateKey = root.derive(internal).derive(index).privateKey

                const wif = root.derive(internal).derive(index).toWIF()
                const address = payments.p2wpkh({
                    pubKey: node.derive(internal).derive(index).publicKey,
                    network: $network
                }).address;

                if(index===0){
                    $currentAddressP2pkh=address
                    $currentWif=wif
                }

                const addr = {
                    id: index,
                    index,
                    path:`m/${internal}/${index}`,
                    address: address,
                    balance: address,
                    publicKey:publicKey.toString('hex'),
                    privateKey:privateKey.toString('hex'),
                    wif}
                addresses = [...addresses, addr];
            }
        }

        if(selectedDerivationStandard==='bip32'){
            const xpubNode = bip32.fromBase58(xpub);

            const internal = 0 // or 1 for internal addresses (change addresses)

            for (let index = 0; index <= 10; index++) {

                const pubkey = xpubNode.derive(0).derive(internal).derive(index).publicKey
                const privateKey = root.derive(0).derive(internal).derive(index).privateKey

                const wif = root.derive(internal).derive(index).toWIF()
                const address = payments.p2pkh({
                    pubkey: pubkey,
                    network: $network
                }).address;

                if(index===0){
                    $currentAddressP2pkh=address
                    $currentWif=wif
                }

                const addr = {
                    id: index,
                    index,
                    path:`m/0/${internal}/${index}`,
                    address: address,
                    balance: address,
                    publicKey:pubkey.toString('hex'),
                    privateKey:privateKey.toString('hex'),
                    wif }
                addresses = [...addresses, addr];
            }
        }
    }

    $: if (password) wallets = wallets //as password changes we need to rerender the wallets in order to decrypt the contents
    $: {
        if (mnemonic && password!==undefined){
            try {
                const keys = generateKeys(mnemonic,password,$network)
                xpriv = keys.xpriv
                xpub  = keys.xpub
                root = keys.root
            } catch(e){ console.error(e) }
        }
    }
    $: mnemonic=$scanData //scanner has new data set mnemonic!
    $: if ($network && derivationPath && selectedDerivationStandard && root && xpriv && xpub) { try { generateAddresses(addresses) } catch(e){ console.error(e) }}
    $: localStorage.setItem("selectedMnemonic",selectedMnemonic)
    $: localStorage.setItem("selectedDerivationStandard",selectedDerivationStandard || 0)
    
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
            if (!mnemonic) {
                toastNotification = "Mnemonic is empty.";
                throw new Error("Mnemonic is empty");
            }
            const encryptedMnemonic = AES.encrypt(mnemonic, password).toString();
            const data = {
                id: (wallets.length + 1),
                mnemonic: encryptedMnemonic,
                derivationStandard: selectedDerivationStandard,
                date: new Date()
            };
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
            toastNotification = "Mnemonics have been successfully loaded.";
            timeout = 3000;
        } catch (error) {
            toastNotification = "Failed to load mnemonics from db";
            timeout = 3000;
        }
    }

    async function deleteMnemonic() {
        const db = await openDB(DB_NAME, "wallets");
        const selectedWallet = wallets.find(w => w.id.toString() === selectedMnemonic);
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
    let _electrumClient
    let _network
    let unsubscribeEC
    let unsubscribeN

    onMount(async () => {
        unsubscribeEC = electrumClient.subscribe((value) => _electrumClient = value)
        unsubscribeN = network.subscribe((value) => _network = value)
        await loadMnemonic();
        mnemonic = decryptMnemonic(mnemonic,password) //auto decrypt on startup
        selectedMnemonic = localStorage.getItem('selectedMnemonic'); // Get the mnemonic ID directly
        try {
            const keys = generateKeys(mnemonic, password, $network)
            xpriv = keys.xpriv
            xpub  = keys.xpub
            root = keys.root
        } catch(e){ console.error(e) }
    });

    onDestroy(()=>{
        unsubscribeEC()
        unsubscribeN()
    })
</script>

<h1>Welcome to Doichain Developer Playground</h1>
<h2>Key and Address Generation</h2>

<Grid>
    <Row>
        <Column><h2>1. Generate mnemonic for a new wallet</h2></Column>
        <Column><TextInput labelText="Password" bind:value={password} />
            <Button size="small" on:click={ () => {
                       const selectedWallet = wallets.find(w => w.id.toString() === selectedMnemonic)
                       mnemonic = decryptMnemonic(selectedWallet.mnemonic,password)
            }}>Decrypt</Button></Column>
    </Row>
    <Row>
        <Column>&nbsp;</Column>
        <Column>
            <Select labelText="Select Wallet" bind:selected={ selectedMnemonic } on:change={(e) => {
                  selectedDerivationStandard = wallets.find((w) => w.id.toString() === e.target.value)?.derivationStandard

            }}>
                <SelectItem value="0" text="Choose a wallet" />
                {#each wallets as wallet}
                    <SelectItem value={wallet.id.toString()} text={`${decryptMnemonic(wallet.mnemonic,password)?.substring(0,20)}  ${wallet.date.toLocaleString()}`} />
                {/each}
            </Select>
            <TextArea labelText="Mnemonic" rows={2} bind:value={mnemonic} />
            <Button size="small"  on:click={async () => {
                mnemonic = generateMnemonic()
            }}>Generate Mnemonic</Button>
            <Button size="small" on:click={ storeMnemonic }>Save</Button>
            <Button size="small" on:click={ deleteMnemonic } class="delete-button">Delete</Button>
            <Button size="small" on:click={ () => {$qrCodeData=mnemonic;$qrCodeOpen=true}}><QrCode size={16}/></Button>
            <Button size="small" on:click={ () => {$scanOpen=true}}><Scan size={16}/></Button>
        </Column>
    </Row>
    <Row>
        <Column><h2>2. Get XPriv and XPub from mnemonic</h2></Column>
        <Column>&nbsp;</Column>
    </Row>
    <Row>
        <Column><h2>xpriv (HD node root key) (base58)</h2></Column>
        <Column><TextInput labelText="xpriv" bind:value={xpriv}/></Column>
    </Row>
    <Row>
        <Column><h2>xpub</h2></Column>
        <Column><TextInput labelText="xpub" bind:value={xpub} /></Column>
    </Row>
    <Row>
        <Column><h2>3. Derivation Standard</h2></Column>
        <Column>
            <Select labelText="Select Wallet" bind:selected={ selectedDerivationStandard }>
                <SelectItem value="0" text="Choose derivation standard" />
                {#each derivationStandards as ds}
                    <SelectItem value={ds.id} text={`${ds.name}`} />
                {/each}
            </Select>
        </Column>
    </Row>
</Grid>
<DataTable
  class="datatable"
  expandable
  headers={[
            { key: "index", value: "Index"},
            { key: "path", value: "Path" },
            { key: "address", value: "Address" },
            { key: "balance", value: "Balance" },
            // { key: "publicKey", value: "Public Key" },
            // { key: "privateKey", value: "Private Key" },
            // { key: "wif", value: "WIF" },
        ]}
  rows={addresses}
>

<svelte:fragment slot="expanded-row" let:row>
    <pre>{JSON.stringify(row, null, 2)}</pre>
</svelte:fragment>

<svelte:fragment slot="cell" let:row let:cell>
    {#if cell.key === "balance"}
        {#await getBalance(cell.value, _electrumClient, _network)}
            <p>...waiting</p>
        {:then number}
            <p>{number.confirmed}/{number.unconfirmed}</p>
        {:catch error}
            <p style="color: red">{error.message}</p>
        {/await}
    {:else}
        {cell.value || ''}
    {/if}
</svelte:fragment>

</DataTable>

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

