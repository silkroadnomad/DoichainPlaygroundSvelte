<script>
	/**
	 * https://github.com/webanizer/BlockPro/blob/main/src/doichain/createMultiSig.js
	 *
	 * 1. normale Wallet ohne MultiSig gesamter Betrag
	 * 2. normale Wallet it Tagesgeschäft
	 * 3. 1 MultiSig (existiert)
	 *
	 * 1. Gehe nach Hause und schau ob die DoiWallet checken.
	 * 2. Javascript zur Erstellung einer MultiSig Transaktion basierend auf gegeben Standard-Paramter mit Hilfe von Lena
	 *  - hex rauspurzeln.
	 *  - per Telegram an jemand schicken
	 *  - gibt den hex in die gleiche Webseite ein und signiert mit dem PrivateKey
	 *  3. Frage ob monatliche Beträge und Adressaten und Halving sozusagen per Knopfdruck eine Transaktion erstellt werden kann.
	 */
	import "carbon-components-svelte/css/all.css";
	import { Theme, TextInput, Button } from 'carbon-components-svelte';
	/* import *  from "doichainjs-lib" */
	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"
	// $: window.document.documentElement.setAttribute("theme", theme);
</script>
<Theme bind:theme persist persistKey="__carbon-theme" />
<h1>Welcome to Doichain MultiSig</h1>
<p>Little helper for Doichain MultiSig Transactions</p>
<TextInput labelText="User name" placeholder="Enter Doichain Address..." />
<Button>Get Balance</Button>
