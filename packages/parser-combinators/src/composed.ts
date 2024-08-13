import { hasOrInheritsKey } from "./_internal"
import { optional, bind } from "./core"
import { Parser } from "./types"

/**
 * Match input with the parser repeatly
 */
export const repeat = <T, TReturn>(parser: Parser<T, TReturn>): Parser<T, TReturn[]> =>
	next => {
		const results: TReturn[] = []

		while (true) {
			const [nextNext, result] = optional(parser)(next)
			next = nextNext

			if (hasOrInheritsKey(result, 'error')) {
				break
			} else {
				results.push(result.value)
			}
		}

		return [next, results]
	}

/**
 * Match input with the parser at least once
 */
export const some = <T, TReturn>(parser: Parser<T, TReturn>): Parser<T, TReturn[]> =>
	next => {
		const [nextNext, head] = parser(next)
		const [next2Next, tail] = repeat(parser)(nextNext)
		return [next2Next, [head, ...tail]]
	}

export const defaultsTo = <T, TReturn>(parser: Parser<T, TReturn>, defaultValue: TReturn): Parser<T, TReturn> =>
	bind(optional(parser), result => hasOrInheritsKey(result, 'error') ? defaultValue : result.value)
