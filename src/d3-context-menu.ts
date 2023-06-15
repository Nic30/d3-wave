// https://github.com/patorjk/d3-context-menu v1.1.2 modified to be bundable
import * as d3 from 'd3';
import './d3-context-menu.css';


declare type ValOrGetter<T, retT> = retT | ((menu: ContextMenu<T>, elment: SVGGElement, data: ContextMenuItem<T>, index: number) => retT);

export class ContextMenuItem<T> {
	title: ValOrGetter<T, string>;
	data: T;
	children: ValOrGetter<T, ContextMenuItem<any>[]>;
	divider: ValOrGetter<T, boolean>;
	disabled: ValOrGetter<T, boolean>;
	action: null | ((menu: ContextMenu<T>, elment: SVGGElement, data: ContextMenuItem<T>, index: number) => void);

	constructor(
		title: ValOrGetter<T, string>,
		data: T,
		children: ValOrGetter<T, ContextMenuItem<any>[]>,
		divider: ValOrGetter<T, boolean>,
		disabled: ValOrGetter<T, boolean>,
		action: null | ((menu: ContextMenu<T>, elment: SVGGElement,  data: ContextMenuItem<T>, index: number) => void),
		) {
		this.title = title;
		this.children = children;
		this.divider = divider;
		this.disabled = disabled;
		this.action = action;
		this.data = data;
	}
};

export class LeftTop {
	left: number;
	top: number;
	constructor(left: number, top: number) {
		this.left = left;
		this.top = top;
	}
}

let ContextMenu_currentlyShownInstance: ContextMenu<any> | null = null;

export class ContextMenu<T> {

	constructor() {
	}
	//public static noop() { }

	public static isFn(value: any): boolean {
		return typeof value === 'function';
	}

	//public static const(value: any): () => any {
	//	return function() { return value; };
	//}

	//public static toFactory<T>(value: T, fallback: T): T {
	//	value = (value === undefined) ? fallback : value;
	//	return ContextMenu.isFn(value) ? value : ContextMenu.const(value) as T;
	//}
	getMenuItems(d: ContextMenuItem<T>): ContextMenuItem<any>[] {
		throw new Error("Override this method in your implementation of this class");
	}

	onOpen(element: SVGGElement, data: T): boolean {
		return true;
	}
	onClose() {
	}
	getTheme(element: SVGGElement, data: T) {
		return 'd3-context-menu-theme';
	}
	getPosition(element: SVGGElement, data: T): LeftTop | undefined {
		return undefined;
	}

	closeMenu() {
		// global state is populated if a menu is currently opened
		if (ContextMenu_currentlyShownInstance) {
			d3.select('.d3-context-menu').remove();
			d3.select('body').on('mousedown.d3-context-menu', null);
			ContextMenu_currentlyShownInstance.onClose();
			ContextMenu_currentlyShownInstance = null;
		}
	}

