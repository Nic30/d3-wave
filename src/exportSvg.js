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
		inlineStylesToSvgCopy(c, origChildDat[cd], CONTAINER_ELEMENTS, RELEVANT_STYLES);
	}
}

const CONTAINER_ELEMENTS = ['svg', 'g'];
const RELEVANT_STYLES = {
	'svg': ['background-color',],
	'rect': ['fill', 'stroke', 'stroke-width', 'opacity'],
	'path': ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity'],
	'circle': ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity'],
	'line': ['stroke', 'stroke-width', 'stroke-dasharray', 'opacity'],
	'text': ['fill', 'font-size', 'text-anchor', 'opacity'],
	'polygon': ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity']
};

export function exportStyledSvgToBlob(svgElm) {
	var oDOM = svgElm.cloneNode(true);
	inlineStylesToSvgCopy(oDOM, svgElm, CONTAINER_ELEMENTS, RELEVANT_STYLES);

	var data = new XMLSerializer().serializeToString(oDOM);
	var svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
	return svg;
}
