import { readFileSync } from "node:fs";
import { resolve as pathResolve } from "node:path";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import PreactRefreshPlugin from "@rspack/plugin-preact-refresh";

const resolve = pathResolve.bind(undefined, import.meta.dirname);

const targets = readFileSync(resolve(".browserslistrc"), "utf8").split(/\r?\n|\r(?!\n)/g).filter(line => line.trim() !== "");
const EsSwcConfig = JSON.parse(readFileSync(resolve(".swc.ecmascript.swcrc"), "utf8"));
const TsSwcConfig = JSON.parse(readFileSync(resolve(".swc.typescript.swcrc"), "utf8"));

const config = defineConfig({
	entry: {
		main: "./src/main.tsx"
	},
	module: {
		rules: [
			{
				test: /\.svg$/,
				issuer: {
					not: /\.[jt]sx?$/
				},
				type: "asset"
			},
			{
				test: /\.svg$/,
				issuer: /\.[jt]sx?$/,
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
					},
					{
						loader: "@svgr/webpack",
						options: /** @type {SvgrLoaderOption} */ ({
							babel: false,
							runtimeConfig: true
						})
					}
				],
			},
			{
				test: /\.jsx?$/,
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
				test: /\.tsx?$/,
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
	experiments: {
		css: true
	},
	resolve: {
		extensions: [".js", ".jsx", ".json", ".ts", ".tsx", ".wasm"],
		alias: {
			"assets": resolve("assets")
		}
	}
});

/**
 * @param {Env | undefined} env
 * @param {Record<string, any> & { env: Env }} argv
 * @returns {import("@rspack/core").RspackOptions}
 */
export default (env, argv) => {
	const plugins = /** @type {(import("@rspack/core").RspackPluginInstance | import("@rspack/core").RspackPluginFunction)[]} */ (config.plugins)

	plugins.push(new rspack.DefinePlugin({
		"import.meta.nodeEnv": JSON.stringify(process.env.NODE_ENV)
	}))

	if (argv.nodeEnv === 'production') {
		config.devtool = false
		plugins.push(new rspack.HtmlRspackPlugin({
			template: "./index.html",
			minify: true
		}))
	}

	if (argv.nodeEnv === 'development') {
		config.devtool = "source-map"
		plugins.push(new rspack.HtmlRspackPlugin({
			template: "./index.html"
		}))
		plugins.push(new PreactRefreshPlugin({}))
	}

	return config;
}

/**
 * @typedef Env
 * @property {boolean} [RSPACK_BUNDLE]
 * @property {boolean} [RSPACK_BUILD]
 * @property {boolean} [RSPACK_WATCH]
 */

/**
 * @template {import('webpack').LoaderContext<unknown>} T
 * @typedef {T extends import('webpack').LoaderContext<infer P> ? P : never} WebpackLoaderContent
 */

/** @typedef {WebpackLoaderContent<ThisParameterType<import('@svgr/webpack').default>>} SvgrLoaderOption */
