import adapter from '@sveltejs/adapter-static'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'public',
			assets: 'public',
			fallback: 'offline.html',
			precompress: true,
			strict: false
		}),
	},
};

export default config;