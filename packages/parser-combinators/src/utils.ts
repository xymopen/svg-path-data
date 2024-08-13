import { isDone } from "./_internal"
import { Parser } from "./types"

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
