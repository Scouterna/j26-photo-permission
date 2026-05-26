import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HelpIcon from "@mui/icons-material/Help";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SearchIcon from "@mui/icons-material/Search";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	List,
	ListItemButton,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
	fetchPhotoPermission,
	type Member,
	type PhotoPermission,
	PROJECT_ID_DELTAGARE,
	PROJECT_ID_FUNKTIONAR,
	type SearchResult,
	searchMember,
} from "#/lib/api";
import { useT } from "#/lib/lang-context";
import { useAppBarTitle } from "#/lib/use-app-bar-title";
import { useDebounced } from "#/lib/use-debounced";
import { getPhotoRuntimeConfig } from "#/server/runtime-config";

type Role = "deltagare" | "funktionar";

const DEBOUNCE_MS = 700;

export const Route = createFileRoute("/_authenticated/")({
	loader: () => getPhotoRuntimeConfig(),
	component: PhotoPermissionPage,
});

function PhotoPermissionPage() {
	const t = useT();
	useAppBarTitle(t.appBarTitle);
	const config = Route.useLoaderData();

	const [role, setRole] = useState<Role>("deltagare");
	const [name, setName] = useState("");
	const [born, setBorn] = useState("");
	const [group, setGroup] = useState("");

	const projectId =
		role === "deltagare" ? PROJECT_ID_DELTAGARE : PROJECT_ID_FUNKTIONAR;

	const debouncedName = useDebounced(name, DEBOUNCE_MS);
	const debouncedBorn = useDebounced(born, DEBOUNCE_MS);
	const debouncedGroup = useDebounced(group, DEBOUNCE_MS);

	const [result, setResult] = useState<SearchResult | null>(null);
	const [searching, setSearching] = useState(false);
	const [sessionExpired, setSessionExpired] = useState(false);

	const [selected, setSelected] = useState<Member | null>(null);
	const [permission, setPermission] = useState<PhotoPermission | null>(null);
	const [permissionLoading, setPermissionLoading] = useState(false);
	const [permissionError, setPermissionError] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [photoModeOpen, setPhotoModeOpen] = useState(false);
	const [manuallyApproved, setManuallyApproved] = useState(false);

	const abortRef = useRef<AbortController | null>(null);

	const allEmpty = useMemo(
		() => !debouncedName && !debouncedBorn && !debouncedGroup,
		[debouncedName, debouncedBorn, debouncedGroup],
	);

	useEffect(() => {
		abortRef.current?.abort();
		if (allEmpty) {
			setResult(null);
			setSearching(false);
			return;
		}
		const controller = new AbortController();
		abortRef.current = controller;
		setSearching(true);
		searchMember(
			config,
			projectId,
			{ name: debouncedName, born: debouncedBorn, group: debouncedGroup },
			controller.signal,
		)
			.then((r) => {
				if (controller.signal.aborted) return;
				if (r.kind === "session-expired") {
					setSessionExpired(true);
					setResult(null);
				} else {
					setResult(r);
				}
				setSearching(false);
			})
			.catch((err) => {
				if (err.name !== "AbortError") {
					setResult({ kind: "error", message: t.networkError });
					setSearching(false);
				}
			});
		return () => controller.abort();
	}, [
		config,
		debouncedName,
		debouncedBorn,
		debouncedGroup,
		allEmpty,
		projectId,
		t.networkError,
	]);

	async function handleSelect(member: Member) {
		setSelected(member);
		setModalOpen(true);
		setPermission(null);
		setPermissionError(null);
		setPermissionLoading(true);
		setManuallyApproved(false);
		const result = await fetchPhotoPermission(
			config,
			projectId,
			member.member_no,
		);
		setPermissionLoading(false);
		if (result.kind === "ok") {
			setPermission(result.permission);
		} else if (result.kind === "session-expired") {
			setSessionExpired(true);
			setModalOpen(false);
		} else {
			setPermissionError(t.permissionError);
		}
	}

	function handleClose() {
		setModalOpen(false);
	}

	function handleEnterPhotoMode() {
		// Fullscreen/orientation-lock APIs require a user-gesture call stack,
		// so kick them off here synchronously rather than from a later effect.
		enterFullscreenLandscape();
		setModalOpen(false);
		setPhotoModeOpen(true);
	}

	function handleExitPhotoMode() {
		setPhotoModeOpen(false);
	}

	return (
		<Stack spacing={2}>
			<Typography variant="h5" component="h1" fontWeight="medium">
				{t.appTitle}
			</Typography>

			{sessionExpired && <Alert severity="warning">{t.sessionExpired}</Alert>}

			<ToggleButtonGroup
				value={role}
				exclusive
				fullWidth
				size="small"
				color="primary"
				onChange={(_, v: Role | null) => v && setRole(v)}
			>
				<ToggleButton value="deltagare" sx={{ textTransform: "none" }}>
					{t.roleParticipant}
				</ToggleButton>
				<ToggleButton value="funktionar" sx={{ textTransform: "none" }}>
					{t.roleStaff}
				</ToggleButton>
			</ToggleButtonGroup>

			<Stack spacing={1.5}>
				<TextField
					label={t.labelName}
					placeholder={t.placeholderName}
					value={name}
					onChange={(e) => setName(e.target.value)}
					size="small"
					fullWidth
					autoComplete="off"
				/>
				<TextField
					label={t.labelBorn}
					placeholder={t.placeholderBorn}
					value={born}
					onChange={(e) => setBorn(e.target.value)}
					size="small"
					fullWidth
					autoComplete="off"
					inputMode="numeric"
				/>
				<TextField
					label={t.labelGroup}
					placeholder={t.placeholderGroup}
					value={group}
					onChange={(e) => setGroup(e.target.value)}
					size="small"
					fullWidth
					autoComplete="off"
				/>
			</Stack>

			<ResultsArea
				allEmpty={allEmpty}
				searching={searching}
				result={result}
				onSelect={handleSelect}
			/>

			<PermissionModal
				open={modalOpen}
				member={selected}
				permission={permission}
				loading={permissionLoading}
				error={permissionError}
				manuallyApproved={manuallyApproved}
				onClose={handleClose}
				onApprove={() => setManuallyApproved(true)}
				onEnterPhotoMode={handleEnterPhotoMode}
			/>

			<PhotoModeOverlay
				open={photoModeOpen}
				member={selected}
				permission={permission}
				manuallyApproved={manuallyApproved}
				onClose={handleExitPhotoMode}
			/>
		</Stack>
	);
}

