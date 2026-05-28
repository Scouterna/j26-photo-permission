import { Box, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import appCss from "../styles.css?url";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { LangContext } from "../lib/lang-context";
import { useHtmlLang } from "../lib/use-html-lang";
import { theme } from "../theme";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Fotograferingstillstånd",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	notFoundComponent: RootNotFound,
	shellComponent: RootDocument,
});

function RootNotFound() {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Box
				display="flex"
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
				minHeight="100vh"
				px={3}
				textAlign="center"
				gap={1}
			>
				<Typography variant="h4" component="h1">
					Hittades inte
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Sidan kunde inte hittas.
				</Typography>
			</Box>
		</ThemeProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const lang = useHtmlLang();
	return (
		<html lang="sv" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<LangContext.Provider value={lang}>
					<ThemeProvider theme={theme}>
						<CssBaseline />
						{children}
						<TanStackDevtools
							config={{
								position: "bottom-right",
							}}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
							]}
						/>
						<Scripts />
					</ThemeProvider>
				</LangContext.Provider>
			</body>
		</html>
	);
}
