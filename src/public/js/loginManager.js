const API = 'https://login.timlohrer.de'

async function login() {
    const params = new URLSearchParams(document.location.search.substring(1));
    const session = params.get('session')
    if (!session) { return; }
    const __SESSION__ = `${session.split('‎')[0]}‎${session.split('‎')[1]}`
    const res = await fetch(`${API}/api/check-session`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: session.split('‎')[0], session: session.split('‎')[1] })
    })
    console.log(res);
    if (res.ok == true) {
        if (__REDIRECT__ && __REDIRECT__ != '' && allowed[0] != '*' && !allowed.includes(__REDIRECT__.split('/')[0])) {
            alert('You are not allowed to access this page!')
            return window.open(`https://login.timlohrer.de/?redirect=${document.location}`, '_self')
        }
        const allowed = await res.json()
        const now = new Date()
        const time = now.getTime()
        const expire = time + 365 * 24 * 60 * 60 * 1000
        now.setTime(expire)
        if (email && session) {
            document.cookie = `timlohrer_session=${__SESSION__};expires=${now.toUTCString()};path=/`
            window.open('/', '_self')
        }
        const cookies = document.cookie
        for (let cookie of cookies.split('; ')) {
            if (cookie.split('=')[0] == 'timlohrer_session') {
                // const email = cookie.split('=')[1].split('‎')[0]
                // const session = cookie.split('=')[1].split('‎')[1]
                return true
            }
        }
    } else {
        document.cookie = `timlohrer_session=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
        alert('Something went wrong, please login again!')
        return window.open(`https://login.timlohrer.de/?redirect=${document.location}`, '_self')
    }
}