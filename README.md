# J26 Photo Permission

A J26 micro-frontend that lets jamboree photographers look up a participant or staff member by name, birth date, or scout group and view their photo-permission verdict (JA / NEJ / FRÅGA).

Built as a TanStack Start service so it lives inside the same app-shell model as the other J26 applications. The browser only renders the lookup UI and queries the signupinfo backend over the same domain. Authorization is enforced by the backend from the platform JWT cookie.

## Behavior

- In local development, the app runs at `/`.
- In deployed environments, the app is mounted under `/_services/photo-permission`.
- The app-shell navigation entry is served from `/app-config` inside the service.
- Member lookups go to a same-origin `/signupinfo` path and include cookies.
- The backend (`j26-signupinfo`) is the real authorization boundary. The UI also gates on either the `j26-photography` or `j26-signupinfo:all:read` role from the JWT so unauthorized users get a clear "Åtkomst nekad" page.

## Configuration

- `J26_SERVICE_BASE_PATH`: app base path. Defaults to `/` in local development and `/_services/photo-permission` outside development.
- `J26_SIGNUPINFO_PROXY_PREFIX`: same-origin prefix used for signupinfo API calls. Default: `/signupinfo`
- `J26_SIGNUPINFO_UPSTREAM`: optional override for the local development upstream. Defaults to `http://localhost:8000` in development and is unset outside development.

For local development, copy `.env.local.template` to `.env.local` and adjust values as needed.

## Local Development

```bash
pnpm install
pnpm dev   # http://localhost:3000/
```

The dev server proxies `/signupinfo/**` to `http://localhost:8000` unless `J26_SIGNUPINFO_UPSTREAM` overrides it. In Kubernetes, same-origin `/signupinfo` routing is handled by the platform ingress.

```bash
pnpm check   # lint + format check
pnpm build   # produces .output/ Nitro bundle
pnpm preview # serve the built bundle
```

## Kubernetes

The manifests are controlled by ArgoCD and assume:

- the service is exposed at `/_services/photo-permission`
- `J26_SERVICE_BASE_PATH` is set to `/_services/photo-permission`
- ingress rewrites preserve that base path for the Node app
- the service listens on container port `3000`
- the Kubernetes Service exposes port `80`
- same-domain routing for `/signupinfo` is handled outside this service
