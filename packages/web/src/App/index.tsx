import { Component, JSX, Ref } from "preact";
import { useEffect, useRef } from "preact/hooks";
import ClevoLogo from "assets/Clevo_logo.svg";

function App() {
	const svgRef = useRef<typeof ClevoLogo>(null);

	useEffect(() => {
		if (svgRef.current != null) {
			// Preact will treat function component as class component at runtime
			const svg = (svgRef.current as unknown as Component<JSX.IntrinsicSVGElements["svg"]>).base as SVGSVGElement;
		}
	}, [svgRef]);

	return <ClevoLogo ref={svgRef as Ref<any>} />;
}

export default App;
