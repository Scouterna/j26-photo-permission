import { Box, CircularProgress, Container, Typography } from "@mui/material";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { hasPhotoPermissionAccess, refreshTokenStillValid } from "#/lib/auth";
import { useT } from "#/lib/lang-context";
import { UserContext } from "#/lib/user-context";
import { getUserStatus } from "#/server/auth";
import { getPhotoRuntimeConfig } from "#/server/runtime-config";

const REFRESH_ATTEMPTED_KEY = "j26-photo-permission:refresh-attempted";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async () => {
		const { user } = await getUserStatus();
		// No valid user (missing/invalid token) or missing required role → deny.
		// A recoverable session (expired access token, valid refresh token) is
		// handled by Unauthorized below — beforeLoad runs during SSR, where
		// /auth/refresh cannot set cookies in the browser.
		if (!user || !hasPhotoPermissionAccess(user))
			throw new Error("unauthorized");
		return { user };
	},
	errorComponent: Unauthorized,
	component: AuthenticatedLayout,
});

/**
 * Rendered when beforeLoad denied access. The access token lives ~30 minutes
 * while the refresh token lasts ~2 weeks, so arriving with only an expired
 * access token is both common and recoverable: refresh once, then reload so
 * the route re-evaluates with fresh cookies.
 */
function Unauthorized() {
	const t = useT();
	// Starts false so SSR and first hydration agree; the effect below decides.
	const [recovering, setRecovering] = useState(false);
	const [checked, setChecked] = useState(false);

	useEffect(() => {
		if (checked) return;
		setChecked(true);
		// Only ever refresh once per page load: if the refreshed token still
		// fails the check, reloading again would loop forever.
		if (sessionStorage.getItem(REFRESH_ATTEMPTED_KEY)) return;
		if (!refreshTokenStillValid()) return;
		sessionStorage.setItem(REFRESH_ATTEMPTED_KEY, "1");
		setRecovering(true);
	}, [checked]);

	useEffect(() => {
		if (!recovering) return;
		let cancelled = false;

		(async () => {
			try {
				const { refreshPath } = await getPhotoRuntimeConfig();
				const res = await fetch(refreshPath, { credentials: "include" });
				if (cancelled) return;
				if (res.ok) {
					window.location.reload();
					return;
				}
			} catch {
				// fall through to the denied message
			}
			if (!cancelled) setRecovering(false);
		})();

		return () => {
			cancelled = true;
		};
	}, [recovering]);

	if (recovering) {
		return (
			<Box
				display="flex"
				alignItems="center"
				justifyContent="center"
				minHeight="100vh"
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box
			display="flex"
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			minHeight="100vh"
			px={3}
			textAlign="center"
			gap={2}
		>
			<Typography variant="h4" component="h1">
				{t.accessDenied}
			</Typography>
			<Typography variant="body1" color="text.secondary">
				{t.accessDeniedMessage}
			</Typography>
		</Box>
	);
}

function AuthenticatedLayout() {
	const { user } = Route.useRouteContext();

	// Access granted, so allow a fresh recovery attempt next time this expires.
	useEffect(() => {
		sessionStorage.removeItem(REFRESH_ATTEMPTED_KEY);
	}, []);

	return (
		<UserContext.Provider value={user}>
			<Container maxWidth="sm" sx={{ mt: 2, mb: 4, px: { xs: 1.5, sm: 3 } }}>
				<Outlet />
			</Container>
		</UserContext.Provider>
	);
}
