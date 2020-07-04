import {RowRendererBits} from "./bits.js";

export class RowRendererEnum extends RowRendererBits {
	select(typeInfo) {
		return typeInfo.name === "enum";
	}
    isValid(d) {
	    return d[1] != "";
    }
}