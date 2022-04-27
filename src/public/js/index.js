async function login () {
    const pw = prompt('Please enter your password:')
    if (!pw) { return; }
    const res = await fetch('{url}/api/check_pw', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pw: pw, master: true })
    })

    if (res.status !== 200) {
        if (res.status == 401) {
            return alert(`Incorrect password.`)
        } else {
            return alert(`Failed to verify password.`)
        }
    }
    get_files(pw)
}
function upload () {
    return window.open('/upload', '_self')
}
async function get_files (pw) {
    const reload = document.getElementById('reload')
    if (reload) {
        reload.style.opacity = '60%'
        reload.style.cursor = 'nor-allowed'
    }
    const res = await fetch('{url}/api/files', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pw: pw })
    })

    if (res.status !== 200) {
        return alert(`Something went wrong while fetching the files from our API.`)
    }
    document.body.innerHTML = (await res.json()).list
}
async function delete_file (file, name, pw) {
    const res = await fetch(`{url}/api/delete/${file}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name })
    })

    if (res.status !== 200) {
        if (res.status == 401) {
            alert(`The file "${file}" could not be deleted. Please contact Aim_shock for help.`)
        } else {
            alert(`Something went wrong while trying to delete "${file}". Please contact Aim_shock for help.`)
        }
    }
    get_files(pw)
}
function copy (file) {
    const copy = document.getElementById(`copy-${file}`)
    const temp = document.createElement('textarea');
    document.body.appendChild(temp);
    temp.value = `{url}/${file}`
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp)

    copy.innerHTML = 'Copied!'
    copy.style.cursor = 'normal'
    copy.style.opacity = '60%'
    setTimeout(() => {
        copy.innerHTML = 'Copy Link'
        copy.style.cursor = 'pointer'
        copy.style.opacity = '100%'
    }, 1000)
}