import { readable } from 'svelte/store'
import { browser } from '$app/environment';

function getHash () {
    if(browser){
        const hashWithDID = location.hash.replace(/^#/, '')
        if(hashWithDID.length<2) return ""
        return hashWithDID.indexOf('/',1)!==-1?hashWithDID.substring(0,hashWithDID.indexOf('/',1)):hashWithDID
    }
}

export const hash = new readable(getHash(), set => {
    function setHash () {
        set(getHash())
    }

    window.addEventListener('hashchange', setHash)
    return () => window.removeEventListener('hashchange', setHash)
})


