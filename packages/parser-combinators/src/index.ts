import hasOrInheritsKey from "./has-or-inherits-key"

/**
 * TypeScript needs a little help to distinguish `IteratorYieldResult`
 * from `IteratorReturnResult` as `done` is made optional on
 * `IteratorYieldResult`
 */
const isDone = <T, TReturn>(result: IteratorResult<T, TReturn>):
	result is IteratorReturnResult<TReturn> => Boolean(result.done)

export type Input<T> = () => IteratorResult<T, void>

export type Parser<T, TReturn> = (next: Input<T>) => [Input<T>, TReturn]

export type ParserResultType<T extends Parser<unknown, any>> = T extends Parser<unknown, infer P> ? P : never

/**
 * Helper to convert an iterable or a iterator to an input
 */
export const fromIt = <T>(it: Iterable<T> | Iterator<T>): Input<T> => {
	if (hasOrInheritsKey(it, 'next')) {
		// Per the spec se, we don't check the type of `next` to tell
		// if it is an iterator, but `bind()` would check it anyway
		return Function.prototype.bind.call(it.next, it)
	} else {
		return fromIt(it[Symbol.iterator]())
	}
}

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

/**
 * Apply a transformation to the result of a parser
 */
export const bind = <T, U, V>(parser: Parser<T, U>, callbackfn: (value: U) => V): Parser<T, V> =>
	next => {
		const [nextNext, result] = parser(next)
		return [nextNext, callbackfn(result)]
	}

export const is = <T>(value: T): Parser<T, T> =>
	next => {
		const result = next()

		if (isDone(result)) {
			throw new Error("Unexpected end of input")
		} else if (result.value !== value) {
			throw new Error(`Expected "${value}" but got "${result.value}"`)
		} else {
			return [next, value]
		}
	}

export const anyOf = <T>(...values: T[]): Parser<T, T> =>
	next => {
		const result = next()

		if (isDone(result)) {
			throw new Error("Unexpected end of input")
		} else if (!values.includes(result.value)) {
			throw new Error(`Expected one of ${values} but got "${result.value}"`)
		} else {
			return [next, result.value]
		}
	}

export const defaultsTo = <T, TReturn>(parser: Parser<T, TReturn>, defaultValue: TReturn): Parser<T, TReturn> =>
	bind(optional(parser), result => hasOrInheritsKey(result, 'error') ? defaultValue : result.value)
