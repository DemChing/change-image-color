#!/usr/bin/env node

const fs = require('fs');
const Path = require('path');
const inquirer = require('inquirer');
const ChangeColor = require('.');

const ResolvePath = (path) => Path.resolve(process.cwd(), path || '')

const PromptColors = (ans, prev) => {
    prev = prev || [];
    return inquirer.prompt([{
        name: 'color',
        message: `Specify colors to change. ${prev.length ? 'Type "END" to finish' : `(Format: from_color|to_color)`}`
    }]).then(({
        color
    }) => {
        if (color === 'END') {
            let colors = {};
            prev.map(item => {
                let [from, to] = item.split('|');
                colors[from] = to;
            })
            return {
                colors
            };
        } else {
            if (color) prev.push(color);
            return PromptColors(ans, prev);
        }
    })
}

const PromptOptions = (ans) => {
    return inquirer.prompt([{
            name: 'skip',
            type: 'confirm',
            message: 'Skip advance options?',
            default: true
        }])
        .then(({
            skip
        }) => {
            if (skip) return {};
            else return inquirer.prompt([{
                name: 'transparency',
                message: 'Match transparency strictly?',
                type: 'confirm',
                default: true,
            }, {
                name: 'deltaE',
                message: 'Color difference ΔE:',
                default: 2.3,
            }, {
                name: 'formula',
                message: 'Color difference formula:',
                type: 'list',
                choices: [{
                    name: 'CIE 1976',
                    value: '76',
                    short: 'E76',
                }, {
                    name: 'CIE 1994',
                    value: '94',
                    short: 'E94',
                }, {
                    name: 'CIE 2000',
                    value: '00',
                    short: 'E00',
                }],
                default: 2,
            }, {
                name: 'recursive',
                message: 'Find images recursively?',
                type: 'confirm',
                when: () => {
                    let sources = (ans.src || '')
                        .split(',')
                        .filter(item => fs.existsSync(ResolvePath(item)) && fs.statSync(ResolvePath(item)).isDirectory());
                    return sources.length > 0;
                },
                default: false
            }])
        })
}

const MergeAnswers = (prev, func) => func(prev).then(ans => ({
    ...prev,
    ...ans
}))

inquirer.prompt([{
        name: 'src',
        message: 'Specify image source (local path or url). Use comma to separate multiple sources.',
        default: process.cwd(),
    }, {
        name: 'dest',
        message: 'Specify output destination. Provide a directory for multiple image sources.',
        default: process.cwd(),
    }])
    .then(ans => MergeAnswers(ans, PromptColors))
    .then(ans => MergeAnswers(ans, PromptOptions))
    .then(ans => {
        if (typeof ans.deltaE !== 'undefined') ans.deltaE = parseFloat(ans.deltaE);
        let dest = ResolvePath(ans.dest),
            isFile = /^\.[a-z]+$/.test(Path.extname(dest));
        return ChangeColor(ans)
            .then(result => {
                result = Array.isArray(result) ? result : [result];

                let locs = {};
                result.map(({
                    src,
                    image
                }) => {
                    let loc = ResolvePath(`${dest}/${Path.basename(src)}`);
                    if (result.length === 1 && isFile) {
                        loc = dest;
                    }

                    let dir = Path.dirname(loc);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {
                        recursive: true
                    });

                    while (loc in locs || fs.existsSync(loc)) {
                        let ext = Path.extname(loc);
                        loc = loc.replace(ext, `-cic${ext}`);
                    }

                    locs[loc] = image;
                })

                return Promise.all(Object.keys(locs).map(loc => locs[loc].writeAsync(loc)))
            })
    })
    .then(res => {
        console.log(`Processed ${res.length} files.`)
    })
    .catch(console.log)