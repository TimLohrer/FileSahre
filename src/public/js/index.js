function upload () {
    return window.open('/upload', '_self')
}

async function get_files () {
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
        body: JSON.stringify({ pw: __PASSWORD__ })
    })

    if (res.status !== 200) {
        return alert(`Something went wrong while fetching the files from our API.`)
    }
    document.body.innerHTML = (await res.json()).list
}

async function delete_file (file, uuid, name) {
    const res = await fetch(`{url}/api/delete/${uuid}.${file}`, {
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
    get_files(__PASSWORD__)
}

function copy (file, uuid) {
    const copy = document.getElementById(`copy-${uuid}`)
    const temp = document.createElement('textarea');
    document.body.appendChild(temp);
    temp.value = `{url}/${uuid}.${file}`
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