function files() {
    window.open('/', '_self')
}

const title = document.getElementById('title')
const upload = document.getElementById('upload')
const input = document.getElementById('file-input')
const upload_button = document.getElementById('upload-button')
const uploaded = document.getElementById('uploaded')
const link = document.getElementById('link-text')
const copy = document.getElementById('copy-button')

function get_size (_size) {
    let size;
    if (Math.floor(_size / 1024 / 1024 / 1024) == 0) {
        if (Math.floor(_size / 1024 / 1024) == 0) {
            if (Math.floor(_size / 1024) == 0) {
                size = `${_size} byte${_size > 1 ? 's': ''}`
            } else {
                size = `${Math.floor(_size / 1024)} KB`
            }
        } else {
            size = `${Math.floor(_size / 1024 / 1024)} MB`
        }
    } else {
        size = `${Math.floor(_size / 1024 / 1024 / 1024)} GB`
    }
    return size
}

setInterval(() => {
    const { files } = input
    if (!files[0]) {
        upload_button.style.opacity = '60%'
        upload_button.style.cursor = 'normal'
        upload_button.innerHTML = 'Upload File'
        upload_button.onclick = () => {}
    } else {
        upload_button.style.opacity = '100%'
        upload_button.style.cursor = 'pointer'
        upload_button.innerHTML = `Upload<br>${files[0].name} (${get_size(files[0].size)})`
        upload_button.onclick = async () => {
            const pw = prompt('Please enter your password:')
            if (!pw) { return alert('Incorrect password!') }
            const _res = await fetch(`{url}/api/check_pw`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pw: pw })
            }).catch(err => alert(err))

            if (_res.status !== 200) {
                if (_res.status == 401) {
                    return alert(`Incorrect password.`)
                } else {
                    return alert(`Failed to verify password.`)
                }
            }

            const formData = new FormData()
            formData.append('file', files[0])

            const res = await fetch(`{url}/api/upload/${pw}`, {
                method: 'POST',
                body: formData
            }).catch(err => alert(err, 'g'))

            if (res.status !== 200) {
                if (res.status == 403) {
                    return alert(`The file "${files[0].name}" already exists.`)
                } else {
                    return alert(`Something went wrong while uploading "${files[0].name}".`)
                }
            }
            
            title.innerHTML = `Done uploading ${files[0].name} (${get_size(files[0].size)})`
            link.innerHTML = `{url}/${files[0].name}`
            uploaded.hidden = false
            upload.hidden = true
        }
        copy.onclick = async () => {
            const temp = document.createElement('textarea');
            document.body.appendChild(temp);
            temp.value = `{url}/${files[0].name}`
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
    }
}, 100)