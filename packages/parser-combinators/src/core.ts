import { isDone } from "./_internal"
import { Parser, Input } from "./types"

/**
 * Consume input with parsers sequentially
 *
 * return all their results as a tuple
 */
export const seq = <T, TReturns extends any[]>(
	...parsers: { [P in keyof TReturns]: Parser<T, TReturns[P]> }
): Parser<T, { [P in keyof TReturns]: TReturns[P] }> =>
	next => {
		let results = [] as Partial<{ [P in keyof TReturns]: TReturns[P] }>

		for (let i = 0; i < parsers.length; i += 1) {
			const parser = parsers[i]
			const [nextNext, result] = parser(next)
			results[i] = result
			next = nextNext
		}

		return [next, results as Required<typeof results>]
	}

/**
 * Returns the result from the parser consume the most input
 */
export const choose = <T, TReturns extends any[]>(
	...parsers: { [P in keyof TReturns]: Parser<T, TReturns[P]> }
): Parser<T, TReturns[Extract<keyof TReturns, number>]> =>
	next => {
		const buffer: T[] = []
		let candidate: [Input<T>, TReturns[Extract<keyof TReturns, number>]] | null = null
		let longestConsumed = 0
		const errors: any[] = []

		for (let i = 0; i < parsers.length; i += 1) {
			const parser = parsers[i]

			let j = 0;

			try {
				const [nextNext, value] = parser(() => {
					if (j < buffer.length) {
						let result: IteratorYieldResult<T> = { done: false, value: buffer[j], }

						j += 1

						return result
					} else {
						const result = next()

						if (!isDone(result)) {
							buffer.push(result.value)
							j += 1
						}

						return result
					}
				})

				if (j > longestConsumed) {
					candidate = [nextNext, value]
					longestConsumed = j
				}
			} catch (error) {
				errors[i] = error
			}
		}

		if (candidate != null) {
			return candidate
		} else {
			throw new AggregateError(errors)
		}
	}

/**
 * Match input with a parser once or not at all
 */
export const optional = <T, TReturn>(parser: Parser<T, TReturn>): Parser<T, { value: TReturn } | { error: any }> =>
	next => {
		const buffer: T[] = []

		try {
			const [nextNext, value] = parser(() => {
				const result = next()

				if (!isDone(result)) {
					buffer.push(result.value)
				}

				return result
			})

			return [nextNext, { value }]
		} catch (error) {
			let i = 0;

			return [() => {
				if (i < buffer.length) {
					const value = buffer[i]
					i += 1
					return { done: false, value }
				} else {
					return next()
				}
			}, { error }]
		}
	}

/**
 * Apply a transformation to the result of a parser
 */
export const bind = <T, U, V>(parser: Parser<T, U>, callbackfn: (value: U) => V): Parser<T, V> =>
	next => {
		const [nextNext, result] = parser(next)
		return [nextNext, callbackfn(result)]
	}
