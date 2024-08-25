import { bind, choose, is, repeat, seq, some, defaultsTo, anyOf, optional } from 'parser-combinators'
import { concatString } from 'parser-combinators/strings'

type Coordinate = [x: number, y: number]

const wsp = anyOf('\t', ' ', '\n', '\x0C', '\r')
const digit = anyOf('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')
const digitSequence = bind(some(digit), digits => digits.join(""))
const sign = anyOf('+', '-')
const exponent = concatString(
	seq(
		anyOf('E', 'e'),
		defaultsTo(sign, ''),
		digitSequence
	)
)
const fractionalConstant = concatString(
	choose(
		seq(
			defaultsTo(digitSequence, ''),
			is('.'),
			digitSequence
		),
		seq(digitSequence, is('.'))
	)
)
const floatingPointConstant = concatString(choose(
	seq(fractionalConstant, defaultsTo(exponent, '')),
	seq(digitSequence, exponent)
))
const integerConstant = digitSequence
const comma = is(',')
const commaWsp = bind(seq(choose(seq(some(wsp), optional(comma)), comma), repeat(wsp)), () => undefined)
const flag = anyOf('0', '1')
const number = concatString(seq(
	defaultsTo(sign, ''),
	choose(floatingPointConstant, integerConstant)
))
const nonNegativeNumber = choose(integerConstant, floatingPointConstant)
const coordinate = number
const coordinatePair = bind(
	seq(coordinate, optional(commaWsp), coordinate),
	([x, , y]) => [x, y] as [string, string]
)
