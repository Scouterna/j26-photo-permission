import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import {
	DEFAULT_SIGNUPINFO_PROXY_PREFIX,
	normalizeBasePath,
	resolveServiceBasePath,
	resolveSignupinfoUpstream,
} from "./app.config";

const config = defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const basePath = resolveServiceBasePath(env.J26_SERVICE_BASE_PATH, mode);
	const signupinfoProxyPrefix = normalizeBasePath(
		env.J26_SIGNUPINFO_PROXY_PREFIX || DEFAULT_SIGNUPINFO_PROXY_PREFIX,
	);
	const signupinfoUpstream = resolveSignupinfoUpstream(
		env.J26_SIGNUPINFO_UPSTREAM,
		mode,
	);

	return {
		base: basePath,
		plugins: [
			devtools(),
			nitro({
				baseURL: basePath,
				rollupConfig: { external: [/^@sentry\//] },
				routeRules: signupinfoUpstream
					? {
							[`${signupinfoProxyPrefix}/**`]: {
								proxy: `${signupinfoUpstream}/**`,
							},
						}
					: undefined,
				handlers: [
					{
						route: "/app-config",
						handler: "./server/api/app-config.ts",
					},
				],
			}),
			tsconfigPaths({ projects: ["./tsconfig.json"] }),
			tanstackStart({ router: { basepath: basePath } }),
			viteReact({
				babel: {
					plugins: ["babel-plugin-react-compiler"],
				},
			}),
		],
		server: {
			allowedHosts: ["local.j26.se"],
			proxy: signupinfoUpstream
				? {
						[signupinfoProxyPrefix]: {
							target: signupinfoUpstream,
							changeOrigin: true,
						},
					}
				: undefined,
		},
	};
});

export default config;
