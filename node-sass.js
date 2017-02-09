const https = require('https')
const fs = require('fs')
const cheerio = require('cheerio')

function sendReq(url) {
    return new Promise((resolve, rejcet) => {
        https.get(url, res => {
            res.setEncoding('utf8')
            let rawData = ''
            res.on('data', (chunk) => rawData += chunk)
            res.on('end', () => resolve(rawData))
        }).on('error', (e) => {
            console.log(`Sending request got error: ${e.message}`)
            rejcet(e)
        })
    })
}

function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        var writer = fs.createWriteStream(filename)
        writer.on('finish', () => {
            resolve()
        }).on('error', err => {
            console.log(`writing file got error: ${err.message}`)
            reject(err)
        })
        https.get(url, function (response) {
            if (response.statusCode === 200) {
                response.pipe(writer)
            } else if (response.statusCode === 302) {
                downloadFile(response.headers.location, filename).then(() => resolve()).catch(err => reject(err))
            }
        }).on('error', err => {
            console.log(`Downloading file got error: ${err.message}`)
            reject(err)
        })
    })

}

const host = `https://github.com`

async function start() {
    const res = await sendReq(`${host}/sass/node-sass/releases`)
    // const html = await fetch(`${host}/sass/node-sass/releases`)
    // const text = await html.text()
    const $ = cheerio.load(res)
    const releaseList = $('.release-timeline .release')
    const releaseListData = []
    for (let i = 0;i < releaseList.length;i++) {
        const downloadList = releaseList.eq(i).find('ul.release-downloads li a')
        const downloadListData = []
        for (let j = 0;j < downloadList.length;j++) {
            downloadListData.push({
                href: host + downloadList.eq(j).attr('href'),
                filename: downloadList.eq(j).find('strong').text(),
                size: downloadList.eq(j).find('small').text()
            })
        }
        releaseListData.push({
            version: releaseList.eq(i).find('.release-title a').text(),
            downloadListData
        })
    }

    for (let releaseItem of releaseListData) {
        // const taskList = releaseItem.downloadListData.map(item => {
        //     fs.existsSync(`./data/${releaseItem.version}`) || fs.mkdirSync(`./data/${releaseItem.version}`)
        //     return downloadFile(item.href, `./data/${releaseItem.version}/${item.filename}`)
        // })
        // await Promise.all(taskList)
        fs.existsSync(`./data/${releaseItem.version}`) || fs.mkdirSync(`./data/${releaseItem.version}`)
        for (let downItem of releaseItem.downloadListData) {
            if (fs.existsSync(`./data/${releaseItem.version}/${downItem.filename}`)) {
                console.log(`./data/${releaseItem.version}/${downItem.filename} existes!!`)
            } else {
                await downloadFile(downItem.href, `./data/${releaseItem.version}/${downItem.filename}`)
                console.log(`./data/${releaseItem.version}/${downItem.filename} downloads successfully`)
            }
        }
    }

    return

    // const targetEl = releaseList.eq(0).find('ul.release-downloads li').eq(0).find('a')

    // const href = targetEl.attr('href')

    // const downloadUrl = host + href

    // await downloadFile(downloadUrl, `./data/${targetEl.find('strong').text()}`)

    // return
}


process.stdin.setEncoding('utf8')
process.stdin.on('readable', () => {
    var chunk = process.stdin.read()
    if (chunk === '\n') {
        start().then(res => {
            console.log('Successfully downloaded!')
        }).catch(err => {
            console.log(err)
        })
    }
})
console.log('press enter to start')