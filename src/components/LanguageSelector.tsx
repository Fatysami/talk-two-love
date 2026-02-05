import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  selectedLang: string;
  onSelect: (lang: string) => void;
  variant: "me" | "other";
}

const LANGUAGES = [
  { code: "ar", flag: "🇲🇦", name: "العربية" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
];

export function LanguageSelector({ selectedLang, onSelect, variant }: LanguageSelectorProps) {
  return (
    <div className="flex gap-2">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onSelect(lang.code)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            selectedLang === lang.code
              ? variant === "me"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground shadow-md"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <span className="text-base">{lang.flag}</span>
          <span>{lang.name}</span>
        </button>
      ))}
    </div>
  );
}
