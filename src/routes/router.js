import { readable } from 'svelte/store'
import { browser } from '$app/environment';

function getHash () {
    if(browser){
        const hash = location.hash.replace(/^#/, '')
        if(hash.length<2) return ""
        return hash.indexOf('/',1)!==-1?hash.substring(0,hash.indexOf('/',1)):hash
    }
}

export const hash = new readable(getHash(), set => {
    function setHash () {
        set(getHash())
    }

    window.addEventListener('hashchange', setHash)
    return () => window.removeEventListener('hashchange', setHash)
})

function getPath () {
    if(browser){
        const hash = location.hash.replace(/^#/, '')
        if(hash.length<2) return ""
        return hash;
    }
}

export const path = new readable(getPath(), set => {
    function setHash () {
        set(getHash())
    }

    window.addEventListener('hashchange', setHash)
    return () => window.removeEventListener('hashchange', setHash)
})


