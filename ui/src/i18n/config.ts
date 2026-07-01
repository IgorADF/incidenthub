import type { Resource } from "i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import ptBr from "./locales/pt-BR/translation.json";

export const resources = {
	en: { translation: en },
	"pt-BR": { translation: ptBr },
} as unknown as Resource;

export const supportedLngs = ["en", "pt-BR"] as const;
export const defaultLng = "pt-BR" as const;
export const defaultNS = "translation" as const;
export const lngStorageKey = "ih_lang" as const;

function readStoredLng(): string | null {
	try {
		return localStorage.getItem(lngStorageKey);
	} catch {
		return null;
	}
}

const initialLng = (() => {
	const stored = readStoredLng();
	if (stored && (supportedLngs as readonly string[]).includes(stored)) {
		return stored;
	}
	return defaultLng;
})();

if (!i18n.isInitialized) {
	i18n.use(initReactI18next).init({
		resources,
		lng: initialLng,
		fallbackLng: defaultLng,
		supportedLngs: [...supportedLngs],
		defaultNS,
		ns: [defaultNS],
		interpolation: {
			escapeValue: false,
		},
	});
}

export default i18n;
