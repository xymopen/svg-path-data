import { AllCommand } from "./packages/path-data"
import { State } from "./position-state"

const rewriteAbsolute = <T extends AllCommand>(command: T, [cp]: State): T => {
	if (!command.absolute) {
		return { ...command }
	} else {
		switch (command.name) {
			case 'moveto':
				return command
				// return {
				// 	...command,
				// 	absolute: false,
				// 	parameters: [
				// 		command.parameters[0] - cp[0],
				// 		command.parameters[1] - cp[1],
				// 	]
				// }
			case 'lineto':
				return {
					...command,
					absolute: false,
					parameters: [
						command.parameters[0] - cp[0],
						command.parameters[1] - cp[1],
					]
				}
			case 'horizontal_lineto':
				return {
					...command,
					absolute: false,
					parameters: command.parameters - cp[0]
				}
			case 'vertical_lineto':
				return {
					...command,
					absolute: false,
					parameters: command.parameters - cp[1]
				}
			case 'curveto':
				return {
					...command,
					absolute: false,
					parameters: [
						[
							command.parameters[0][0] - cp[0],
							command.parameters[0][1] - cp[1],
						],
						[
							command.parameters[1][0] - cp[0],
							command.parameters[1][1] - cp[1],
						],
						[
							command.parameters[2][0] - cp[0],
							command.parameters[2][1] - cp[1],
						]

					]
				}
			case 'smooth_curveto':
				return {
					...command,
					absolute: false,
					parameters: [
						[
							command.parameters[0][0] - cp[0],
							command.parameters[0][1] - cp[1],
						],
						[
							command.parameters[1][0] - cp[0],
							command.parameters[1][1] - cp[1],
						]
					]
				}
			case 'quadratic_bezier_curveto':
				return {
					...command,
					absolute: false,
					parameters: [
						[
							command.parameters[0][0] - cp[0],
							command.parameters[0][1] - cp[1],
						],
						[
							command.parameters[1][0] - cp[0],
							command.parameters[1][1] - cp[1],
						]
					]
				}
			case 'smooth_quadratic_bezier_curveto':
				return {
					...command,
					absolute: false,
					parameters: [
						command.parameters[0] - cp[0],
						command.parameters[1] - cp[1],
					]
				}
			case 'elliptical_arc':
				return {
					...command,
					absolute: false,
					parameters: {
						rxy: command.parameters.rxy,
						phi: command.parameters.phi,
						largeArcFlag: command.parameters.largeArcFlag,
						sweepFlag: command.parameters.sweepFlag,
						xy: [
							command.parameters.xy[0] - cp[0],
							command.parameters.xy[1] - cp[1],
						],
					}

				}
			default: {
				throw new TypeError('Unknown command')
			}
		}
	}
}

export default rewriteAbsolute
