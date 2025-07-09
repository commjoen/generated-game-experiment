////////////////////////////////////////////////////////////////////////////////
//
// @small-tech/vite-plugin-sri
//
// Subresource integrity (SRI) plugin for Vite (https://vitejs.dev/)
//
// Adds subresource integrity hashes to script and stylesheet
// imports from your index.html file at build time.
//
// If you’re looking for a generic Rollup plugin that does the same thing,
// see rollup-plugin-sri by Jonas Kruckenberg that this one was inspired by:
// https://github.com/JonasKruckenberg/rollup-plugin-sri
//
// Like this? Fund us!
// https://small-tech.org/fund-us
//
// Copyright ⓒ 2021-present Aral Balkan, Small Technology Foundation
// License: ISC.
//
////////////////////////////////////////////////////////////////////////////////
'use strict';

const cheerio = require('cheerio');
const fs = require('fs');
const node_crypto = require('node:crypto');
const path = require('path');

////////////////////////////////////////////////////////////////////////////////
function sri() {
    let config;
    const bundle = {};
    return {
        name: 'vite-plugin-sri',
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        enforce: 'post',
        apply: 'build',
        async writeBundle(options, _bundle) {
            // when use with vite-plugin-legacy
            // writeBundle will be called twice
            // legacy bundle will be run first, but not with index.html file
            // esm bundle will be run after, so should saved legacy bundle before esm bundle output.
            Object.entries(_bundle).forEach(([k, v]) => {
                // @ts-ignore
                bundle[k] = v;
            });
            const htmls = Object.keys(bundle)
                .filter(filename => filename.endsWith('.html'))
                // @ts-ignore
                .map(filename => {
                const bundleItem = bundle[filename];
                if (bundleItem.type === 'asset') {
                    return {
                        name: bundleItem.fileName,
                        source: bundleItem.source,
                    };
                }
            })
                .filter(item => !!item);
            htmls.forEach(async ({ name, source: html }) => {
                // @ts-ignore
                const $ = cheerio.load(html);
                // Implement SRI for scripts and stylesheets.
                const scripts = $('script').filter('[src]');
                const stylesheets = $('link').filter('[href]');
                const calculateIntegrityHashes = async (element) => {
                    let source;
                    const attributeName = element.attribs.src ? 'src' : 'href';
                    const resourceUrl = element.attribs[attributeName];
                    const resourcePath = resourceUrl.indexOf(config.base) === 0
                        ? resourceUrl.substring(config.base.length)
                        : resourceUrl;
                    const t = Object.entries(bundle).find(([, bundleItem]) => bundleItem.fileName === resourcePath)?.[1];
                    if (!t) {
                        config.logger.warn(`cannot find ${resourcePath} in output bundle.`);
                        try {
                            source = fs.readFileSync(path.resolve(options.dir, resourcePath));
                        }
                        catch (error) {
                            source = void 0;
                        }
                    }
                    else {
                        if (t.type === 'asset') {
                            source = t.source;
                        }
                        else {
                            source = t.code;
                        }
                    }
                    if (source)
                        element.attribs.integrity = `sha384-${node_crypto.createHash('sha384')
                            .update(source)
                            .digest()
                            .toString('base64')}`;
                    if (element.attribs.crossorigin === void 0) {
                        // 在进行跨域资源请求时，integrity必须配合crossorigin使用，不然浏览器会丢弃这个资源的请求
                        // https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes/crossorigin
                        element.attribs.crossorigin = 'anonymous';
                    }
                };
                await Promise.all([
                    ...scripts.map(async (i, script) => {
                        return await calculateIntegrityHashes(script);
                    }),
                    ...stylesheets.map(async (i, style) => {
                        return await calculateIntegrityHashes(style);
                    }),
                ]);
                fs.writeFileSync(path.resolve(config?.root, config?.build.outDir, name), $.html());
            });
        },
    };
}

module.exports = sri;
