import type { VercelRequest, VercelResponse } from '@vercel/node';
const fetch = require('node-fetch');
const mime = require('mime-types');
const { minify } = require('terser');
const uglifycss = require('uglifycss');
const { ban } = require('../ban.js');

export default async function (req: VercelRequest, res: VercelResponse) {
    const { file } = req.query;
    // 必须指定版本号
    if (!file || !file.includes('@')) {
        res.setHeader('Content-Type', "text/plain; charset=utf-8");
        res.status(404).send('Not Found. (CKY#JSEW)');
        return false;
    }
    console.log('route: ' + file);
    for (let i of ban) {
        console.log(i);
        if (i.match.test(file) && i.ban && Date.now() < i.expire) {
            res.setHeader('Content-Type', "text/plain; charset=utf-8");
            res.status(403).send(i.msg);
            return false;
        }
    }
    let mtch = (<string>file).match(/@/g);
    let pkgname, version, filename;
    if (mtch && mtch.length > 1 && (<string>file).split('@').length > 2) {
        // 匹配 org npm 包
        pkgname = '@' + (<string>file).split('@')[1];
        version = (<string>file).split('@')[2].split('/')[0];
        filename = (<string>file).split('@')[2].replace(version, '')
    } else if ((<string>file).split('@').length == 2) {
        pkgname = (<string>file).split('@')[0];
        version = (<string>file).split('@')[1].split('/')[0];
        filename = (<string>file).split('@')[1].replace(version, '')
    } else {
        res.setHeader('Content-Type', "text/plain; charset=utf-8");
        res.status(400).send('Invalid Request. (CKY#JSEW)');
        return false;
    }
//     if (req.headers['cncdn'] == 'DogeCloud') {
//         let sts = false;
//         for (let i of cn.npm) {
//             if (i == pkgname) {
//                 sts = true;
//                 break;
//             }
//         }
//         if (!sts) {
//             res.setHeader('Content-Type', "text/plain; charset=utf-8");
//             res.status(403).send('Forbidden. (CKY#JSEW)');
//             return false;
//         }
//     }
    console.log(version);
    if (version == 'latest' && filename && filename != '') {
        let pkgInfo = await fetch('https://registry.npmjs.org/' + pkgname + '/latest').then(res => res.json());
        version = pkgInfo.version;
        res.redirect('/npm/' + pkgname + '@' + version + filename);
        return true;
    } else if (version == 'latest') {
        let pkgInfo = await fetch('https://registry.npmjs.org/' + pkgname + '/latest').then(res => res.json());
        version = pkgInfo.version;
    } else if (version.split('.').length <= 2) {
        let pkgInfo = await fetch('https://registry.npmjs.org/' + pkgname).then(res => res.json());
        let versionList = pkgInfo.versions;
        let downArr: string[] = [];
        for (let i in versionList) {
            if (i.startsWith(version)) {
                downArr.push(i);
            }
        }
        version = downArr[downArr.length - 1];
        res.redirect('/npm/' + pkgname + '@' + version + filename);
        return true;
    }
    let indexUrl = `https://www.npmjs.com/package/${pkgname}/v/${version}/index`
    console.log(indexUrl)
    let index;
    try {
        index = await fetch(indexUrl).then(res => res.json());
        index = index.files;
    } catch(e) {
        res.setHeader('Content-Type', "text/plain; charset=utf-8");
        res.status(404).send(`Can't fetch ${pkgname}@${version} from npm. (CKY#JSEW)`);
        return false;
    }
    console.log(index);
    console.log(filename);
    let fileInfo = index[filename];
    if (!fileInfo) {
        if (filename.endsWith('.min.js')) {
            try {
                let rawjs = await fetch(`https://jsew.cky.codes/npm/${pkgname}@${version}${filename.replace('.min.js', '.js')}`).then(res => res.text());
                let minjs = await minify(rawjs);
                res.setHeader('Cache-Control', 'max-age=604800, s-maxage=604800');
                res.setHeader('Content-Type', "application/javascript; charset=utf-8");
                res.setHeader('JSEW-SERVER', 'Vercel');
                res.setHeader('access-control-allow-origin', '*');
                // res.setHeader('JSEW-FILESIZE', (respText.size) / 1024 / 1024);
                res.send(`/* CKY#JSEW (Auto Minifier) [Source URL: /npm/${pkgname}@${version}${filename.replace('.min.js', '.js')}] */\n${minjs.code}`);
                return true;
            } catch(e) {}
        }
        if (filename.endsWith('.min.css')) {
            try {
                let rawjs = await fetch(`https://jsew.cky.codes/npm/${pkgname}@${version}${filename.replace('.min.css', '.css')}`).then(res => res.text());
                let minjs = uglifycss.processString(rawjs, {});
                res.setHeader('Cache-Control', 'max-age=604800, s-maxage=604800');
                res.setHeader('Content-Type', "text/css; charset=utf-8");
                res.setHeader('JSEW-SERVER', 'Vercel');
                res.setHeader('access-control-allow-origin', '*');
                // res.setHeader('JSEW-FILESIZE', (respText.size) / 1024 / 1024);
                res.send(`/* CKY#JSEW (Auto Minifier) [Source URL: /npm/${pkgname}@${version}${filename.replace('.min.css', '.css')}] */\n${minjs}`);
                return true;
            } catch(e) {}
        }
        if (!filename) {
            try {
                let pkgHex = index['/package.json'].hex;
                let rsp = await fetch(`https://www.npmjs.com/package/${pkgname}/file/${pkgHex}`).then(res => res.json());
                res.redirect('/npm/' + pkgname + '@' + rsp.version + "/" + (rsp.jsew || rsp.jsdelivr || rsp.main || 'index.js'));
                return true;
            } catch(e) {}

        }
        res.setHeader('Content-Type', "text/plain; charset=utf-8");
        res.status(404).send(`Can't find ${filename} in ${pkgname}@${version}. (CKY#JSEW)`);
        return false;
    }
    console.log(fileInfo);
    let fileHex = fileInfo.hex;

    let rawUrl = `https://www.npmjs.com/package/${pkgname}/file/${fileHex}`;


    let resp = await fetch(rawUrl);
    let respText = await resp.blob();
    let ct_type;
    if (filename.includes('.html')) {
        ct_type = 'text/plain';
    } else {
        ct_type = mime.lookup(filename) || 'text/plain';
    }
    // 边缘缓存 48h, 浏览器缓存 48h.
    res.setHeader('Cache-Control', 'max-age=604800, s-maxage=604800');
    res.setHeader('Content-Type', ct_type+"; charset=utf-8");
    res.setHeader('JSEW-SERVER', 'Vercel');
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('JSEW-FILESIZE', (respText.size) / 1024 / 1024);

    if (((respText.size) / 1024 / 1024) > 20) {
        res.status(413).send('File too large. (CKY#JSEW)');
        return false;
    }
    // res.send(respText);
    respText.arrayBuffer().then((buf) => {
        res.send(Buffer.from(buf))
    });
}
