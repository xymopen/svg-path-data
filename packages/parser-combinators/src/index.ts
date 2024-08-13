import { hasOrInheritsKey } from "./_internal"
import { Input } from "./types"

export * from "./core"
export * from "./utils"
export * from "./composed"
export * from "./types"

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
