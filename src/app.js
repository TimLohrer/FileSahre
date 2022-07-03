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
        if (file.originalname.endsWith('.apk')) {
            cb(null, 'src/uploads/static')
        } else {
            cb(null, 'src/uploads')
        }
    },
    filename: (req, file, cb) => {
        if (file.originalname.endsWith('.apk')) {
            cb(null, file.originalname.replaceAll(' ', '_'))
        }
        else {
            cb(null, `${req.query.uuid}.${file.originalname.replaceAll(' ', '_')}`);
        }
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

app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { file } = req
    const { pw } = req.query
    if (!file || !pw) { return res.sendStatus(500) }
    const { account, db } = get_account({ pw })
    if (!account || !db) { return res.sendStatus(401) }
    account.files.push({ name: file.originalname, uuid: req.query.uuid, size: file.size, downloads: 0 })
    fs.writeFileSync('src/data/db.json', JSON.stringify(db, null, 4), err => { err ? console.log(err) : {} })
    res.sendStatus(200)
    return console.log(`${account.name} uploaded "${file.filename}" (${file.size}).`)
});

app.post('/api/static/pulsatrix/upload', upload.single('file'), async (req, res) => {
    const { file } = req
    const { pw } = req.query
    if (!file || !pw) { return res.sendStatus(500) }
    if (pw != process.env.PULSATRIX) { return res.sendStatus(401) }
    res.sendStatus(200)
    return console.log(`PULSATRIX uploaded "${file.filename}" (${file.size}).`)
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
        res.download(`${__dirname}/uploads/${file}`, file.split('.').slice(1).join('.'))
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

app.get('/preview/:file', async (req, res) => {
    let { file } = req.params
    if (fs.existsSync(`${__dirname}/uploads/${file}`)) {
        return res.sendFile(`${__dirname}/uploads/${file}`)
    } else {
        return res.send(build_page('no_file', file))
    }
})

app.get('/:file/static/download', async (req, res) => {
    let { file } = req.params
    if (fs.existsSync(`${__dirname}/uploads/static/${file}`)) {
        res.download(`${__dirname}/uploads/static/${file}`)
         return console.log(`Someone downloaded "${file}".`)
    } else {
        return res.send(`Could not find "${file}"`)
    }
})

app.post('/api/files', async (req, res) => {
    const { pw } = req.body
    const { account } = get_account({ pw })
    let list = '';
    list += '<h1 class="--title">Your Files</h1>'
    account.files.forEach((file) => {
        list += `
        <div class="--file Roboto">
        <br>
        <h4 class="--filename">${file.name} (${get_size(file.size)})
        <button class="--copy" id="copy-${file.uuid}" onclick="copy('${file.name.replaceAll(' ', '_')}', '${file.uuid}')">Copy Link</button>
        <button class="--preview" onclick=window.open('/preview/${file.uuid}.${file.name.replaceAll(' ', '_')}')>Preview</button>
        <button class="--download" onclick="window.open('/${file.uuid}.${file.name.replaceAll(' ', '_')}/download', '_self')">Download</button>
        <button class="--delete" onclick="delete_file('${file.name.replaceAll(' ', '_')}', '${file.uuid}', '${account.name}', '${pw}')">Delete</button>
        </h4>
        </div>
        `
    })
    if (account.files.length < 1) {
        list += `<h2 class="--error Roboto">You currently <ins class="--error-ins">don't</ins> have any files saved.</h1>`
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
        if (!fs.existsSync(`${__dirname}/uploads/${file.uuid}.${file.name}`)) {
            account.files.splice(account.files.indexOf(file, 1), 1)
            fs.writeFileSync('src/data/db.json', JSON.stringify(db, null, 4), err => { err ? console.log(err) : {} })
            console.log(`${account.name} deleted "${file.name}" (${get_size(file.size)}).`)
            return res.sendStatus(200)
        }
        await fs.unlinkSync(`${__dirname}/uploads/${file.uuid}.${file.name}`)
        if (!fs.existsSync(`${__dirname}/uploads/${file.uuid}.${file.name}`)) {
            account.files.splice(account.files.indexOf(file, 1), 1)
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