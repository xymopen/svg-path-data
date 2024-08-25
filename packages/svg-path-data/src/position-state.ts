import { AllCommand, Coordinate } from "."

export type State = [currentPoint: Coordinate, initialPoint: Coordinate]

export const initialize = (): State => [[0, 0], [0, 0]]

/**
 * @param cp current point
 * @param ip initial point
 */
export const advance = ([cp, ip]: State, command: AllCommand): State => {
	if (command.name === 'moveto') {
		if (command.absolute) {
			return [
				[command.parameters[0], command.parameters[1]],
				[...cp],
			]
		} else {
			return [
				[
					cp[0] + command.parameters[0],
					cp[1] + command.parameters[1]
				],
				[...cp]
			]
		}
	} else if (command.name === 'closepath') {
		return [
			[...ip],
			[...ip],
		]
	} else if (command.name === 'lineto') {
		if (command.absolute) {
			return [
				[command.parameters[0], command.parameters[1]],
				[...ip],
			]
		} else {
			return [
				[
					cp[0] + command.parameters[0],
					cp[1] + command.parameters[1]
				],
				[...ip]
			]
		}
	} else if (command.name === 'horizontal_lineto') {
		if (command.absolute) {
			return [
				[command.parameters, cp[1]],
				[...ip],
			]
		} else {
			return [
				[
					cp[0] + command.parameters,
					cp[1]
				],
				[...ip]
			]
		}
	} else if (command.name === 'vertical_lineto') {
		if (command.absolute) {
			return [
				[cp[0], command.parameters],
				[...ip],
			]
		} else {
			return [
				[
					cp[0],
					cp[1] + command.parameters
				],
				[...ip]
			]
		}
	} else if (command.name === 'curveto') {
		if (command.absolute) {
			return [
				[command.parameters[2][0], command.parameters[2][1]],
				[...ip]
			]
		} else {
			return [
				[
					cp[0] + command.parameters[2][0],
					cp[1] + command.parameters[2][1]
				],
				[...ip]
			]
		}
	} else if (command.name === 'smooth_curveto') {
		if (command.absolute) {
			return [
				[command.parameters[1][0], command.parameters[1][1]],
				[...ip]
			]
		} else {
			return [
				[
					cp[0] + command.parameters[1][0],
					cp[1] + command.parameters[1][1]
				],
				[...ip]
			]
		}
	} else if (command.name === 'quadratic_bezier_curveto') {
		if (command.absolute) {
			return [
				[command.parameters[1][0], command.parameters[1][1]],
				[...ip]
			]
		} else {
			return [
				[
					cp[0] + command.parameters[1][0],
					cp[1] + command.parameters[1][1]
				],
				[...ip]
			]
		}
	} else if (command.name === 'smooth_quadratic_bezier_curveto') {
		if (command.absolute) {
			return [
				[command.parameters[0], command.parameters[1]],
				[...ip]
			]
		} else {
			return [
				[
					cp[0] + command.parameters[0],
					cp[1] + command.parameters[1]
				],
				[...ip]
			]
		}
	} else if (command.name === 'elliptical_arc') {
		if (command.absolute) {
			return [
				[command.parameters.xy[0], command.parameters.xy[1]],
				[...ip]
			]
		} else {
			return [
				[
					cp[0] + command.parameters.xy[0],
					cp[1] + command.parameters.xy[1]
				],
				[...ip]
			]
		}
	} else {
		throw new Error('Unknown command')
	}
}
