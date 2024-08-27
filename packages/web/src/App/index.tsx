import { Component, JSX, Ref } from "preact";
import { useEffect, useRef } from "preact/hooks";
import ClevoLogo from "assets/Clevo_logo.svg";
import { fromIt } from "parser-combinators";
import svgPath from "svg-path-data";

function App() {
	const svgRef = useRef<typeof ClevoLogo>(null);

	useEffect(() => {
		if (svgRef.current != null) {
			// Preact will treat function component as class component at runtime
			const svg = (svgRef.current as unknown as Component<JSX.IntrinsicSVGElements["svg"]>).base as SVGSVGElement;
			Array.prototype.forEach.call(svg.querySelectorAll("path"), (path: SVGPathElement) => {
				const pathData = path.getAttribute("d")!;
				const [remaining, svgPathData] = svgPath(fromIt(pathData));
				console.log(Array.from({ [Symbol.iterator]() { return { next: remaining } } }).join(''));
			});
		}
	}, [svgRef]);

	return <ClevoLogo ref={svgRef as Ref<any>} />;
}

export default App;
