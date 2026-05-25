import { defineEventHandler, getCookie, setResponseStatus } from "h3";
import { resolveServiceBasePath } from "../../app.config.js";
import { decodeAndGetUser, hasPhotoPermissionAccess } from "../../src/lib/auth.js";

const APP_CONFIG = {
	navigation: [
		{
			type: "page",
			id: "page_photo_permission",
			label: "Fotograferingstillstånd",
			icon: "photo_camera",
			path: resolveServiceBasePath(
				process.env.J26_SERVICE_BASE_PATH,
				process.env.NODE_ENV,
			),
		},
	],
};

export default defineEventHandler((event) => {
	const token = getCookie(event, "j26-auth_access-token");

	if (!token) {
		setResponseStatus(event, 401);
		return "Unauthorized";
	}

	const user = decodeAndGetUser(token);

	if (!user || !hasPhotoPermissionAccess(user)) {
		setResponseStatus(event, 401);
		return "Unauthorized";
	}

	return APP_CONFIG;
});
