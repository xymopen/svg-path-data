
import { AllCommand, Command } from "."

const stringifyNumber = (current: number, previous?: number, optionalSeparator?: string): string => {
	if (previous == null) {
		return `${current}`
	} else if (previous >= 0 && current < 0) {
		// We are extra lucky that we can save an optional separator
		return `${current}`
	} else {
		return `${optionalSeparator}${current}`
	}
}

const stringifyCommandParameters = (current: AllCommand, previous?: AllCommand): string => {
	if (current.name === 'moveto') {
		return stringifyNumber(current.parameters[0]) +
			stringifyNumber(current.parameters[1], current.parameters[0], ',')
	} else if (current.name === 'closepath') {
		return ''
	} else if (current.name === 'lineto') {
		return stringifyNumber(current.parameters[0], (previous as Command<'moveto'> | Command<'lineto'>)?.parameters[1], ' ') +
			stringifyNumber(current.parameters[1], current.parameters[0], ',')
	} else if (current.name === 'horizontal_lineto') {
		return stringifyNumber(current.parameters, (previous as Command<'horizontal_lineto'>)?.parameters, ' ')
	} else if (current.name === 'vertical_lineto') {
		return stringifyNumber(current.parameters, (previous as Command<'vertical_lineto'>)?.parameters, ' ')
	} else if (current.name === 'curveto') {
		return stringifyNumber(current.parameters[0][0], (previous as Command<'curveto'>)?.parameters[2][1], ' ') +
			stringifyNumber(current.parameters[0][1], current.parameters[0][0], ',') +
			stringifyNumber(current.parameters[1][0], current.parameters[0][1], ' ') +
			stringifyNumber(current.parameters[1][1], current.parameters[1][0], ',') +
			stringifyNumber(current.parameters[2][0], current.parameters[1][1], ' ') +
			stringifyNumber(current.parameters[2][1], current.parameters[2][0], ',')
	} else if (current.name === 'smooth_curveto') {
		return stringifyNumber(current.parameters[0][0], (previous as Command<'smooth_curveto'>)?.parameters[1][1], ' ') +
			stringifyNumber(current.parameters[0][1], current.parameters[0][0], ',') +
			stringifyNumber(current.parameters[1][0], current.parameters[0][1], ' ') +
			stringifyNumber(current.parameters[1][1], current.parameters[1][0], ',')
	} else if (current.name === 'elliptical_arc') {
		return stringifyNumber(current.parameters.rxy[0], (previous as Command<'elliptical_arc'>)?.parameters.xy[1], ' ') +
			',' + current.parameters.rxy[1] +
			' ' + current.parameters.phi +
			' ' + (current.parameters.largeArcFlag ? '1' : '0') +
			' ' + (current.parameters.sweepFlag ? '1' : '0') +
			' ' + current.parameters.xy[0] +
			stringifyNumber(current.parameters.xy[1], current.parameters.xy[0], ',')
	} else {
		throw new TypeError('Unknown command')
	}
}

const stringifyCommand = (current: AllCommand, previous?: AllCommand): string => {
	if (
		previous != null && previous.absolute === current.absolute && (
			(previous.name !== 'moveto' && current.name === previous.name) ||
			(previous.name === 'moveto' && current.name === 'lineto')
		)) {
		// We are lucky that we can append arguments to previous command
		return stringifyCommandParameters(current, previous)
	} else {
		const name = (name => current.absolute ? name.toUpperCase() : name.toLowerCase())(
			current.name === 'moveto' ? 'M' :
			current.name === 'closepath' ? 'Z' :
			current.name === 'lineto' ? 'L' :
			current.name === 'horizontal_lineto' ? 'H' :
			current.name === 'vertical_lineto' ? 'V' :
			current.name === 'curveto' ? 'C' :
			current.name === 'smooth_curveto' ? 'S' :
			current.name === 'elliptical_arc' ? 'A' :
				(() => { throw new TypeError('Unknown command') })()
			)

		return name + stringifyCommandParameters(current)
	}
}

export default stringifyCommand
