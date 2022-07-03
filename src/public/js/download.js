const file = '{file}'

document.getElementById('file').innerText = file.split('.').slice(1).join('.')

document.getElementById('button-download').onclick = async () => {
    window.open('/{file}/download', '_self')
}

document.getElementById('button-preview').onclick = async () => {
    window.open('preview/{file}', '_self')
}