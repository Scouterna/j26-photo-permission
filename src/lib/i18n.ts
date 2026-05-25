export type Lang = "sv" | "en";

export interface Translations {
	appTitle: string;
	appBarTitle: string;
	accessDenied: string;
	accessDeniedMessage: string;
	roleParticipant: string;
	roleStaff: string;
	labelName: string;
	labelBorn: string;
	labelGroup: string;
	placeholderName: string;
	placeholderBorn: string;
	placeholderGroup: string;
	hintStart: string;
	noResults: string;
	tooManyResults: string;
	serverError: (status: number) => string;
	networkError: string;
	sessionExpired: string;
	columnName: string;
	columnBorn: string;
	columnGroup: string;
	modalTitle: string;
	rowMemberNo: string;
	rowName: string;
	rowBorn: string;
	rowGroup: string;
	loadingPermission: string;
	permissionError: string;
	verdictCaption: string;
	verdictYes: string;
	verdictNo: string;
	verdictAsk: string;
	closeButton: string;
}

const sv: Translations = {
	appTitle: "Fotograferingstillstånd",
	appBarTitle: "Fotograferingstillstånd",
	accessDenied: "Åtkomst nekad",
	accessDeniedMessage:
		"Du har inte behörighet att använda fotograferingsappen. Kontakta en administratör om du tror att det är ett misstag.",
	roleParticipant: "Deltagare",
	roleStaff: "Funktionär",
	labelName: "Namn",
	labelBorn: "Född",
	labelGroup: "Scoutkår",
	placeholderName: "t.ex. Håkan",
	placeholderBorn: "ÅÅÅÅ-MM-DD",
	placeholderGroup: "t.ex. Trollbäckens",
	hintStart: "Börja skriva i ett av fälten ovan för att söka deltagare.",
	noResults: "Inga deltagare hittades.",
	tooManyResults:
		"För många träffar. Förfina sökningen med fler tecken eller fler fält.",
	serverError: (status) => `Fel från servern (${status}).`,
	networkError: "Kunde inte nå servern. Kontrollera nätverksanslutningen.",
	sessionExpired: "Din session har gått ut. Ladda om sidan och logga in igen.",
	columnName: "Namn",
	columnBorn: "Född",
	columnGroup: "Scoutkår",
	modalTitle: "Fotograferingstillstånd",
	rowMemberNo: "Medlemsnummer",
	rowName: "Namn",
	rowBorn: "Född",
	rowGroup: "Scoutkår",
	loadingPermission: "Hämtar tillstånd…",
	permissionError: "Kunde inte hämta tillstånd.",
	verdictCaption: "Godkänt fotografering",
	verdictYes: "JA",
	verdictNo: "NEJ",
	verdictAsk: "FRÅGA",
	closeButton: "Stäng",
};

const en: Translations = {
	appTitle: "Photo permission",
	appBarTitle: "Photo permission",
	accessDenied: "Access denied",
	accessDeniedMessage:
		"You do not have permission to use the photo-permission app. Contact an administrator if you think this is a mistake.",
	roleParticipant: "Participant",
	roleStaff: "Staff",
	labelName: "Name",
	labelBorn: "Born",
	labelGroup: "Scout group",
	placeholderName: "e.g. Anna",
	placeholderBorn: "YYYY-MM-DD",
	placeholderGroup: "e.g. Trollbäckens",
	hintStart: "Start typing in one of the fields above to search.",
	noResults: "No matching members found.",
	tooManyResults:
		"Too many matches. Refine your search with more characters or fields.",
	serverError: (status) => `Server error (${status}).`,
	networkError: "Could not reach the server. Check your network connection.",
	sessionExpired:
		"Your session has expired. Please reload the page and log in again.",
	columnName: "Name",
	columnBorn: "Born",
	columnGroup: "Scout group",
	modalTitle: "Photo permission",
	rowMemberNo: "Member no.",
	rowName: "Name",
	rowBorn: "Born",
	rowGroup: "Scout group",
	loadingPermission: "Loading permission…",
	permissionError: "Could not load permission.",
	verdictCaption: "Photography approved",
	verdictYes: "YES",
	verdictNo: "NO",
	verdictAsk: "ASK",
	closeButton: "Close",
};

export const translations: Record<Lang, Translations> = { sv, en };
