import { decodeJwt } from "jose";

interface KeycloakResourceAccess {
	[client: string]: { roles?: string[] } | undefined;
}

interface KeycloakPayload {
	sub?: string;
	realm_access?: { roles?: string[] };
	resource_access?: KeycloakResourceAccess;
	name?: string;
	preferred_username?: string;
	email?: string;
	picture?: string;
}

export interface AppUser {
	sub: string;
	name: string;
	email: string;
	preferredUsername: string;
	picture?: string;
	roles: string[];
}

function collectAllRoles(resourceAccess?: KeycloakResourceAccess): string[] {
	if (!resourceAccess) return [];
	const seen = new Set<string>();
	for (const client of Object.values(resourceAccess)) {
		for (const role of client?.roles ?? []) {
			seen.add(role);
		}
	}
	return Array.from(seen);
}

export function decodeAndGetUser(token: string): AppUser | null {
	try {
		const payload = decodeJwt(token) as KeycloakPayload;
		if (!payload.sub) return null;
		return {
			sub: payload.sub,
			name: payload.name ?? "Okänd",
			email: payload.email ?? "",
			preferredUsername: payload.preferred_username ?? "",
			picture: payload.picture,
			roles: [
				...(payload.realm_access?.roles ?? []),
				...collectAllRoles(payload.resource_access),
			],
		};
	} catch (err) {
		console.error("[auth] decodeAndGetUser failed:", err);
		return null;
	}
}

export const PHOTO_PERMISSION_ROLES = [
	"j26-photography",
	"j26-signupinfo:all:read",
] as const;

export function hasPhotoPermissionAccess(user: AppUser): boolean {
	return PHOTO_PERMISSION_ROLES.some((role) => user.roles.includes(role));
}