function ResultsArea({
	allEmpty,
	searching,
	result,
	onSelect,
}: {
	allEmpty: boolean;
	searching: boolean;
	result: SearchResult | null;
	onSelect: (m: Member) => void;
}) {
	const t = useT();

	if (allEmpty) {
		return (
			<Stack
				alignItems="center"
				justifyContent="center"
				sx={{
					color: "text.secondary",
					textAlign: "center",
					px: 2,
					py: 4,
				}}
				spacing={1}
			>
				<SearchIcon sx={{ fontSize: 48, opacity: 0.5 }} />
				<Typography variant="body2">{t.hintStart}</Typography>
			</Stack>
		);
	}

	if (searching && !result) {
		return (
			<Stack alignItems="center" sx={{ pt: 4 }} spacing={1}>
				<CircularProgress size={28} />
			</Stack>
		);
	}

	if (!result) return null;

	if (result.kind === "session-expired") return null;

	if (result.kind === "too-many") {
		return (
			<Box
				sx={{
					mt: 1,
					p: 2,
					background: "#fff3e0",
					color: "#e65100",
					borderRadius: 2,
					textAlign: "center",
				}}
			>
				<Typography variant="body2">{t.tooManyResults}</Typography>
			</Box>
		);
	}

	if (result.kind === "empty") {
		return (
			<Box
				sx={{
					mt: 1,
					p: 2,
					background: "#fff3e0",
					color: "#e65100",
					borderRadius: 2,
					textAlign: "center",
				}}
			>
				<Typography variant="body2">{t.noResults}</Typography>
			</Box>
		);
	}

	if (result.kind === "error") {
		return (
			<Box
				sx={{
					mt: 1,
					p: 2,
					background: "#ffebee",
					color: "#b71c1c",
					borderRadius: 2,
					textAlign: "center",
				}}
			>
				<Typography variant="body2">
					{result.status ? t.serverError(result.status) : t.networkError}
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: "1.4fr 1fr 1.2fr",
					gap: 1,
					px: 1.5,
					py: 0.5,
					color: "text.secondary",
					fontSize: 12,
					fontWeight: 600,
					textTransform: "uppercase",
					letterSpacing: 0.4,
				}}
			>
				<Box>{t.columnName}</Box>
				<Box>{t.columnBorn}</Box>
				<Box>{t.columnGroup}</Box>
			</Box>
			<List dense disablePadding>
				{result.members.map((m) => (
					<ListItemButton
						key={m.member_no}
						onClick={() => onSelect(m)}
						sx={{
							borderRadius: 2,
							mb: 0.5,
							background: "background.paper",
							boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
							"&:hover": { background: "#eef7ec" },
							display: "grid",
							gridTemplateColumns: "1.4fr 1fr 1.2fr",
							gap: 1,
							alignItems: "center",
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
							{m.name}
						</Typography>
						<Typography variant="body2" color="text.secondary" noWrap>
							{m.born}
						</Typography>
						<Typography variant="body2" color="text.secondary" noWrap>
							{m.member_group}
						</Typography>
					</ListItemButton>
				))}
			</List>
		</Box>
	);
}

interface VerdictStyle {
	label: string;
	color: string;
	bg: string;
	Icon: typeof CheckCircleIcon;
}

function useVerdictStyles(): Record<PhotoPermission, VerdictStyle> {
	const t = useT();
	return {
		yes: {
			label: t.verdictYes,
			color: "#1b5e20",
			bg: "#c8e6c9",
			Icon: CheckCircleIcon,
		},
		no: {
			label: t.verdictNo,
			color: "#b71c1c",
			bg: "#ffcdd2",
			Icon: CancelIcon,
		},
		ask: {
			label: t.verdictAsk,
			color: "#e65100",
			bg: "#ffe0b2",
			Icon: HelpIcon,
		},
	};
}

function PermissionModal({
	open,
	member,
	permission,
	loading,
	error,
	manuallyApproved,
	onClose,
	onApprove,
	onEnterPhotoMode,
}: {
	open: boolean;
	member: Member | null;
	permission: PhotoPermission | null;
	loading: boolean;
	error: string | null;
	manuallyApproved: boolean;
	onClose: () => void;
	onApprove: () => void;
	onEnterPhotoMode: () => void;
}) {
	const t = useT();
	const verdicts = useVerdictStyles();
	const ready = !loading && !error && permission !== null;
	const showPhotoMode =
		ready &&
		(permission === "yes" || (permission === "ask" && manuallyApproved));
	const showApprove = ready && permission === "ask" && !manuallyApproved;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="xs"
			slotProps={{
				paper: { sx: { borderRadius: 3, m: 2 } },
			}}
		>
			<DialogTitle sx={{ pb: 1 }}>{t.modalTitle}</DialogTitle>
			<DialogContent sx={{ pt: 1 }}>
				{member && (
					<Stack spacing={0.5} sx={{ mb: 2 }}>
						<MemberRow label={t.rowMemberNo} value={String(member.member_no)} />
						<MemberRow label={t.rowName} value={member.name} />
						<MemberRow label={t.rowBorn} value={member.born} />
						<MemberRow label={t.rowGroup} value={member.member_group} />
					</Stack>
				)}

				{loading && (
					<Stack alignItems="center" sx={{ py: 3 }} spacing={1}>
						<CircularProgress size={32} />
						<Typography variant="body2" color="text.secondary">
							{t.loadingPermission}
						</Typography>
					</Stack>
				)}

				{error && !loading && (
					<Stack
						direction="row"
						spacing={1}
						sx={{
							alignItems: "center",
							p: 2,
							background: "#ffebee",
							color: "#b71c1c",
							borderRadius: 2,
						}}
					>
						<ErrorOutlineIcon />
						<Typography variant="body2">{error}</Typography>
					</Stack>
				)}

				{!loading && !error && permission && (
					<VerdictBox style={verdicts[permission]} caption={t.verdictCaption} />
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
				<Button onClick={onClose} variant="outlined" fullWidth>
					{t.closeButton}
				</Button>
				{showApprove && (
					<Button
						onClick={onApprove}
						variant="contained"
						color="warning"
						fullWidth
						startIcon={<CheckCircleIcon />}
					>
						{t.approvePhotoPermission}
					</Button>
				)}
				{showPhotoMode && (
					<Button
						onClick={onEnterPhotoMode}
						variant="contained"
						fullWidth
						startIcon={<PhotoCameraIcon />}
					>
						{t.photoMode}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}

function VerdictBox({
	style,
	caption,
}: {
	style: VerdictStyle;
	caption: string;
}) {
	const { Icon } = style;
	return (
		<Box
			sx={{
				mt: 1,
				p: 2,
				borderRadius: 2,
				background: style.bg,
				display: "flex",
				alignItems: "center",
				gap: 1.5,
			}}
		>
			<Icon sx={{ color: style.color, fontSize: 48 }} />
			<Box>
				<Typography variant="caption" sx={{ color: style.color }}>
					{caption}
				</Typography>
				<Typography
					variant="h4"
					sx={{ color: style.color, fontWeight: 700, lineHeight: 1.1 }}
				>
					{style.label}
				</Typography>
			</Box>
		</Box>
	);
}

function MemberRow({ label, value }: { label: string; value: string }) {
	return (
		<Box sx={{ display: "flex", gap: 1, fontSize: 14 }}>
			<Typography
				variant="body2"
				sx={{ color: "text.secondary", minWidth: 130 }}
			>
				{label}:
			</Typography>
			<Typography variant="body2" sx={{ fontWeight: 500 }}>
				{value}
			</Typography>
		</Box>
	);
}

interface OrientationLockable {
	lock?: (orientation: "landscape") => Promise<void>;
	unlock?: () => void;
}

async function enterFullscreenLandscape(): Promise<void> {
	try {
		if (!document.fullscreenElement) {
			await document.documentElement.requestFullscreen?.();
		}
	} catch {
		// Fullscreen not supported or denied — orientation lock will likely fail too,
		// but the overlay still renders, so the photographer can rotate manually.
	}
	try {
		const orientation = screen.orientation as ScreenOrientation &
			OrientationLockable;
		await orientation.lock?.("landscape");
	} catch {
		// Orientation lock not supported (e.g. iOS Safari) — let the user rotate manually.
	}
}

function exitFullscreenLandscape(): void {
	try {
		const orientation = screen.orientation as ScreenOrientation &
			OrientationLockable;
		orientation.unlock?.();
	} catch {
		// no-op
	}
	try {
		if (document.fullscreenElement) {
			document.exitFullscreen?.();
		}
	} catch {
		// no-op
	}
}

/**
 * Render `text` at the largest font size that still fits inside the parent
 * box. The hook owns the text content of the measurement span so it can
 * binary-search the font size whenever the text or the container resizes.
 */
function useFitText(text: string) {
	// Callback refs (state setters) — React invokes them when the DOM node
	// attaches/detaches. That's important because the Dialog only mounts its
	// children once `open` flips to true, so a plain useRef wouldn't trigger
	// the measurement effect at the right moment.
	const [container, setContainer] = useState<HTMLDivElement | null>(null);
	const [measure, setMeasure] = useState<HTMLSpanElement | null>(null);
	const [fontSize, setFontSize] = useState<number>(64);

	useLayoutEffect(() => {
		if (!container || !measure) return;
		// Ensure measurement DOM matches the rendered text (also keeps `text` a real dep).
		measure.textContent = text;
		let rafId = 0;

		function fit() {
			if (!container || !measure) return;
			const cw = container.clientWidth;
			const ch = container.clientHeight;
			if (cw === 0) {
				// Container not laid out yet (e.g. mid-dialog-transition) — retry next frame.
				rafId = requestAnimationFrame(fit);
				return;
			}
			// Width is the primary constraint; for single-line nowrap text the height
			// is just ~fontSize, and the container has overflow:hidden as a backstop.
			// Also cap by container height so the name never grows taller than its row.
			const maxByHeight = ch > 0 ? ch : 2000;
			let lo = 12;
			let hi = Math.min(2000, Math.floor(maxByHeight));
			let best = lo;
			for (let i = 0; i < 16; i++) {
				const mid = Math.floor((lo + hi) / 2);
				measure.style.fontSize = `${mid}px`;
				if (measure.scrollWidth <= cw * 0.95) {
					best = mid;
					lo = mid + 1;
				} else {
					hi = mid - 1;
				}
			}
			setFontSize(best);
		}

		fit();
		const ro = new ResizeObserver(fit);
		ro.observe(container);
		return () => {
			ro.disconnect();
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [container, measure, text]);

	return { containerRef: setContainer, measureRef: setMeasure, fontSize };
}

function PhotoModeOverlay({
	open,
	member,
	permission,
	manuallyApproved,
	onClose,
}: {
	open: boolean;
	member: Member | null;
	permission: PhotoPermission | null;
	manuallyApproved: boolean;
	onClose: () => void;
}) {
	const t = useT();
	const verdicts = useVerdictStyles();

	useEffect(() => {
		if (!open) return;
		// Entry (requestFullscreen + orientation lock) is initiated by the click
		// handler in the parent because both APIs require a user-gesture stack.
		// Here we only register the cleanup that runs when the overlay closes.
		return exitFullscreenLandscape;
	}, [open]);

	const displayPermission: PhotoPermission | null =
		permission === "yes" || (permission === "ask" && manuallyApproved)
			? permission
			: null;

	const { containerRef, measureRef, fontSize } = useFitText(member?.name ?? "");

	if (!member || !displayPermission) return null;

	const verdictStyle = verdicts[displayPermission];
	const verdictLabel =
		displayPermission === "yes" ? t.verdictYes : t.verdictApproved;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullScreen
			slotProps={{ paper: { sx: { bgcolor: verdictStyle.bg } } }}
		>
			<Box
				sx={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					p: 2,
					position: "relative",
					boxSizing: "border-box",
				}}
			>
				<Button
					onClick={onClose}
					variant="outlined"
					size="small"
					sx={{
						position: "absolute",
						top: 8,
						right: 8,
						color: verdictStyle.color,
						borderColor: verdictStyle.color,
						"&:hover": {
							borderColor: verdictStyle.color,
							bgcolor: "rgba(0,0,0,0.04)",
						},
						zIndex: 1,
					}}
				>
					{t.exitPhotoMode}
				</Button>

				{/* Name — auto-fits to fill available width */}
				<Box
					ref={containerRef}
					sx={{
						flex: 1,
						minHeight: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "100%",
						overflow: "hidden",
						textAlign: "center",
					}}
				>
					<span
						ref={measureRef}
						style={{
							color: verdictStyle.color,
							fontWeight: 700,
							lineHeight: 1,
							whiteSpace: "nowrap",
							display: "inline-block",
							fontSize: `${fontSize}px`,
						}}
					>
						{member.name}
					</span>
				</Box>

				{/* Member number — clearly visible, smaller than name */}
				<Typography
					sx={{
						color: verdictStyle.color,
						textAlign: "center",
						fontWeight: 600,
						fontSize: "clamp(18px, 5vh, 40px)",
						lineHeight: 1.1,
						mt: 1,
					}}
				>
					{t.rowMemberNo} {member.member_no}
				</Typography>

				{/* Verdict — small, slightly larger than name caption */}
				<Typography
					sx={{
						color: verdictStyle.color,
						textAlign: "center",
						fontWeight: 900,
						fontSize: "clamp(20px, 4vh, 32px)",
						lineHeight: 1.2,
						mt: 1,
					}}
				>
					{verdictLabel}
				</Typography>
			</Box>
		</Dialog>
	);
}
