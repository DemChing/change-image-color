const Jimp = require('jimp');
const ChangeColorError = require('./error');
const File = require('./file');
const Color = require('./color');

module.exports = ({
    src,
    colors,
    deltaE = 2.3,
    formula = '00',
    transparency = true,
    recursive = false,
}, callback) => {
    let converted = [];
    return new Promise((resolve, reject) => {
        callback = typeof callback === 'function' ? callback : (error, data) => {
            error ? reject(error) : resolve(data);
        }

        try {
            if (!src) {
                throw 'Missing image source `opts.src`.';
            }
            if (typeof colors === 'undefined') {
                throw 'Missing colors to change `opts.colors`.';
            } else if (!Array.isArray(colors)) colors = [colors];

            const processColors = (from, to) => {
                if (Color.isValid(from) && Color.isValid(to)) {
                    converted.push([Color.convert(from, 'Lab'), Color.convert(to, 'Rgb')]);
                }
            }
            for (let i = 0; i < colors.length; i++) {
                let color = colors[i];
                if (typeof color !== 'object' || Object.keys(color).length < 1) {
                    throw 'Invalid color configuration.';
                }

                if (color.from || color.to) {
                    if (typeof color.from === 'undefined') {
                        throw 'Missing source color `color.from`.';
                    }
                    if (typeof color.to === 'undefined') {
                        throw 'Missing destination color `color.to`.';
                    }
                    processColors(color.from, color.to);
                } else {
                    for (let key in color) {
                        processColors(key, color[key]);
                    }
                }
            }

            if (typeof deltaE !== 'number' || isNaN(deltaE) || deltaE < 0 || deltaE > 100) {
                throw 'Invalid Delta E. `opts.deltaE` should be a number between 0 and 100.';
            }

            if (!/^(76|94|00)$/.test(formula)) {
                throw 'Invalid Delta E formula. `opts.formula` should be "76", "94" or "00".';
            }

            const processImage = (imgSrc) => Jimp.read(imgSrc)
                .then(image => {
                    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (_x, _y, idx) => {
                        let current = Color.convert({
                            r: image.bitmap.data[idx],
                            g: image.bitmap.data[idx + 1],
                            b: image.bitmap.data[idx + 2],
                            a: image.bitmap.data[idx + 3] / 255,
                        }, 'Lab');

                        converted.map(([from, to]) => {
                            if (Color.deltaE(current, from, formula) <= deltaE && (!transparency || current.ALPHA === from.ALPHA)) {
                                image.bitmap.data[idx] = to.R;
                                image.bitmap.data[idx + 1] = to.G;
                                image.bitmap.data[idx + 2] = to.B;
                                image.bitmap.data[idx + 3] = Math.round(to.A * 255);
                            }
                        })
                    });
                    return image;
                })

            let paths = File.getPaths(src, recursive);

            if (Buffer.isBuffer(paths) || typeof paths === 'string') {
                paths = [paths];
            }
            paths.reduce((p, path) => p.then(results => {
                    return processImage(path)
                        .then(res => results.concat({
                            src: path,
                            image: res
                        }))
                }), Promise.resolve([]))
                .then(result => callback(null, result))
                .catch(callback);

        } catch (msg) {
            callback(new ChangeColorError(msg))
        }
    });
}