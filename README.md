# d3-wave
[![Travis-ci Build Status](https://travis-ci.org/Nic30/d3-wave.png?branch=master)](https://travis-ci.org/Nic30/d3-wave)[![npm version](https://badge.fury.io/js/d3-wave.svg)](https://badge.fury.io/js/d3-wave)[![Coverage Status](https://coveralls.io/repos/github/Nic30/d3-wave/badge.svg?branch=master)](https://coveralls.io/github/Nic30/d3-wave?branch=master)[![Documentation Status](https://readthedocs.org/projects/d3-wave/badge/?version=latest)](http://d3-wave.readthedocs.io/en/latest/?badge=latest)

D3.js based wave (signal) visualizer

This library renders signal dumps into specified svg. (GTKWave for javascript)


**Note that the gif is ugly** and from old version, it is not updated offten because it is big and we do not want to spoil the repo.

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
