const file = '{file}'

document.getElementById('file').innerText = file.split('.').slice(1).join('.')
console.log(file.split('.').slice(1), file.split('.'));

document.getElementById('button').onclick = async () => {
    window.open('/{file}/download', '_self')
}