import { createServerFn } from "@tanstack/react-start";
import {
	DEFAULT_SIGNUPINFO_PROXY_PREFIX,
	normalizeBasePath,
	resolveServiceBasePath,
} from "../../app.config";

export interface PhotoRuntimeConfig {
	loginPath: string;
	refreshPath: string;
	signupinfoBasePath: string;
	serviceBasePath: string;
}

function readRuntimeConfig(): PhotoRuntimeConfig {
	const serviceBasePath = resolveServiceBasePath(
		process.env.J26_SERVICE_BASE_PATH,
		process.env.NODE_ENV,
	);
	const signupinfoBasePath = normalizeBasePath(
		process.env.J26_SIGNUPINFO_PROXY_PREFIX || DEFAULT_SIGNUPINFO_PROXY_PREFIX,
	);

	return {
		loginPath: "/auth/login",
		refreshPath: "/auth/refresh",
		signupinfoBasePath,
		serviceBasePath,
	};
}

export const getPhotoRuntimeConfig = createServerFn({ method: "GET" }).handler(
	async (): Promise<PhotoRuntimeConfig> => readRuntimeConfig(),
);
