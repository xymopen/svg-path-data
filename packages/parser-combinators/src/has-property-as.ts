type InvertTypeofMap = {
	'string': string;
	'number': number;
	'bigint': bigint;
	'boolean': boolean;
	'undefined': undefined;
	'object': {};
	'function': ((this: any, ...args: any[]) => any) | (new (...args: any[]) => any);
}

const hasPropertyAs = <T, K extends PropertyKey, U extends keyof InvertTypeofMap>(value: T, key: K, type: U):
	value is Extract<T, { [P in K]: InvertTypeofMap[U] }> =>
	Reflect.has(Object(value), key) && typeof value[key as unknown as keyof T] === type

export default hasPropertyAs
