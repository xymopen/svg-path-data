// CSS modules
type CSSModuleClasses = { readonly [key: string]: string };

declare module "*.module.css" {
	const classes: CSSModuleClasses;
	export default classes;
}

// CSS
declare module "*.css" {
	/**
	 * @deprecated Use `import style from './style.css?inline'` instead.
	 */
	const css: string;
	export default css;
}

// images
// .svg would be transform to a function component by svgr
declare module "*.svg" {
	import { JSX } from "preact"
	export default function (props: JSX.IntrinsicSVGElements["svg"]): JSX.Element
}
