<script>
	import "carbon-components-svelte/css/all.css";
	import { Theme, Button } from 'carbon-components-svelte';
	import { generateMnemonic } from 'bip39'

	// import { generateMnemonic }  from "doichainjs-lib"
	let theme = "g90";// "white" | "g10" | "g80" | "g90" | "g100"
	let mnemonic = ''
</script>
<Theme bind:theme persist persistKey="__carbon-theme" />

<h1>Welcome to Doichain Playground</h1>
<h2>1. Create a Mnemonic</h2>

<Button class="button" on:click={ async () => {
	mnemonic = generateMnemonic()
}}>Create Mnemonic</Button>

Mnemonic:{mnemonic}


<h2>2. Get Balance of the address</h2>
<Button class="button">Get Balance</Button>
<p>Little helper for Doichain MultiSig Transactions</p>
<!--<TextInput labelText="User name" placeholder="Enter Doichain Address..." />-->
<!--<Button>Get Balance</Button>-->
<style>
    h1,h2 {
        margin-left: 20px;
        margin-top: 20px;
    }
	:global(.button) {
        margin-left: 20px;
        margin-top: 20px;
    }
</style>