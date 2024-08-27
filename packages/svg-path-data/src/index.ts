import { bind, choose, is, repeat, seq, some, defaultsTo, anyOf, optional } from 'parser-combinators'
import { concatString } from 'parser-combinators/strings'

export type Coordinate = [x: number, y: number]

interface CommandName {
	moveto: 'moveto'
	closepath: 'closepath'
	lineto: 'lineto'
	horizontal_lineto: 'horizontal_lineto'
	vertical_lineto: 'vertical_lineto'
	curveto: 'curveto'
	smooth_curveto: 'smooth_curveto'
	quadratic_bezier_curveto: 'quadratic_bezier_curveto'
	smooth_quadratic_bezier_curveto: 'smooth_quadratic_bezier_curveto'
	elliptical_arc: 'elliptical_arc'
}

interface CommandParameters {
	moveto: Coordinate
	lineto: Coordinate
	horizontal_lineto: number
	vertical_lineto: number
	curveto: [coordinate1: Coordinate, coordinate2: Coordinate, coordinate: Coordinate]
	smooth_curveto: [coordinate2: Coordinate, coordinate: Coordinate]
	quadratic_bezier_curveto: [coordinate1: Coordinate, coordinate: Coordinate]
	smooth_quadratic_bezier_curveto: Coordinate
	elliptical_arc: {
		rxy: Coordinate,
		phi: number,
		largeArcFlag: boolean,
		sweepFlag: boolean,
		xy: Coordinate
	}
}

interface BasicCommand<C extends keyof CommandName> {
	name: C,
	absolute: boolean,
}

interface ParameterizedCommand<C extends keyof CommandParameters> extends BasicCommand<C> {
	parameters: CommandParameters[C],
}

interface LinetoCommand extends ParameterizedCommand<CommandName['lineto']> {
	implicit: boolean
}

export type Command<C extends keyof CommandName> =
	C extends CommandName['lineto'] ? LinetoCommand :
	C extends keyof CommandParameters ? ParameterizedCommand<C> :
	BasicCommand<C>

export type AllCommand = Command<keyof CommandName>

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

const ellipticalArcArgument = bind(
	seq(
		nonNegativeNumber,
		optional(commaWsp),
		nonNegativeNumber,
		optional(commaWsp),
		number,
		commaWsp,
		flag,
		optional(commaWsp),
		flag,
		optional(commaWsp),
		coordinatePair
	),
	([rx, , ry, , phi, , largeArcFlag, , sweepFlag, , xy]) => ({
		rxy: [rx, ry], phi, largeArcFlag, sweepFlag, xy
	})
)

const ellipticalArc = bind(
	seq(
		anyOf('A', 'a'),
		repeat(wsp),
		ellipticalArcArgument,
		repeat(seq(optional(commaWsp), ellipticalArcArgument)),
	),
	([ellipticalArc, , head, tail]) => [
		{
			name: 'elliptical_arc',
			parameters: {
				rxy: head.rxy.map(coordinate => Number(coordinate)) as [number, number],
				phi: Number(head.phi),
				largeArcFlag: head.largeArcFlag === '1',
				sweepFlag: head.sweepFlag === '1',
				xy: [Number(head.xy[0]), Number(head.xy[1])] as [number, number]
			},
			absolute: ellipticalArc === 'A'
		} satisfies Command<'elliptical_arc'>,
		...tail.map(([_, ellipticalArcArgument]) => ({
			name: 'elliptical_arc',
			parameters: {
				rxy: ellipticalArcArgument.rxy.map(coordinate => Number(coordinate)) as [number, number],
				phi: Number(ellipticalArcArgument.phi),
				largeArcFlag: ellipticalArcArgument.largeArcFlag === '1',
				sweepFlag: ellipticalArcArgument.sweepFlag === '1',
				xy: [Number(ellipticalArcArgument.xy[0]), Number(ellipticalArcArgument.xy[1])] as [number, number]
			},
			absolute: ellipticalArc === 'A'
		} satisfies Command<'elliptical_arc'>))
	]
)

