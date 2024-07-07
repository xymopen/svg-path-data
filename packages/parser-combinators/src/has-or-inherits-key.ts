const hasOrInheritsKey = <T, K extends PropertyKey>(obj: T, key: K): obj is Extract<T, { [P in K]: any }> =>
	Reflect.has(Object(obj), key)

export default hasOrInheritsKey
