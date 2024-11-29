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
        SelectItem, Select, DataTable, Checkbox,
        Toolbar,
        ToolbarBatchActions,
        ToolbarContent,
        ToolbarSearch,
        Pagination
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
        currentAddress,
        currentWif
    } from './store.js';

    import bs58check from 'bs58check';
    import { generateKeys } from '$lib/generateKeys.js'
    import { decryptMnemonic } from '$lib/decryptMnemonic.js';
    import { DB_NAME, openDB, readData, addData, deleteData } from '$lib/indexedDBUtil.js';
    import AES from 'crypto-js/aes';
    import BIP32Factory from 'bip32';
    import * as mn from 'electrum-mnemonic';
    import { onDestroy, onMount } from 'svelte';
    import { getBalance } from '$lib/getBalance.js';
	import { DOICHAIN } from "$lib/doichain.js";
    const bip32 = BIP32Factory(ecc);

    let wallets = [];
    let mnemonic = '';
    let selectedMnemonic = localStorage.getItem('selectedMnemonic') || 0;
    let password = 'mnemonic';
    let root;
    let xpriv = '';
    let xpub = '';
    let zpub = '';
    let numberOfAddresses = 20;
    let pageSize = 20;

    let derivationPath = 'm/0/0/0';

    let derivationStandards = [
        {id:'electrum-legacy', name:'Electrum-Legacy', path:'m'},
        {id:'electrum-segwit', name:'Electrum-Segwit', path:'m/0'},
        {id:'bip32', name:'BIP32', path:'m/0/0/0'},
        {id:'bip32-p2wpkh', name:'BIP32-P2WPKH', path:'m/0/0/0'},
        {id:'bip84', name:'BIP84', path:'m/84/0/0/0'}
    ]

    function getZpub(node, network = DOICHAIN) {
        
        let data = '';

        try {
            data = node.neutered().toBase58();
            console.log("Neutered node data:", data);
        } catch (error) {
            console.error("Error neutering node:", error);
            try {
                data = node.toBase58(); // Attempt without neutering
                console.log("Non-neutered node data:", data);
            } catch (innerError) {
                console.error("Error with non-neutered node:", innerError);
            }
        }
        let decoded = bs58check.decode(data);
        // Version bytes for zpub (mainnet)
        // Use 0x045f6ef for testnet (vpub)
        const versionBytes = network.name === DOICHAIN.name ? 
            Buffer.from('04b24746', 'hex') : // zpub for mainnet
            Buffer.from('045f6ef7', 'hex');   // vpub for testnet
        decoded = Buffer.concat([versionBytes, decoded.slice(4)]);
        
        return bs58check.encode(decoded);
    }

    let selectedDerivationStandard = localStorage.getItem("selectedDerivationStandard") || 0
    let addresses = [];
    let includeChangeAddresses = false;

    function generateAddresses() {
        addresses = [];
        const paths = includeChangeAddresses ? [0, 1] : [0]; // 0 for receiving, 1 for change
        
        if (selectedDerivationStandard === 'electrum-legacy') {
            paths.forEach(internal => {
                if(!mn.validateMnemonic(mnemonic, mn.PREFIXES.standard))
                    throw new Error("Mnemonic invalid")

                const args = { prefix: mn.PREFIXES.standard};
                if (password) args.password = password;
                root = bip32.fromSeed(mn.mnemonicToSeedSync(mnemonic, args));
                xpriv = root.toBase58();
                xpub = root.neutered().toBase58();
                zpub = getZpub(root, $network);
                const node = bip32.fromBase58(xpub);

                for (let index = 0; index < numberOfAddresses; index++) {
                    const publicKey = node.derive(internal).derive(index).publicKey
                    const privateKey = root.derive(internal).derive(index).privateKey

                    const wif = root.derive(internal).derive(index).toWIF()
                    const address = payments.p2pkh({
                        pubkey: node.derive(internal).derive(index).publicKey,
                        network: $network
                    }).address;

                    if(index===0){
                        $currentAddress=address
                        $currentWif=wif
                    }

                    const addr = {
                        id: `${internal}_${index}`,
                        index,
                        path: `m/${internal}/${index}`,
                        type: internal === 0 ? 'receiving' : 'change',
                        address: address,
                        balance: address,
                        publicKey: publicKey.toString('hex'),
                        privateKey:privateKey.toString('hex'),
                        wif }

                    addresses = [...addresses, addr];
                }
            });
        }

        if (selectedDerivationStandard === 'electrum-segwit') {
            const derivationPath = "m/0'";
            paths.forEach(internal => {
                if(!mn.validateMnemonic(mnemonic, mn.PREFIXES.segwit)) {
                    throw new Error("Invalid Segwit mnemonic")
                }

                const PREFIX = mn.PREFIXES.segwit;
                const args = { prefix: PREFIX };
                if (password) args.password = password;
                root = bip32.fromSeed(mn.mnemonicToSeedSync(mnemonic, args));
                xpriv = root.toBase58();
                xpub = root.derivePath(derivationPath).neutered().toBase58();
                zpub = getZpub(root.derivePath(derivationPath), $network);

                const node = bip32.fromBase58(xpub);

                for (let index = 0; index < numberOfAddresses; index++) {
                    const publicKey = node.derive(internal).derive(index).publicKey
                    const privateKey = root.derive(internal).derive(index).privateKey

                    const wif = root.derive(internal).derive(index).toWIF()
                    const address = payments.p2wpkh({
                        pubkey: publicKey,
                        network: $network
                    }).address;

                    if(index===0){
                        $currentAddress=address
                        $currentWif=wif
                    }

                    const addr = {
                        id: `${internal}_${index}`,
                        index,
                        path: `m/0'/${internal}/${index}`,
                        address: address,
                        balance: address,
                        publicKey:publicKey.toString('hex'),
                        privateKey:privateKey.toString('hex'),
                        wif}
                    addresses = [...addresses, addr];
                }
            });
        }

        if (selectedDerivationStandard === 'bip32') {
            paths.forEach(internal => {
                const xpubNode = bip32.fromBase58(xpub);
                zpub = getZpub(xpubNode, $network);

                for (let index = 0; index < numberOfAddresses; index++) {
                    const pubkey = xpubNode.derive(0).derive(internal).derive(index).publicKey
                    const privateKey = root.derive(0).derive(internal).derive(index).privateKey

                    const wif = root.derive(internal).derive(index).toWIF()
                    const address = payments.p2pkh({
                        pubkey: pubkey,
                        network: $network
                    }).address;

                    if(index===0){
                        $currentAddress=address
                        $currentWif=wif
                    }

                    const addr = {
                        id: `${internal}_${index}`,
                        index,
                        path: `m/0/${internal}/${index}`,
                        address: address,
                        balance: address,
                        publicKey:pubkey.toString('hex'),
                        privateKey:privateKey.toString('hex'),
                        wif }
                    addresses = [...addresses, addr];
                }
            });
        }

        if (selectedDerivationStandard === 'bip32-p2wpkh') {
            paths.forEach(internal => {
                const xpubNode = bip32.fromBase58(xpub);
                zpub = getZpub(xpubNode, $network);
                
                for (let index = 0; index < numberOfAddresses; index++) {
                    const path = `m/84'/0'/0'/${internal}/${index}`;
                    const pubkey = root.derivePath(path).publicKey;
                    const privateKey = root.derivePath(path).privateKey;
                    const wif = root.derivePath(path).toWIF();
                    
                    const { address } = payments.p2wpkh({
                        pubkey: pubkey,
                        network: $network
                    });

                    if (index === 0) {
                        $currentAddress = address;
                        $currentWif = wif;
                    }

                    const addr = {
                        id: `${internal}_${index}`,
                        index,
                        path: path,
                        address: address,
                        balance: address,
                        publicKey: pubkey.toString('hex'),
                        privateKey: privateKey.toString('hex'),
                        wif
                    };
                    addresses = [...addresses, addr];
                }
            });
        }

        if (selectedDerivationStandard === 'bip84') {
            paths.forEach(internal => {
                const xpubNode = bip32.fromBase58(xpub);
                zpub = getZpub(xpubNode, $network);

                for (let index = 0; index < numberOfAddresses; index++) {
                    const pubkey = xpubNode.derive(0).derive(internal).derive(index).publicKey
                    const privateKey = root.derive(0).derive(internal).derive(index).privateKey
                    const wif = root.derive(internal).derive(index).toWIF()
                    const { address } = payments.p2wpkh({ pubkey: pubkey, network: $network })
                    if(index===0){
                        $currentAddress=address
                        $currentWif=wif
                    }

                    const addr = {
                        id: `${internal}_${index}`,
                        index,
                        path: `m/84/0/${internal}/${index}`,
                        address: address,
                        balance: address,
                        publicKey:pubkey.toString('hex'),
                        privateKey:privateKey.toString('hex'),
                        wif }
                    addresses = [...addresses, addr];
                }
            });
        }
    }

    $: {
        if (mnemonic) {
            try {
                const keys = generateKeys(mnemonic, password, $network)
                xpriv = keys.xpriv
                xpub = keys.xpub
                root = keys.root
                generateAddresses()
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

    let filteredRowIds = [];
    let selectedRowIds = [];
    let batchSelection = true;
    let active = true;
    let page = 1;
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
            <Select labelText="Select Wallet" bind:selected={ selectedMnemonic } on:change={ 
            (e) => { selectedDerivationStandard = wallets.find((w) => w.id.toString() === e.target.value)?.derivationStandard}
            }>
            <SelectItem value="0" text="Choose a wallet" />
                {#each wallets as wallet}
                    <SelectItem value={wallet.id.toString()} text={`${decryptMnemonic(wallet.mnemonic,password)?.substring(0,20)}  ${wallet.date.toLocaleString()}`} />
                {/each}
            </Select>
            <TextArea labelText="Mnemonic" rows={2} bind:value={mnemonic} />
            <Button size="small"  on:click={async () => {
               console.log("generating mnemonic ",selectedDerivationStandard)
                if(selectedDerivationStandard === 'bip32'){
                      mnemonic = generateMnemonic()
                }
                else {
                    const PREFIX = (selectedDerivationStandard.indexOf('legacy')!==-1)?mn.PREFIXES.standard:mn.PREFIXES.segwit;
                    mnemonic = mn.generateMnemonic({ prefix: PREFIX })
                }
                console.log("new mnemonic",mnemonic)
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
        <Column><h2>zpub</h2></Column>
        <Column><TextInput labelText="zpub" bind:value={zpub} /></Column>
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
<Grid>
    <Row>
        <Column>
            <TextInput 
                type="number" 
                labelText="Number of Addresses" 
                min="1" 
                max="100"
                bind:value={numberOfAddresses}
            />
        </Column>
        <Column>
            <Checkbox 
                labelText="Include Change Addresses" 
                bind:checked={includeChangeAddresses} 
                on:change={() => generateAddresses()}
            />
        </Column>
    </Row>
</Grid>

<DataTable
  sortable
  expandable
  class="datatable"
  bind:batchSelection
  bind:selectedRowIds
  shouldFilterRows
  {pageSize}
  {page}
  bind:filteredRowIds
  headers={[
    { key: "index", value: "Index" },
    { key: "path", value: "Path" },
    { key: "address", value: "Address" },
    { key: "balance", value: "Balance (DOI)" }
  ]}
  rows={addresses}
>
    <svelte:fragment slot="expanded-row" let:row>
        <pre>{JSON.stringify(row, null, 2)}</pre>
    </svelte:fragment>

    <svelte:fragment slot="cell" let:row let:cell>
        {#if cell.key === "balance"}
            {#await getBalance(row.address, _electrumClient, _network)}
                <span>loading...</span>
            {:then balance}
                {#if balance}
                    <div style="text-align: right;">
                        {(balance.confirmed / 100000000).toFixed(8)}/{(balance.unconfirmed / 100000000).toFixed(8)}
                    </div>
                {:else}
                    <div style="text-align: right;">0.00000000/0.00000000</div>
                {/if}
            {:catch error}
                <span style="color: red">error</span>
            {/await}
        {:else if cell.key === "index"}
            <div style="text-align: right;">{cell.value}</div>
        {:else}
            {cell.value || ''}
        {/if}
    </svelte:fragment>

    <Toolbar>
        <ToolbarBatchActions
            active={selectedRowIds.length > 0}
            on:cancel={(e) => {
                e.preventDefault();
                selectedRowIds = [];
                active = false;
            }}
        >
            <!-- Add your batch actions here if needed -->
        </ToolbarBatchActions>
        <ToolbarContent>
            <ToolbarSearch
                persistent
                shouldFilterRows
                bind:filteredRowIds
            />
        </ToolbarContent>
    </Toolbar>
</DataTable>

<Pagination
    bind:pageSize
    bind:page
    totalItems={filteredRowIds.length}
    pageSizes={[10, 25, 50, 100, 200]}
/>

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