	/**
	 * Context menu event handler
	 * @param {*} data
	 */
	render(element: SVGGElement, ev: any, data: T) {
		// close any menu that's already opened
		this.closeMenu();

		// store close callback already bound to the correct args and scope
		ContextMenu_currentlyShownInstance = this;

		// create the div element that will hold the context menu
		d3.selectAll('.d3-context-menu').data([new ContextMenuItem("", data, [], false, false, null)])
			.enter()
			.append('div')
			.attr('class', 'd3-context-menu ' + this.getTheme(element, data));

		const closeMenu = this.closeMenu.bind(this)
		// close menu on mousedown outside
		d3.select('body').on('mousedown.d3-context-menu', closeMenu);
		d3.select('body').on('click.d3-context-menu', closeMenu);

		const parent = d3.selectAll('.d3-context-menu')
			.on('contextmenu', function (ev) {
				closeMenu();
				ev.preventDefault();
				ev.stopPropagation();
			})
			.append('ul');

		parent.call(this._renderNestedMenu.bind(this), element);

		// the openCallback allows an action to fire before the menu is displayed
		// an example usage would be closing a tooltip
		if (this.onOpen(element, data) === false) {
			return;
		}

		// Use this if you want to align your menu from the containing element, otherwise aligns towards center of window
		//console.log(this.parentNode.parentNode.parentNode);//.getBoundingClientRect());

		// get position
		const position = this.getPosition(element, data);

		const doc = document.documentElement;
		const pageWidth = window.innerWidth || doc.clientWidth;
		const pageHeight = window.innerHeight || doc.clientHeight;

		let horizontalAlignment = 'left';
		let horizontalAlignmentReset = 'right';
		let horizontalValue = position ? position.left : ev.pageX - 2;
		if (ev.pageX > pageWidth / 2) {
			horizontalAlignment = 'right';
			horizontalAlignmentReset = 'left';
			horizontalValue = position ? pageWidth - position.left : pageWidth - ev.pageX - 2;
		}


		let verticalAlignment = 'top';
		let verticalAlignmentReset = 'bottom';
		let verticalValue = position ? position.top : ev.pageY - 2;
		if (ev.pageY > pageHeight / 2) {
			verticalAlignment = 'bottom';
			verticalAlignmentReset = 'top';
			verticalValue = position ? pageHeight - position.top : pageHeight - ev.pageY - 2;
		}

		// display context menu
		d3.select('.d3-context-menu')
			.style(horizontalAlignment, (horizontalValue) + 'px')
			.style(horizontalAlignmentReset, null)
			.style(verticalAlignment, (verticalValue) + 'px')
			.style(verticalAlignmentReset, null)
			.style('display', 'block');

		ev.preventDefault();
		ev.stopPropagation();
	}

	_renderNestedMenu(parent: d3.Selection<HTMLUListElement, any, any, any>, root: SVGGElement, depth: number = 0) {
		const _this = this;
		function resolve<retT> (value: ValOrGetter<T, retT>, data: ContextMenuItem<T>, index: number) : retT {
			if (ContextMenu.isFn(value)) {
				const valFn = value as ((menu: ContextMenu<T>, elment: SVGGElement, data: ContextMenuItem<any>, index: number) => retT);
				return valFn(_this, root, data, index);
			} else {
				return value as retT;
			}
		};
		const closeMenu = this.closeMenu.bind(this)

		parent.selectAll('li')
			.data((d: ContextMenuItem<any>) => {
				if (depth == 0) {
					return _this.getMenuItems(d as ContextMenuItem<T>);
				} else {
				    return resolve<ContextMenuItem<any>[]>(d.children, d as ContextMenuItem<any>, 0);
				}
			})
			.enter()
			.append('li')
			.each(function (d: ContextMenuItem<T>, i: number) {
				// get value of each data
				var isDivider = !!resolve(d.divider, d, i);
				var isDisabled = !!resolve(d.disabled, d, i);
				var hasChildren = resolve(d.children, d, i).length != 0;
				var hasAction = !!d.action;
				var text = isDivider ? '<hr/>' : resolve(d.title, d, i);

				var listItem = d3.select<HTMLLIElement, ContextMenuItem<any>>(this)
					.classed('is-divider', isDivider)
					.classed('is-disabled', isDisabled)
					.classed('is-header', !hasChildren && !hasAction)
					.classed('is-parent', hasChildren)
					.html(text)
					.on('click', function (this: HTMLLIElement, ev: any, data: ContextMenuItem<any>) {
						// do nothing if disabled or no action
						if (isDisabled || !hasAction) return;
						if (!d.action)
							return;
						d.action(_this, root, data, 0);
						closeMenu();
					});

				if (!isDisabled && hasChildren) {
					// create children(`next parent`) and call recursive
					var children = listItem.append('ul')
						.classed('is-children', true);
					_this._renderNestedMenu(children, root, ++depth)
				}
			});
	}
}