const smoothQuadraticBezierCurveto = bind(
	seq(
		anyOf('T', 't'),
		repeat(wsp),
		coordinatePair,
		repeat(seq(optional(commaWsp), coordinatePair)),
	),
	([smoothQuadraticBezierCurveto, , head, tail]) => [
		{
			name: 'smooth_quadratic_bezier_curveto',
			parameters: head.map(coordinate => Number(coordinate)) as [number, number],
			absolute: smoothQuadraticBezierCurveto === 'T'
		} satisfies Command<'smooth_quadratic_bezier_curveto'>,
		...tail.map(([_, xy]) => ({
			name: 'smooth_quadratic_bezier_curveto',
			parameters: xy.map(coordinate => Number(coordinate)) as [number, number],
			absolute: smoothQuadraticBezierCurveto === 'T'
		} satisfies Command<'smooth_quadratic_bezier_curveto'>))
	]
)

const quadraticBezierCurvetoArgument = bind(
	seq(coordinatePair, optional(commaWsp), coordinatePair),
	([coordinate1, , coordinate]) => [coordinate1, coordinate]
)

const quadraticBezierCurveto = bind(
	seq(
		anyOf('Q', 'q'),
		repeat(wsp),
		quadraticBezierCurvetoArgument,
		repeat(seq(optional(commaWsp), quadraticBezierCurvetoArgument)),
	),
	([quadraticBezierCurveto, , head, tail]) => [
		{
			name: 'quadratic_bezier_curveto',
			parameters: head
				.map(([x, y]) => [Number(x), Number(y)] as [number, number]) as
				[[number, number], [number, number]],
			absolute: quadraticBezierCurveto === 'Q'
		} satisfies Command<'quadratic_bezier_curveto'>,
		...tail.map(([_, quadraticBezierCurvetoArgument]) => ({
			name: 'quadratic_bezier_curveto',
			parameters: quadraticBezierCurvetoArgument
				.map(([x, y]) => [Number(x), Number(y)] as [number, number]) as
				[[number, number], [number, number]],
			absolute: quadraticBezierCurveto === 'Q'
		} satisfies Command<'quadratic_bezier_curveto'>))
	]
)

const smoothCurvetoArgument = bind(
	seq(coordinatePair, optional(commaWsp), coordinatePair),
	([xy2, , xy]) => [xy2, xy]
)

const smoothCurveto = bind(
	seq(
		anyOf('S', 's'),
		repeat(wsp),
		smoothCurvetoArgument,
		repeat(seq(optional(commaWsp), smoothCurvetoArgument)),
	),
	([smoothCurveto, , head, tail]) => [
		{
			name: 'smooth_curveto',
			parameters: head
				.map(([x, y]) => [Number(x), Number(y)] as [number, number]) as
				[[number, number], [number, number]],
			absolute: smoothCurveto === 'S'
		} satisfies Command<'smooth_curveto'>,
		...tail.map(([_, smoothCurvetoArgument]) => ({
			name: 'smooth_curveto',
			parameters: smoothCurvetoArgument
				.map(([x, y]) => [Number(x), Number(y)] as [number, number]) as
				[[number, number], [number, number]],
			absolute: smoothCurveto === 'S'
		} satisfies Command<'smooth_curveto'>))
	]
)

const curvetoArgument = bind(
	seq(coordinatePair, optional(commaWsp), coordinatePair, optional(commaWsp), coordinatePair),
	([xy1, , xy2, , xy]) => [xy1, xy2, xy]
)

const curveto = bind(
	seq(
		anyOf('C', 'c'),
		repeat(wsp),
		curvetoArgument,
		repeat(seq(optional(commaWsp), curvetoArgument)),
	),
	([curveto, , curvetoArgument, curvetoArgumentSequence]) => [
		{
			name: 'curveto',
			parameters: curvetoArgument
				.map(([x, y]) => [Number(x), Number(y)] as [number, number]) as
				[[number, number], [number, number], [number, number]],
			absolute: curveto === 'C'
		} satisfies Command<'curveto'>,
		...curvetoArgumentSequence.map(([_, curvetoArgument]) => ({
			name: 'curveto',
			parameters: curvetoArgument
				.map(([x, y]) => [Number(x), Number(y)] as [number, number]) as
				[[number, number], [number, number], [number, number]],
			absolute: curveto === 'C'
		} satisfies Command<'curveto'>))
	]
)

