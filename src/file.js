const fs = require('fs');
const Path = require('path');

const utils = {
    readdir: (path) => {
        return fs.readdirSync(path);
    },
    validPath: (path) => {
        let ext = Path.extname(path);
        return /^\.(jpe?g|png|bmp|tiff|gif)$/i.test(ext);
    },
    fileOrDir: (path) => {
        if (fs.existsSync(path)) {
            let stat = fs.statSync(path);
            return stat.isFile() ? 1 : stat.isDirectory() ? 2 : 0;
        }
        return 0;
    },
    getPaths: (path, recursive) => {
        let paths = path;

        if (!Buffer.isBuffer(paths) && Array.isArray(paths)) return paths.map(item => utils.getPaths(item, recursive)).flat();

        if (typeof paths === 'string') {
            let src = Path.resolve(process.cwd(), paths);
            if (fs.existsSync(src)) {
                let type = utils.fileOrDir(src);
                if (type === 2) {
                    paths = [];
                    utils.readdir(src)
                        .filter(item => !/^(node_modules|.git|.vscode)$/.test(item))
                        .map(item => {
                            let _path = Path.join(src, item),
                                _type = utils.fileOrDir(_path);
                            if (_type === 2 && recursive) {
                                paths = paths.concat(utils.getPaths(_path, recursive));
                            } else if (_type === 1 && utils.validPath(_path)) {
                                paths.push(_path);
                            }
                        })
                } else if (type === 0 || (type === 1 && !utils.validPath(src))) {
                    throw 'Invalid image source `opts.src`.';
                }
            }
        }
        return paths;
    }
}

module.exports = utils;