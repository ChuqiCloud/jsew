/**
 * jsew cdnjs回源
 * @copyright Acmecloud Group
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
const fetch = require('node-fetch');
const mime = require('mime-types');
const { minify } = require('terser');
const uglifycss = require('uglifycss');
const { ban } = require('../ban.js');

export default async function (req: VercelRequest, res: VercelResponse) {
    const { file } = req.query;
    
    // 基础路径校验
    if (!file || (file as string).split('/').length < 3) {
        res.setHeader('Content-Type', "text/plain; charset=utf-8");
        res.status(404).send('Not Found. (CKY#CDNJS)');
        return;
    }

    // 封禁列表检查
    for (const item of ban) {
        if (item.match.test(file as string) && item.ban && Date.now() < item.expire) {
            res.setHeader('Content-Type', "text/plain; charset=utf-8");
            res.status(403).send(item.msg);
            return;
        }
    }

    // 解析路径参数
    const [libName, version, ...fileParts] = (file as string).split('/');
    const filename = fileParts.join('/');

    try {
        // 获取库元数据
        const libInfo = await fetch(`https://api.cdnjs.com/libraries/${encodeURIComponent(libName)}`)
            .then(r => r.status === 404 ? null : r.json());

        if (!libInfo) {
            res.status(404).send('Library not found. (CKY#CDNJS)');
            return;
        }

        // 处理最新版本
        let resolvedVersion = version;
        if (version === 'latest') {
            resolvedVersion = libInfo.version;
            res.redirect(`/cdnjs/${libName}/${resolvedVersion}/${filename}`);
            return;
        }

        // 验证版本存在性
        const versionAssets = libInfo.assets.find(a => a.version === resolvedVersion);
        if (!versionAssets) {
            res.status(404).send('Version not found. (CKY#CDNJS)');
            return;
        }

        // 自动压缩处理逻辑
        const handleCompression = async () => {
            if (filename.endsWith('.min.js')) {
                const sourceFile = filename.replace('.min.js', '.js');
                if (versionAssets.files.includes(sourceFile)) {
                    const source = await fetch(`https://cdnjs.cloudflare.com/ajax/libs/${libName}/${resolvedVersion}/${sourceFile}`)
                        .then(r => r.text());
                    const minified = await minify(source);
                    return {
                        content: `/* Auto-minified by JSEW */\n${minified.code}`,
                        type: 'application/javascript'
                    };
                }
            }
            if (filename.endsWith('.min.css')) {
                const sourceFile = filename.replace('.min.css', '.css');
                if (versionAssets.files.includes(sourceFile)) {
                    const source = await fetch(`https://cdnjs.cloudflare.com/ajax/libs/${libName}/${resolvedVersion}/${sourceFile}`)
                        .then(r => r.text());
                    return {
                        content: uglifycss.processString(source),
                        type: 'text/css'
                    };
                }
            }
            return null;
        };

        // 文件存在性检查
        if (!versionAssets.files.includes(filename)) {
            const compressed = await handleCompression();
            if (compressed) {
                res.setHeader('Cache-Control', 'max-age=604800, s-maxage=604800');
                res.setHeader('Content-Type', `${compressed.type}; charset=utf-8`);
                return res.send(compressed.content);
            }
            res.status(404).send('File not found. (CKY#CDNJS)');
            return;
        }

        // 获取文件内容
        const fileUrl = `https://cdnjs.cloudflare.com/ajax/libs/${libName}/${resolvedVersion}/${filename}`;
        const fileRes = await fetch(fileUrl);
        
        // 文件大小校验 (20MB 限制)
        const contentLength = fileRes.headers.get('content-length');
        if (+(contentLength || 0) > 20 * 1024 * 1024) {
            res.status(413).send('File too large. (CKY#CDNJS)');
            return;
        }

        // 设置响应头
        const contentType = mime.lookup(filename) || 'text/plain';
        res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
        res.setHeader('Cache-Control', 'max-age=604800, s-maxage=604800');
        res.setHeader('JSEW-SERVER', 'Vercel');
        res.setHeader('access-control-allow-origin', '*');

        // 流式传输响应内容
        const arrayBuffer = await fileRes.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        console.error('CDNJS Proxy Error:', error);
        res.status(500).send('Internal Server Error. (CKY#CDNJS)');
    }
}