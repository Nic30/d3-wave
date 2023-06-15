# d3-wave
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/Nic30/d3-wave/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/Nic30/d3-wave/tree/master)[![Coverage Status](https://coveralls.io/repos/github/Nic30/d3-wave/badge.svg?branch=master)](https://coveralls.io/github/Nic30/d3-wave?branch=master)[![Documentation Status](https://readthedocs.org/projects/d3-wave/badge/?version=latest)](http://d3-wave.readthedocs.io/en/latest/?badge=latest)

D3.js based wave (signal) visualizer

This library renders signal dumps into specified svg. (GTKWave for javascript)

![scroll_and_zoom.gif](doc/scroll_and_zoom.gif)

Use `npm install d3-wave --save` to install this library and save it to your package.json file.
Installation from git for developers:
```
npm install            # normal dependencies
npm install --only=dev # developement only dedpendencies
npm run-script build   # build dist js
npm test               # run tests

python -m http.server  # run http server in root directory in order to open the examples in ./examples directory
```

## Features

* Vertical scrolling and zoom in time domain
* Tree based signal hierarchy view (collapsable)
* Signal tree scrollbar with preview
* Drag-and-drop/key based signal organization
* Renderers for int, str, bit, enum and bit vector values (user extendible)
* Dynamic time unit on x-axis
* Responsive design
* Arbitrary integer values

## Input JSON format

Signal record
```js
{ "name": "<signal name>",
  "type": {"name": "<vcd signal type>",
           "width": "<bit width of signal (integer)>"},
  "data": ["<data records>"],      // optionally
  "children": ["<signal recors>"], // optionally, if children should be collapsed by default use _children
}
```

Data record format
```json
["<time (number)>", "<value (string, format dependent on datatype)>"]
```

There is a special type with name "struct"
Signal with this name has stored another signal records in it's data.
The type in signal record specifies which renderer should be used and what is the format of values.
For more details check `src/rowRenderers`. For example for type: `{"name": "wire", "width": 8}` the value may be 


## Similar opensource

* [wavedash](https://github.com/donn/wavedash) SVG-based Waveform Viewer
* [Konata](https://github.com/shioyadan/Konata) pipeline visualizer
* [wavedrom](https://github.com/wavedrom/wavedrom) static waveform printer
* [JSwave](https://github.com/kwf37/JSwave) Javascript visualizer for vcd
* [impulse.vscode](https://github.com/toem/impulse.vscode) event and waveform visualization and analysis workbench

