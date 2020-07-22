"use strict";

// https://stackoverflow.com/questions/15181452/how-to-save-export-inline-svg-styled-with-css-from-browser-to-image-file

function inlineStylesToSvgCopy(parentNode, origData, CONTAINER_ELEMENTS, RELEVANT_STYLES) {
	if (parentNode.tagName in RELEVANT_STYLES) {
		var StyleDef = window.getComputedStyle(origData);
		var styleStrBuff = [];
		var relStyles = RELEVANT_STYLES[parentNode.tagName];
		for (var st = 0; st < relStyles.length; st++) {
			styleStrBuff.push(relStyles[st]);
			styleStrBuff.push(':');
			styleStrBuff.push(StyleDef.getPropertyValue(relStyles[st]));
			styleStrBuff.push('; ');
		}
		parentNode.setAttribute('style', styleStrBuff.join(''));
	}
	if (CONTAINER_ELEMENTS.indexOf(parentNode.tagName) === -1)
		return;
	var children = parentNode.childNodes;
	var origChildDat = origData.childNodes;
	for (var cd = 0; cd < children.length; cd++) {
		var c = children[cd];
		var tagName = c.tagName;
		inlineStylesToSvgCopy(c, origChildDat[cd], CONTAINER_ELEMENTS, RELEVANT_STYLES);
	}
}

const CONTAINER_ELEMENTS = ['svg', 'g'];
const RELEVANT_STYLES = {
	'svg': ['background-color',],
	'rect': ['fill', 'stroke', 'stroke-width'],
	'path': ['fill', 'stroke', 'stroke-width'],
	'circle': ['fill', 'stroke', 'stroke-width'],
	'line': ['stroke', 'stroke-width'],
	'text': ['fill', 'font-size', 'text-anchor'],
	'polygon': ['stroke', 'fill']
};

export function exportStyledSvgToBlob(svgElm) {
	var oDOM = svgElm.cloneNode(true);
	inlineStylesToSvgCopy(oDOM, svgElm, CONTAINER_ELEMENTS, RELEVANT_STYLES);

	var data = new XMLSerializer().serializeToString(oDOM);
	var svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
	return svg;
}

export function exportStyledSVG(svgElm) {
	var svg = exportStyledSvgToBlob(svgElm);
	var url = URL.createObjectURL(svg);

	var link = document.createElement('a');
	link.setAttribute('target', '_blank');
	var text = document.createTextNode('Export');
	link.appendChild(text);
	link.href = url;

	document.body.appendChild(link);
}
