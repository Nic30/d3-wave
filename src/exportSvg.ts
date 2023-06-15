// https://stackoverflow.com/questions/15181452/how-to-save-export-inline-svg-styled-with-css-from-browser-to-image-file

function inlineStylesToSvgCopy(parentNode: SVGElement, origData: SVGElement,
	CONTAINER_ELEMENTS: string[],
	RELEVANT_STYLES: { [elmTag: string]: string[] }) {

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
	const children = parentNode.childNodes;
	const origChildDat = origData.childNodes;
	for (let cd = 0; cd < children.length; cd++) {
		const c = children[cd];
		inlineStylesToSvgCopy(c as SVGElement, origChildDat[cd] as SVGElement, CONTAINER_ELEMENTS, RELEVANT_STYLES);
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

export function exportStyledSvgToBlob(svgElm: SVGSVGElement) {
	const oDOM = svgElm.cloneNode(true);
	inlineStylesToSvgCopy(oDOM as SVGElement, svgElm, CONTAINER_ELEMENTS, RELEVANT_STYLES);

	const data = new XMLSerializer().serializeToString(oDOM);
	const svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
	return svg;
}
