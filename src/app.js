require('dotenv').config()
const express = require('express')
const multer = require('multer')
const path = require('path')
const cors = require('cors')
const fs = require('fs')
const app = express()

const url = process.env.URL

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, `${req.query.uuid}.${file.originalname}`);
    }
})

const upload = multer({ storage });
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(cors({
    origin: [url]
}));

function get_account ({ pw, name }) {
    delete require.cache[require.resolve(`./data/db.json`)]
    const db = require('./data/db.json')
    let account;
    if (name) {
        db.accounts.forEach((_account) => {
            if (_account.name === name) { account = _account }
        })
    } else {
        db.accounts.forEach((_account) => {
            if (_account.password === pw) { account = _account }
        })
    }
    return { db, account }
}

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

function build_page (name, file) {
    let html = fs.readFileSync(`${__dirname}/public/html/${name}.html`, 'utf-8').replaceAll('{url}', url)
    let css = fs.readFileSync(`${__dirname}/public/css/${name}.css`, 'utf-8')
    let js = fs.readFileSync(`${__dirname}/public/js/${name}.js`, 'utf-8').replaceAll('{url}', url)
    let loginManager = fs.readFileSync(`${__dirname}/public/js/loginManager.js`, 'utf-8')
    
    if (file) {
        html = html.replaceAll('{file}', file)
        css = css.replaceAll('{file}', file)
        js = js.replaceAll('{file}', file)
    }

    html = html.replace('{css}', `<style>${css}</style>`).replace('{js}', `<script>${js}</script>`).replace('{loginManager}', `<script>${loginManager}</script>`)
    return html;
}

app.get('/', async (req, res) => {
    return res.send(build_page('index'))
})

app.get('/upload', async (req, res) => {
    return res.send(build_page('upload'))
})

app.post('/api/check_pw', async (req, res) => {
    const { pw, master } = req.body
    if (!pw) { return res.sendStatus(500) }
    const { account } = get_account({ pw })
    if (master && pw == process.env.MASTER_PASSWORD) { return res.sendStatus(200) }
    if (!account) { return res.sendStatus(401) }
    else { return res.sendStatus(200) }
})

app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { file } = req
    const { pw } = req.query
    if (!file || !pw) { return res.sendStatus(500) }
    const { account, db } = get_account({ pw })
    console.log(account, pw)
    if (!account || !db) { return res.sendStatus(401) }
    account.files.push({ name: file.originalname, uuid: req.query.uuid, size: file.size, downloads: 0 })
    fs.writeFileSync('src/data/db.json', JSON.stringify(db, null, 4), err => { err ? console.log(err) : {} })
    res.sendStatus(200)
    return console.log(`${account.name} uploaded "${file.filename}" (${file.size}).`)
});

app.get('/:file', async (req, res) => {
    const { file } = req.params
    if (fs.existsSync(`${__dirname}/uploads/${file}`)) {
        return res.send(build_page('download', file))
    } else {
        return res.send(build_page('no_file', file))
    }
})

app.get('/:file/download', async (req, res) => {
    let { file } = req.params
    if (fs.existsSync(`${__dirname}/uploads/${file}`)) {
        res.download(`${__dirname}/uploads/${file}`)
        delete require.cache[require.resolve(`./data/db.json`)]
        const db = require('./data/db.json')
        db.accounts.forEach((account) => {
            account.files.forEach((_file) => {
                if (_file.uuid == file.uuid) { file = _file }
            })
        })
        file.downloads += 1;
        fs.writeFileSync('src/data/db.json', JSON.stringify(db, null, 4), err => { err ? console.log(err) : {} })
         return console.log(`Someone downloaded "${file.name}" (${get_size(file.size)}).`)
    } else {
        return res.send(build_page('no_file', file))
    }
})

app.post('/api/files', async (req, res) => {
    const { pw } = req.body
    const { db, account } = get_account({ pw })
    if (!account && pw !== process.env.MASTER_PASSWORD) { return res.sendStatus(500) }
    let list = '';
    if (pw == process.env.MASTER_PASSWORD) {
        list += '<h1 class="--title">All Files</h1>'
        db.accounts.forEach((_account) => {
            list += `<h2 class="--account">${_account.name} ${_account.files.length > 0 ? `(${_account.files.length} File${_account.files.length > 1 ? 's' : ''})` : ''}</h2>`
            _account.files.forEach((file) => {
                list += `
                <div class="--file Roboto">
                <br>
                <h4 class="--filename">${file.name} (${get_size(file.size)})
                <button class="--copy" id="copy-${file.uuid}" onclick="copy('${file.name}', '${file.uuid}')">Copy Link</button>
                <button class="--download" onclick="window.open('/${file.uuid}.${file.name}/download', '_self')">Download</button>
                <button class="--delete" onclick="delete_file('${file.name}', '${file.uuid}', '${_account.name}', '${pw}')">Delete</button>
                </h4>
                </div>
                `
            })
            if (_account.files.length < 1) {
                list += `<h2 class="--error Roboto">${_account.name} currently <ins class="--error-ins">doesn't</ins> have any files saved.</h1>`
            }
        })
    } else {
        list += '<h1 class="--title">Your Files</h1>'
        account.files.forEach((file) => {
            list += `
            <div class="--file Roboto">
            <br>
            <h4 class="--filename">${file.name} (${get_size(file.size)})
            <button class="--copy" id="copy-${file.uuid}" onclick="copy('${file.name}', '${file.uuid}')">Copy Link</button>
            <button class="--download" onclick="window.open('/${file.uuid}.${file.name}/download', '_self')">Download</button>
            <button class="--delete" onclick="delete_file('${file.name}', '${file.uuid}', '${account.name}', '${pw}')">Delete</button>
            </h4>
            </div>
            `
        })
        if (account.files.length < 1) {
            list += `<h2 class="--error Roboto">You currently <ins class="--error-ins">don't</ins> have any files saved.</h1>`
        }
    }
    list += `
    <button class="--reload" id="reload" onclick="get_files()">Reload</button>
    <button class="--upload-link" id="upload" onclick="upload()">Upload</button>
    `
    res.json({ list: list })
})

app.post('/api/delete/:file', async (req, res) => {
    let { file } = req.params
    const { name } = req.body
    const { db, account } = get_account({ name })
    if (!account) { return res.sendStatus(500) }
    account.files.forEach((_file) => { if (_file.uuid == file.toString().split('.')[0]) { file = _file } })
    if (account.files.includes(file)) {
        await fs.unlinkSync(`${__dirname}/uploads/${file.uuid}.${file.name}`)
        if (!fs.existsSync(`${__dirname}/uploads/${file.uuid}.${file.name}`)) {
            account.files.splice(account.files.indexOf(file, 1) - 1, 1)
            fs.writeFileSync('src/data/db.json', JSON.stringify(db, null, 4), err => { err ? console.log(err) : {} })
            console.log(`${account.name} deleted "${file.name}" (${get_size(file.size)}).`)
            return res.sendStatus(200)
        } else {
            return res.sendStatus(403)
        }
    } else {
        return res.sendStatus(500)
    }
})

app.get('/*', (req, res) => {
    res.redirect('/')
})

app.listen(process.env.PORT, () => {
    console.log(`Now listening to ${url} on port ${process.env.PORT}`)
})