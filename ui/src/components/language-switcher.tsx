import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { defaultLng, lngStorageKey, supportedLngs } from "#/i18n/config";

const LANGUAGE_LABELS: Record<(typeof supportedLngs)[number], string> = {
	en: "en",
	"pt-BR": "pt-BR",
};

function persistLng(code: string): void {
	try {
		localStorage.setItem(lngStorageKey, code);
	} catch {
		// private mode / storage disabled — ignore, session-only switch
	}
}

export function LanguageSwitcher() {
	const { i18n: i18nInstance } = useTranslation();
	const activeLng = i18nInstance.resolvedLanguage ?? defaultLng;

	function handleChange(code: string) {
		i18nInstance.changeLanguage(code);
		persistLng(code);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" className="gap-2">
					<Languages className="size-4" />
					<span className="text-xs font-bold">
						{LANGUAGE_LABELS[activeLng as keyof typeof LANGUAGE_LABELS] ??
							activeLng}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{supportedLngs.map((code) => (
					<DropdownMenuItem
						key={code}
						onClick={() => handleChange(code)}
						className="justify-between font-bold"
					>
						{LANGUAGE_LABELS[code]}
						{code === activeLng && <Check className="size-4" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default LanguageSwitcher;
