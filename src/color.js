const DeltaE = require('delta-e');
const {
    colord,
    extend
} = require('colord');

extend([
    require('colord/plugins/names'),
    require('colord/plugins/cmyk'),
    require('colord/plugins/hwb'),
    require('colord/plugins/lab'),
    require('colord/plugins/lch'),
    require('colord/plugins/xyz'),
]);

const utils = {
    normalize: (color) => {
        if (typeof color === 'string') {
            let formatRegex = /(rgb|hsl|hsv|hwb)a?|cmyk|lab/i,
                unitRegex = /[+-]?\d*\.?\d+(%|deg|rad|grad|turn)?/gi;
            if (formatRegex.test(color)) {
                let _color = color.toLowerCase(),
                    format = (_color.match(formatRegex) || [])[0] || '',
                    args = _color.match(unitRegex),
                    separator = ',';

                if (format.length > args.length) return color;

                let base = args.splice(0, 3),
                    forth = '';

                if (format.length > 3 && typeof args[0] === 'string') {
                    let _separator = separator;
                    if (args[0].slice(-1) === '%') {
                        separator = ' ';
                        _separator = ' / '
                    }
                    forth = `${_separator}${args[0]}`;
                }
                return `${format}(${base.join(separator)}${forth})`
            }
            return color;
        }
        return color;
    },
    convert: (color, type) => {
        let target = colord(utils.normalize(color))[`to${type}`](),
            result = {};
        if (typeof target === 'object') {
            for (let key in target) {
                result[key.toUpperCase()] = target[key];
            }
        }
        return result;
    },
    isValid: (color) => {
        if (!colord(utils.normalize(color)).isValid()) {
            throw `Invalid color expression \`${typeof color === 'string' ? color : JSON.stringify(color, null, 4)}\`.\nExpected values are either string or object.\nVisit https://github.com/omgovich/colord#color-parsing to check the valid input.`;
        }
        return true;
    },
    deltaE: (lab1, lab2, formula) => {
        return DeltaE[`getDeltaE${formula}`](lab1, lab2);
    }
}

module.exports = utils;