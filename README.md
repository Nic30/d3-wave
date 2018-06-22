# d3-wave
[![Travis-ci Build Status](https://travis-ci.org/Nic30/d3-wave.png?branch=master)](https://travis-ci.org/Nic30/d3-wave)[![npm version](https://badge.fury.io/js/d3-wave.svg)](https://badge.fury.io/js/d3-wave)[![Coverage Status](https://coveralls.io/repos/github/Nic30/d3-wave/badge.svg?branch=master)](https://coveralls.io/github/Nic30/d3-wave?branch=master)[![Documentation Status](https://readthedocs.org/projects/d3-wave/badge/?version=latest)](http://d3-wave.readthedocs.io/en/latest/?badge=latest)

D3.js based wave (signal) visualizer

This library renders signal dumps into specified svg. (GTKWave for javascript)

# Features:

* Vertical scrolling and zoom
* Renderers for int, str, bit and bit vector values


# Input JSON format

```
scope
{ "name": "<scope name>"
  "children" : {"<children name>" : child}
}

child can be scope or signal record

signal record 
{ "name": "<signal name>"
  "type": {"sigType": "<vcd signal type>",
           "width": <bit width of signal (integer)>},
  "data": [<data records>],
}

data record format
[<time (number)>, <value (string, format dependent on datatype)>]
```
