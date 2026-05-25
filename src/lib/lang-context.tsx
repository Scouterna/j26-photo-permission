import { createContext, useContext } from "react";
import type { Lang, Translations } from "./i18n";
import { translations } from "./i18n";

export const LangContext = createContext<Lang>("sv");

export function useT(): Translations {
	return translations[useContext(LangContext)];
}
