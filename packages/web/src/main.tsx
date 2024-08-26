import { render } from "preact";
import App from "./App";

if (import.meta.nodeEnv === "development") {
	await import('preact/debug')
}

render(<App />, document.getElementById('root')!);
