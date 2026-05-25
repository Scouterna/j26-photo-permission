export const DEFAULT_LOCAL_SERVICE_BASE_PATH = "/";
export const DEFAULT_DEPLOYED_SERVICE_BASE_PATH = "/_services/photo-permission";
export const DEFAULT_SIGNUPINFO_PROXY_PREFIX = "/signupinfo";
export const DEFAULT_LOCAL_SIGNUPINFO_UPSTREAM = "http://localhost:8000";

export function ensureLeadingSlash(value: string): string {
	return value.startsWith("/") ? value : `/${value}`;
}

export function trimTrailingSlash(value: string): string {
	return value.replace(/\/+$/, "") || "/";
}

export function normalizeBasePath(value: string): string {
	if (!value || value === "/") {
		return "/";
	}

	return trimTrailingSlash(ensureLeadingSlash(value));
}

export function resolveServiceBasePath(
	configuredValue?: string | null,
	executionMode?: string,
): string {
	const trimmedValue = configuredValue?.trim();

	if (trimmedValue) {
		return normalizeBasePath(trimmedValue);
	}

	return executionMode === "development"
		? DEFAULT_LOCAL_SERVICE_BASE_PATH
		: DEFAULT_DEPLOYED_SERVICE_BASE_PATH;
}

export function resolveSignupinfoUpstream(
	configuredValue?: string | null,
	executionMode?: string,
): string | null {
	const trimmedValue = configuredValue?.trim();

	if (trimmedValue) {
		return trimTrailingSlash(trimmedValue);
	}

	return executionMode === "development"
		? DEFAULT_LOCAL_SIGNUPINFO_UPSTREAM
		: null;
}
