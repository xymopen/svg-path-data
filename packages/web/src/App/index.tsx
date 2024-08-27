import { useEffect, useRef } from "preact/hooks";
import ClevoLogo from "assets/Clevo_logo.svg";
import { fromIt } from "parser-combinators";
import svgPath, { AllCommand } from "svg-path-data";
import stringifyCommand from "svg-path-data/stringify";

function App() {
	const divRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (divRef.current != null) {
			const svg = divRef.current.children[0] as SVGSVGElement;
			Array.prototype.forEach.call(svg.querySelectorAll("path"), (path: SVGPathElement) => {
				const pathData = path.getAttribute("d")!;
				const [remaining, svgPathData] = svgPath(fromIt(pathData));
				let s = '';
				let previous: AllCommand | undefined = undefined;
				for (let current of svgPathData) {
					s += stringifyCommand(current, previous);
					previous = current;
				}
				path.setAttribute('d', s);
				console.log(Array.from({ [Symbol.iterator]() { return { next: remaining } } }).join(''));
			});
		}
	}, [divRef]);

	return <div ref={divRef} dangerouslySetInnerHTML={{ __html: ClevoLogo }} />;
}

export default App;
