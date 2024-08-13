import { readFileSync } from "node:fs";
import { resolve as pathResolve } from "node:path";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";

const resolve = pathResolve.bind(undefined, import.meta.dirname);

const targets = readFileSync(resolve(".browserslistrc"), "utf8").split(/\r?\n|\r(?!\n)/g).filter(line => line.trim() !== "");
const EsSwcConfig = JSON.parse(readFileSync(resolve(".swc.ecmascript.swcrc"), "utf8"));
const TsSwcConfig = JSON.parse(readFileSync(resolve(".swc.typescript.swcrc"), "utf8"));

const config = defineConfig({
	entry: {
		composed: "./src/composed.ts",
		core: "./src/core.ts",
		index: "./src/index.ts",
		strings: "./src/strings.ts",
		types: "./src/types.ts",
		utils: "./src/utils.ts"
	},
	output: {
		filename: '[name].js',
		library: {
			type: 'module'
		},
		module: true,
		path: 'dist'
	},
	module: {
		rules: [
			{
				test: /\.svg$/,
				type: "asset"
			},
			{
				test: /\.js$/,
				use: [
					{
						loader: "builtin:swc-loader",
						options: {
							...EsSwcConfig,
							env: {
								...EsSwcConfig.env,
								targets
							}
						}
					}
				]
			},
			{
				test: /\.ts$/,
				use: [
					{
						loader: "builtin:swc-loader",
						options: {
							...TsSwcConfig,
							env: {
								...TsSwcConfig.env,
								targets
							}
						}
					}
				]
			}
		]
	},
	plugins: [
		new rspack.ProgressPlugin({})
	],
	optimization: {
		runtimeChunk: 'single',
		splitChunks: {
			chunks: 'all',
			minSize: 0
		}
	},
	experiments: {
		outputModule: true
	},
	resolve: {
		extensions: [".js", ".json", ".ts", ".wasm"]
	}
});

/**
 * @param {Env | undefined} env
 * @param {Record<string, any> & { env: Env }} argv
 * @returns {import("@rspack/core").RspackOptions}
 */
export default (env, argv) => {
	if (argv.nodeEnv === 'production') {
		config.devtool = false
	}

	if (argv.nodeEnv === 'development') {
		config.devtool = "source-map"
	}

	return config;
}

/**
 * @typedef Env
 * @property {boolean} [RSPACK_BUNDLE]
 * @property {boolean} [RSPACK_BUILD]
 * @property {boolean} [RSPACK_WATCH]
 */
