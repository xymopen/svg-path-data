export type Input<T> = () => IteratorResult<T, void>

export type Parser<T, TReturn> = (next: Input<T>) => [Input<T>, TReturn]

export type ParserResultType<T extends Parser<unknown, any>> = T extends Parser<unknown, infer P> ? P : never
