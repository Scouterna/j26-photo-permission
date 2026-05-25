export const PROJECT_ID_DELTAGARE = 52710;
export const PROJECT_ID_FUNKTIONAR = 52716;
export const PHOTO_QUESTION_KEY = "90426";

export interface Member {
	member_no: number;
	name: string;
	born: string;
	registration_group: string;
	member_group: string;
}

export type SearchResult =
	| { kind: "ok"; members: Member[] }
	| { kind: "empty" }
	| { kind: "too-many" }
	| { kind: "session-expired" }
	| { kind: "error"; status?: number; message: string };

export type PhotoPermission = "yes" | "no" | "ask";

export type PermissionResult =
	| { kind: "ok"; permission: PhotoPermission }
	| { kind: "session-expired" }
	| { kind: "error"; status?: number; message: string };

interface ApiConfig {
	signupinfoBasePath: string;
	refreshPath: string;
}

async function fetchWithRefresh(
	url: string,
	init: RequestInit,
	refreshPath: string,
): Promise<Response> {
	const res = await fetch(url, { credentials: "include", ...init });
	if (res.status !== 401) return res;

	const refresh = await fetch(refreshPath, { credentials: "include" });
	if (!refresh.ok) return res;

	return fetch(url, { credentials: "include", ...init });
}

export async function searchMember(
	config: ApiConfig,
	projectId: number,
	params: { name: string; born: string; group: string },
	signal: AbortSignal,
): Promise<SearchResult> {
	const url = new URL(
		`${config.signupinfoBasePath}/api/stats/${projectId}/search_member`,
		window.location.origin,
	);
	if (params.name) url.searchParams.set("name", params.name);
	if (params.born) url.searchParams.set("born", params.born);
	if (params.group) url.searchParams.set("group", params.group);

	let res: Response;
	try {
		res = await fetchWithRefresh(
			url.toString(),
			{ signal },
			config.refreshPath,
		);
	} catch (err) {
		if ((err as Error).name === "AbortError") throw err;
		return { kind: "error", message: (err as Error).message };
	}

	if (res.status === 200) {
		const members = (await res.json()) as Member[];
		return { kind: "ok", members };
	}
	if (res.status === 401) return { kind: "session-expired" };
	if (res.status === 404) return { kind: "empty" };
	if (res.status === 413) return { kind: "too-many" };
	return {
		kind: "error",
		status: res.status,
		message: `HTTP ${res.status}`,
	};
}

export async function fetchPhotoPermission(
	config: ApiConfig,
	projectId: number,
	memberId: number,
): Promise<PermissionResult> {
	const url = `${config.signupinfoBasePath}/api/stats/${projectId}/individualinfo/${memberId}`;

	let res: Response;
	try {
		res = await fetchWithRefresh(url, {}, config.refreshPath);
	} catch (err) {
		return { kind: "error", message: (err as Error).message };
	}

	if (res.status === 401) return { kind: "session-expired" };
	if (!res.ok) {
		return {
			kind: "error",
			status: res.status,
			message: `HTTP ${res.status}`,
		};
	}

	const data = (await res.json()) as Record<string, unknown>;
	const value = data[PHOTO_QUESTION_KEY];
	if (value === undefined || value === null)
		return { kind: "ok", permission: "ask" };
	const s = String(value);
	if (s === "1") return { kind: "ok", permission: "yes" };
	if (s === "0") return { kind: "ok", permission: "no" };
	return { kind: "ok", permission: "ask" };
}
