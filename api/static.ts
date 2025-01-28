// gh.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
const fetch = require('node-fetch');
const mime = require('mime-types');
const { minify } = require('terser');
const uglifycss = require('uglifycss');
const { ban } = require('../ban.js');

export default async function (req: VercelRequest, res: VercelResponse) {
    const { file } = req.query;
    if (!file) {
        res.setHeader('Content-Type', "text/plain; charset=utf-8");
        res.status(404).send('Not Found. (CKY#JSEW)');
        return false;
    }
    console.log('route: ' + file);
    for (let i of ban) {
        console.log(i);
        console.log(Date.now());
        if (i.match.test(file) && i.ban && Date.now() < i.expire) {
            res.setHeader('Content-Type', "text/plain; charset=utf-8");
            res.status(403).send(i.msg);
            return false;
        }
    }
    let rawHost = 'https://raw.githubusercontent.com/';
                                                                 
    let c = ['', '', '', 'oCoke', 'static-0', 'master', '/' + (<string>file)]
    let rawUrl = rawHost + c[3] + '/' + c[4] + '/' + c[5] + c[6];

    console.log(rawUrl);


    if (rawUrl.endsWith('!latest')) {
        // 从 GitHub 获取
//         let c = rawUrl.split('/');
        let shaurl = encodeURI(
            `https://api.github.com/repos/${c[3]}/${c[4]}/commits?sha=${c[5]}&dt=${Math.floor(
                Math.random() * 100000000
            )}`
        );
        let shavl = await fetch(shaurl, {
            headers: {
                Accept: "application/vnd.github.v3.raw",
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
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



    let resp = await fetch(rawUrl, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "User-Agent": "ghKV Clinet",
      }
    });
    if (resp.status == 404) {
        if (rawUrl.endsWith('.min.js')) {
            try {
                let rawjs = await fetch(rawUrl.replace('.min.js', '.js'), {
                  headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                    "User-Agent": "ghKV Clinet",
                  }
                }).then(res => res.text());
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
        if (rawUrl.endsWith('.min.css')) {
            try {
                let rawjs = await fetch(rawUrl.replace('.min.css', '.css'), {
                  headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                      
                    "User-Agent": "ghKV Clinet",
                  }
                }).then(res => res.text());
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
    let respText = await resp.blob();
    let ct_type;
    if (file.includes('.html')) {
        ct_type = 'text/plain';
    } else {
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
