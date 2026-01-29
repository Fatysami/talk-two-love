import { cn } from "@/lib/utils";

interface LanguageIndicatorProps {
  detectedLang: string | null;
  isListening: boolean;
}

const LANG_INFO: Record<string, { flag: string; name: string }> = {
  ar: { flag: "🇲🇦", name: "Arabe" },
  tr: { flag: "🇹🇷", name: "Turc" },
  fr: { flag: "🇫🇷", name: "Français" },
  en: { flag: "🇬🇧", name: "Anglais" },
};

export function LanguageIndicator({
  detectedLang,
  isListening,
}: LanguageIndicatorProps) {
  if (!isListening && !detectedLang) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-2 px-4 rounded-full",
        "bg-muted/50 backdrop-blur-sm",
        "transition-all duration-300",
        isListening && !detectedLang && "animate-pulse"
      )}
    >
      {isListening && !detectedLang ? (
        <span className="text-sm text-muted-foreground">
          🎤 Détection de la langue...
        </span>
      ) : detectedLang && LANG_INFO[detectedLang] ? (
        <>
          <span className="text-lg">{LANG_INFO[detectedLang].flag}</span>
          <span className="text-sm font-medium text-foreground">
            {LANG_INFO[detectedLang].name} détecté
          </span>
        </>
      ) : null}
    </div>
  );
}