const verticalLineto = bind(
	seq(
		anyOf('V', 'v'),
		repeat(wsp),
		coordinate,
		repeat(seq(optional(commaWsp), coordinate)),
	),
	([verticalLineto, , y, ys]) => [
		{
			name: 'vertical_lineto',
			parameters: Number(y),
			absolute: verticalLineto === 'V',
		} satisfies Command<'vertical_lineto'>,
		...ys.map(([_, y]) => ({
			name: 'vertical_lineto',
			parameters: Number(y),
			absolute: verticalLineto === 'V',
		} satisfies Command<'vertical_lineto'>))
	]
)

const horizontalLineto = bind(
	seq(
		anyOf('H', 'h'),
		repeat(wsp),
		coordinate,
		repeat(seq(optional(commaWsp), coordinate)),
	),
	([horizontalLineto, , x, xs]) => [
		{
			name: 'horizontal_lineto',
			parameters: Number(x),
			absolute: horizontalLineto === 'H',
		} satisfies Command<'horizontal_lineto'>,
		...xs.map(([_, x]) => ({
			name: 'horizontal_lineto',
			parameters: Number(x),
			absolute: horizontalLineto === 'H',
		} satisfies Command<'horizontal_lineto'>))
	]
)

const linetoArgumentSequence = bind(
	seq(
		coordinatePair,
		repeat(seq(optional(commaWsp), coordinatePair)),
	),
	([head, tail = []]) => [head, ...tail.map(([, xy]) => xy)]
)

const lineto = bind(
	seq(
		anyOf('L', 'l'),
		repeat(wsp),
		linetoArgumentSequence,
	),
	([lineto, , linetoArgumentSequence]) => linetoArgumentSequence.map(xy => ({
		name: 'lineto',
		parameters: xy.map(coordinate => Number(coordinate)) as [number, number],
		absolute: lineto === 'L',
		implicit: false
	} satisfies Command<'lineto'>))
)

const closepath = bind(anyOf('Z', 'z'), (closepath) => [{
	name: 'closepath',
	absolute: closepath === 'Z'
} satisfies Command<'closepath'>])

const moveto = bind(
	seq(
		anyOf('M', 'm'),
		repeat(wsp),
		coordinatePair,
		defaultsTo(
			bind(
				seq(
					optional(commaWsp),
					linetoArgumentSequence
				),
				([, linetoArgumentSequence]) => linetoArgumentSequence
			),
			[]
		)
	),
	([moveto, , xys, linetoArgumentSequence]) => [
		{
			name: 'moveto',
			parameters: xys.map(xy => Number(xy)) as [number, number],
			absolute: moveto === 'M'
		} satisfies Command<'moveto'>,
		...linetoArgumentSequence.map(xy => ({
			name: 'lineto',
			parameters: xy.map(coordinate => Number(coordinate)) as [number, number],
			absolute: moveto === 'M',
			implicit: true
		} satisfies Command<'lineto'>))
	]
)

const drawtoCommand = choose(
	closepath,
	lineto,
	horizontalLineto,
	verticalLineto,
	curveto,
	smoothCurveto,
	quadraticBezierCurveto,
	smoothQuadraticBezierCurveto,
	ellipticalArc,
)

const movetoDrawtoCommandGroup = bind(
	seq(
		moveto,
		repeat(wsp),
		defaultsTo(
			bind(
				seq(
					drawtoCommand,
					bind(
						repeat(seq(repeat(wsp), drawtoCommand)),
						drawtoCommands => drawtoCommands.map(([_, drawtoCommand]) => drawtoCommand)
					)
				),
				([head, tail]) => tail.reduce((init, last) => init.concat(last), head)
			),
			[]
		)
	),
	([moveto, _, drawtoCommands]) => [...moveto, ...drawtoCommands]
)

const movetoDrawtoCommandGroups = bind(
	seq(
		movetoDrawtoCommandGroup,
		defaultsTo(
			bind(
				repeat(seq(repeat(wsp), movetoDrawtoCommandGroup)),
				movetoDrawtoCommandGroups => movetoDrawtoCommandGroups.map(([_, movetoDrawtoCommandGroup]) => movetoDrawtoCommandGroup)
			),
			[]
		)
	),
	([head, tail]) => tail.reduce((init, last) => init.concat(last), head)
)

const svgPath = bind(seq(repeat(wsp), defaultsTo(movetoDrawtoCommandGroups, []), repeat(wsp)), ([_1, svgPath, _2]) => svgPath)

export default svgPath
