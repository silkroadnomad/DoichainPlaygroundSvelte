<script>
	import { electrumServerVersion, electrumServerBanner, electrumBlockchainBlockHeaders } from './store.js';
</script>

<h2>Transactions</h2>
<h3>Electrum Server Version {$electrumServerVersion || 'not connected'}</h3>
<h3>Electrum Server Banner  {$electrumServerBanner  || 'not connected'}</h3>
{$electrumBlockchainBlockHeaders}