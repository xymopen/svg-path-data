import { Parser, bind } from '.'

export const string = (string: string): Parser<string, string> =>
	next => {
		let i = 0;

		while (i < string.length) {
			const result = next()

			if (result.done) {
				throw new Error("Unexpected end of input")
			} else if (result.value !== string[i]) {
				throw new Error(`Expected "${string[i]}" but got "${result.value}"`)
			} else {
				i += 1
			}
		}

		return [next, string]
	}

export const concatString = (parser: Parser<string, string[]>): Parser<string, string> =>
	bind(parser, strings => Array.prototype.join.call(strings, ""))
