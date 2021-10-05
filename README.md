# change-image-color
Manipulate the colors in image.

## Installation
```
// npm
npm install change-image-color

// yarn
yarn add change-image-color
```

## Usage
```javascript
const ChangeColor = require('change-image-color');

// with a callback
ChangeColor({ /* your configuration */ }, (err, res) => {
    if (err) {
        /* error handling */
    } else {
        processResult(res);
    }
})

// as a Promise
ChangeColor({ /* your configuration */ })
    .then(res => {
        processResult(res);
    })
    .catch(err => {
        /* error handling */
    })
```

`result` is an array containing the Jimp instance of the image and its source. Check [jimp](https://github.com/oliver-moran/jimp/tree/master/packages/jimp#methods) to see what you can do with the instance.
```javascript
const processResult = (res) => {
    res.map(({ src, image }) => {
        // src: your image source
        // image: Jimp instance

        /* your function */
    })
}
```

### Options
This repo uses `jimp` to modify the color. You may want to check more with [Jimp](https://github.com/oliver-moran/jimp).

| name | type | required | default | description |
| --- | --- | --- | --- | --- |
| `src` | `string \| Buffer \| Object` | `true` | -- | Source of images |
| `colors` | `Object` | `true` | -- | Colors to be modified |
| `deltaE` | `number` | `false` | `2.3` | Color difference ΔE |
| `formula` | `"76" \| "94" \| "00"` | `false` | `00` | Color difference formula |
| `transparency` | `boolean` | `false` | `true` | Match color with the same transparency |
| `recursive` | `boolean` | `false` | `false` | Search directory recursively |

#### `options.src`
`options.src` accepts many anything that is a valid input in `Jimp.read(src)` ([Usage](https://github.com/oliver-moran/jimp/tree/master/packages/jimp#basic-usage)): path to a file, URL, a Jimp instance or a buffer.

Files are processed one by one to prevent a sudden drain in CPU and memory

```javascript
// local file
ChangeColor({ src: 'path/to/your/image.png' })

// URL
ChangeColor({ src: 'https://path/to/your/image.png' })

// Jimp instance
ChangeColor({ src: jimpInstance })

// buffer
ChangeColor({ src: buffer })
```

To process multiple images, you can specify path of a directory. Or even an array of the accepted input.
```javascript
// local directory
ChangeColor({ src: 'path/to/your/directory' })

// an array
ChangeColor({
    src: [
        'path/to/your/directory',
        'https://path/to/your/image.png',
        buffer,
    ]
})
```

#### `options.colors`
`options.colors` can be set in different formats.
```javascript
// in array of object
ChangeColor({
    colors: [{
        from: from_color1,
        to: to_color1,
    }, {
        from: from_color2,
        to: to_color2,
    }]
})

// in object
ChangeColor({
    colors: {
        from_color1: to_color1,
        from_color2: to_color2,
    }
})
```

A valid `color` could be a string or object that is valid as a input in `colord`. For more detail, please check [Colord](https://github.com/omgovich/colord#color-parsing).

Plugins of `names`, `cmyk`, `hwb`, `lab`, `lch`, `xyz` are enabled.
```javascript
color = '#333' // hex

color = 'rgba(33, 33, 22, 0.5)' // rgb string

color = { r: 33, g: 33, b: 33, a: 0.5 } // rgb object

// check `colord` for other expressions
```

#### `options.deltaE`
`options.deltaE` should be a number between `0` and `100`. Colors with `Delta E` below `2` are hard for people to notice.

For more, check [here](http://zschuessler.github.io/DeltaE/learn/).

#### `options.formula`
`options.formula` specify the formula to calculate `Delta E`. You can choose between `CIE76`, `CIE94` and `CIE00`.

For more, check [here](http://zschuessler.github.io/DeltaE/learn/).

#### `options.transparency`
Only the colors with `Delta E` smaller than `options.deltaE` **_AND_** identical transparency will be replaced.

To bypass transparency check, set `options.transparency` to `false`.

| color in image | color to match | `options.transparency` | result |
| --- | --- | --- | --- |
| `#000000` | `#000000` | `true` | Match |
| `#00000077` | `#000000` | `true` | **NOT** Match |
| `#000000` | `#00000077` | `true` | **NOT** Match |
| `#000000` | `#00000077` | `false` | Match |

#### `options.recursive`
`options.recursive` only works when specify directory in `options.src`.

It will loop recursively in that directory to find all the images. However, it will ignore all the sub-directories with name `node_modules`, `.git` or `.vscode`.

## Command Line
```
// installed globally
change-image-color

// installed locally
npx change-image-color
```

Run the script and answer the questions.

If the output file already exist, it will add a suffix `-cic` to the filename.

## License
This project is licensed under the terms of the [MIT](LICENSE.md) license.

## Support
If you find this repo useful, please share to your friends. Or you can buy me a coffee:

<a href="https://www.buymeacoffee.com/demching" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>