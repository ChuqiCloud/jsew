# jsew

> 此页面最后更新于 2025 年 1 月 28 日，**部分节点可能会对此页面有较长时间的缓存**。

## 什么是 JSEW?

由Acmecloud Group 提供的公益静态文件分发，由初七云团队维护，WAFPRO 提供境内加速网络 初星盾提供全球加速网络。

JSEW 类似于 jsDelivr，从 GitHub NPMJS CDNJS JSDWP 拉取文件并提供 CDN 加速。

JSEW 正在尝试与 jsDelivr API 兼容，匹配路径过程中出现任何问题，请向我们反馈。

> 如果对仓库封禁、路径匹配、仓库内容等有任何疑问和建议，请联系邮箱：`support [at] acmecloud.cn`。

## Endpoint


### GitHub

GitHub 文件来源于 `raw.githubusercontent.com`，将自动转换路径，API 如下：

```
/gh/[USER_NAME]/[REPO_NAME]@[BRANCH_NAME]/[FILE]
```

例如：

```
https://cdn.smartcis.cn/gh/detalkjs/client@master/dist/detalk.js
```

如果 `BRANCH_NAME` 未包含，则会默认为 `master` 分支。

### NPM

NPM 文件来源于 `www.npmjs.com`，将自动转换路径并获取文件 Hex，API 如下：

```
/npm/[PACKAGE_NAME]@[VERSION]/[FILE]
```

例如：

```
https://cdn.smartcis.cn/npm/@detalk/static@1.2.1/dist/detalk.js
```

当版本号为 `@latest` 时，将会自动 307 跳转至最新的版本号。

当版本号为 `@1` 时，将会自动 307 跳转至最新的 `1.x.x` 版本号。

例如：

```
https://cdn.smartcis.cn/npm/@detalk/static@latest/dist/detalk.js
https://cdn.smartcis.cn/npm/@detalk/static@1/dist/detalk.js
```


**即使不指定版本号，也必须指定 `@latest`，否则无法访问。**

### cdnjs

cdnjs 文件来源于 `cdnjs.cloudflare.com`，将自动转换路径，API 如下：

```
/cdnjs/[PACKAGE_NAME]@[VERSION]/[FILE]
```

例如：

```
https://cdn.smartcis.cn/cdnjs/jquery@3.6.0/dist/jquery.min.js
```

### wordpress

WordPress 文件来源于 `cdn.jsdelivr.net`，API 如下：

```
/wp/[plugins|themes]/[PLUGIN_NAME|THEME_NAME]@[VERSION]/[FILE]
```

例如：

```
https://cdn.smartcis.cn/wp/plugins/wp-slimstat/tags/4.6.5/wp-slimstat.js
```

## 自动压缩

除 Gzip 压缩外，目前CKY#JSEW 还兼容部分文件的自动压缩功能。

例如，请求 `main.min.js` 文件，而目录下无对应文件，只有 `main.js`，那么则会自动获取 `main.js` 并进行压缩返回。

此功能目前适用于 CSS 与 JavaScript，只有在请求文件为 `.min.js` 或 `.min.css` 且对应文件不存在时可用。


## 域名

使用 `cdn.smartcis.cn` 替换 `fastly.jsdelivr.net`, `cdn.jsdelivr.net` 作为加速域名，此域已使用 WAFPRO + 初星盾 加速。

## TOS

非常感谢您使用 jsew 服务。

此项目开发初衷是为了优化 jsDelivr 在中国大陆境内的访问，方便开发者存放 JavaScript, CSS 文件。

所以，为了项目可以更好的运转，此服务原则上不支持为图片、字体、压缩包、视频、视频分片等文件加速。

如果发现为以上类别的文件加速，则可能会封禁包名、封禁文件或是封禁用户名。一般Jason懒得管，你要是太过分那就拉黑了。

同时，此项目只支持为个人开发者的开源项目提供支持与服务，切勿用于商业服务中。

你要真商用，那就用吧。

CKY 对 `cdn.smartcis.cn` 的 SLA 不作任何保证，但其托管的平台均有较高的 SLA 支持。

感谢您对公益服务的支持！

---
