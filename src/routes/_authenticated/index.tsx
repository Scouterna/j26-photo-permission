import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HelpIcon from "@mui/icons-material/Help";
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
import { useEffect, useMemo, useRef, useState } from "react";
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

const DEBOUNCE_MS = 500;

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
				onClose={handleClose}
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
	onClose,
}: {
	open: boolean;
	member: Member | null;
	permission: PhotoPermission | null;
	loading: boolean;
	error: string | null;
	onClose: () => void;
}) {
	const t = useT();
	const verdicts = useVerdictStyles();

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
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} variant="contained" fullWidth>
					{t.closeButton}
				</Button>
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
