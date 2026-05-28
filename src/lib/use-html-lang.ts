import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

function htmlElement(): HTMLElement {
	return window.parent !== window
		? window.parent.document.documentElement
		: document.documentElement;
}

function normalizeLang(raw: string): Lang {
	const tag = raw.split("-")[0].toLowerCase();
	return tag === "sv" ? "sv" : "en";
}

export function useHtmlLang(): Lang {
	const [lang, setLang] = useState<Lang>(() => normalizeLang(htmlElement().lang));

	useEffect(() => {
		const el = htmlElement();

		const observer = new MutationObserver(() => {
			setLang(normalizeLang(el.lang));
		});
		observer.observe(el, { attributes: true, attributeFilter: ["lang"] });

		// Sync in case the attribute changed between render and effect
		setLang(normalizeLang(el.lang));

		return () => observer.disconnect();
	}, []);

	return lang;
}
