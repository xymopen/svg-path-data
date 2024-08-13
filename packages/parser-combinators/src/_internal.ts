/**
 * TypeScript needs a little help to distinguish `IteratorYieldResult`
 * from `IteratorReturnResult` as `done` is made optional on
 * `IteratorYieldResult`
 */
export const isDone = <T, TReturn>(result: IteratorResult<T, TReturn>):
	result is IteratorReturnResult<TReturn> => Boolean(result.done)

export const hasOrInheritsKey = <T, K extends PropertyKey>(obj: T, key: K): obj is (
	Extract<T, { [P in K]: any }> extends never ?
	T & { [P in K]: unknown } :
	Extract<T, { [P in K]: any }>
) =>
	Reflect.has(Object(obj), key)
