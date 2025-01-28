import type { VercelRequest, VercelResponse } from '@vercel/node';
const fetch = require('node-fetch');
const mime = require('mime-types');
const { minify } = require('terser');
const uglifycss = require('uglifycss');
const { ban } = require('../ban.js');

// 导出一个默认的异步函数，用于处理请求和响应
export default async function (req: VercelRequest, res: VercelResponse) {
    // 从请求的查询参数中获取文件名
    const { file } = req.query;
    // 如果没有文件名，则返回404错误
    if (!file) {
        res.setHeader('Content-Type', "text/plain; charset=utf-8");
        res.status(404).send('Not Found. (CKY#JSEW)');
        return false;
    }
    // 打印文件名
    console.log('route: ' + file);
    // 遍历ban数组
    for (let i of ban) {
        // 打印ban数组中的每一项
        console.log(i);
        // 打印当前时间
        console.log(Date.now());
        // 如果文件名匹配ban数组中的正则表达式，并且ban数组中的ban属性为true，并且当前时间小于ban数组中的expire属性，则返回403错误
        if (i.match.test(file) && i.ban && Date.now() < i.expire) {
            res.setHeader('Content-Type', "text/plain; charset=utf-8");
            res.status(403).send(i.msg);
            return false;
        }
    }
    // 定义GitHub的raw地址
    let rawHost = 'https://raw.githubusercontent.com/';
    // 定义GitHub的raw地址
    let rawUrl = rawHost + (<string>file).replace('@', '/');
    // 如果rawUrl的长度小于等于6，则重新定义rawUrl
    if (rawUrl.split('/').length <= 6) {
        let c = rawUrl.split('/');
        rawUrl = `${c[0]}/${c[1]}/${c[2]}/${c[3]}/${c[4]}/master/${c[5]}`;
    }



    // 如果rawUrl以!latest结尾，则从GitHub获取
    if (rawUrl.endsWith('!latest')) {
        // 从 GitHub 获取
        let c = rawUrl.split('/');
        let shaurl = encodeURI(
            `https://api.github.com/repos/${c[3]}/${c[4]}/commits?sha=${c[5]}&dt=${Math.floor(
                Math.random() * 100000000
            )}`
        );
        let shavl = await fetch(shaurl, {
            headers: {
                Accept: "application/vnd.github.v3.raw",
                // Authorization: `token ${this.token}`,
                "User-Agent": "ghKV Clinet",
            },
        });
        let shaValue = await shavl.text();
        shaValue = JSON.parse(shaValue)[0].sha;
        let base = '/gh/' + c[3] + '/' + c[4] + '@' + shaValue;
        let filename = '';
        for (let i = 6; i < c.length; i++) {
            filename += '/' + (c[i].replace('!latest', ''));
        }
        res.redirect(base + filename);
        return true;
    }



    // if (req.headers['cncdn'] == 'DogeCloud') {
    //     let sts = false;
    //     for (let i of cn.gh) {
    //         if (i == rawUrl.split('/')[3]) {
    //             sts = true;
    //             break;
    //         }
    //     }
    //     if (!sts) {
    //         res.setHeader('Content-Type', "text/plain; charset=utf-8");
    //         res.status(403).send('Forbidden. (CKY#JSEW)');
    //         return false;
    //     }
    // }

    // 获取rawUrl的内容
    let resp = await fetch(rawUrl);
    // 如果返回404错误，则尝试获取原始文件
    if (resp.status == 404) {
        // 如果文件是.min.js，则尝试获取原始文件并压缩
        if (rawUrl.endsWith('.min.js')) {
            try {
                let rawjs = await fetch(rawUrl.replace('.min.js', '.js')).then(res => res.text());
                let minjs = await minify(rawjs);
                res.setHeader('Cache-Control', 'max-age=604800, s-maxage=604800');
                res.setHeader('Content-Type', "application/javascript; charset=utf-8");
                res.setHeader('JSEW-SERVER', 'Vercel');
                res.setHeader('access-control-allow-origin', '*');
                // res.setHeader('JSEW-FILESIZE', (respText.size) / 1024 / 1024);
                res.send(`/* CKY#JSEW (Auto Minifier) [Source URL: ${rawUrl.replace('.min.js', '.js')}] */\n${minjs.code}`);
                return true;
            } catch(e) {}
        }
        // 如果文件是.min.css，则尝试获取原始文件并压缩
        if (rawUrl.endsWith('.min.css')) {
            try {
                let rawjs = await fetch(rawUrl.replace('.min.css', '.css')).then(res => res.text());
                let minjs = uglifycss.processString(rawjs, {});
                res.setHeader('Cache-Control', 'max-age=604800, s-maxage=604800');
                res.setHeader('Content-Type', "text/css; charset=utf-8");
                res.setHeader('JSEW-SERVER', 'Vercel');
                res.setHeader('access-control-allow-origin', '*');
                // res.setHeader('JSEW-FILESIZE', (respText.size) / 1024 / 1024);
                res.send(`/* CKY#JSEW (Auto Minifier) [Source URL: ${rawUrl.replace('.min.js', '.js')}] */\n${minjs}`);
                return true;
            } catch(e) {}
        }
    }
    // 获取rawUrl的内容
    let respText = await resp.blob();
    // 定义Content-Type
    let ct_type;
    // 如果文件是.html，则Content-Type为text/plain
    if (file.includes('.html')) {
        ct_type = 'text/plain';
    } else {
        // 否则，根据文件后缀名获取Content-Type
        ct_type = mime.lookup(rawUrl) || 'text/plain';
    }
    // 边缘缓存 48h, 浏览器缓存 48h.
    res.setHeader('Cache-Control', 'max-age=604800, s-maxage=604800');
    res.setHeader('Content-Type', ct_type+"; charset=utf-8");
    res.setHeader('JSEW-SERVER', 'Vercel');
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('JSEW-FILESIZE', (respText.size) / 1024 / 1024);
    // res.send(respText);

    if (((respText.size) / 1024 / 1024) > 20) {
        res.status(413).send('File too large. (CKY#JSEW)');
        return false;
    }
    respText.arrayBuffer().then((buf) => {
        res.send(Buffer.from(buf))
    });
}
