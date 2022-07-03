const API = 'https://login.timlohrer.de'
let __PASSWORD__ = ''

function getCookie (key = String) {
    const cookies = document.cookie.split('; ')
    let cookie
    cookies.forEach(_cookie => {
        if (_cookie.split('=')[0] == key) {
            cookie = _cookie.split('=')[1]
        }
    })
    if (cookie) { return cookie }
    else { return null }
}

window.onload = async () => {
    const params = new URLSearchParams(document.location.search.substring(1));
    let session = params.get('session')?.split('|') || getCookie('timlohrer_session')?.split('‎') || null
    if (params.get('session')) {
        window.history.replaceState({}, document.title, document.location.origin + '/')
    }
    if (!session) { return window.open(`https://login.timlohrer.de/?redirect=${document.location}`, '_self') }
    const __SESSION__ = `${session[0]}‎${session[1]}‎${session[2] || 24 * 60 * 60 * 1000}`
    const res = await fetch(`${API}/api/check-session?scopes=api_key.share`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: session[0], session: session[1] })
    })
    if (res.ok == true) {
        let { scopes } = await res.json()
        const now = new Date()
        const time = now.getTime()
        const expire = time + parseInt(session[2]) || 24 * 60 * 60 * 1000
        now.setTime(expire)
        if (__SESSION__) {
            document.cookie = `timlohrer_session=${__SESSION__};expires=${now.toUTCString()};path=/`
        }
        if (scopes) { __PASSWORD__ = scopes.api_key }
        if ((new URL(document.location)).searchParams.get('files') != null) {
            window.history.replaceState({}, document.title, document.location.origin)
            get_files();
        }
    } else {
        document.cookie = `timlohrer_session=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
        alert('Something went wrong, please login again!')
        return window.open(`https://login.timlohrer.de/?redirect=${document.location}`, '_self')
    }
    setInterval(() => {
        if (!getCookie('timlohrer_session')) {
            alert('Something went wrong, please login again!')
            return window.open(`https://login.timlohrer.de/?redirect=${document.location}`, '_self')
        }
    }, 100)
}
