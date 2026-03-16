import { cn } from "@/lib/utils";
import { Share2 } from "lucide-react";

interface TranscriptEntry {
  id: string;
  speaker: "me" | "other";
  originalText: string;
  translatedText: string;
  originalLang: string;
  targetLang: string;
  timestamp: Date;
}

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  showText: boolean;
  onToggleText: () => void;
}

const LANG_FLAGS: Record<string, string> = {
  ar: "🇲🇦",
  tr: "🇹🇷",
  fr: "🇫🇷",
  en: "🇬🇧",
};

const LANG_NAMES: Record<string, string> = {
  ar: "Arabe",
  tr: "Turc",
  fr: "Français",
  en: "Anglais",
};

function shareToWhatsApp(original: string, translated: string, fromLang: string, toLang: string) {
  const text = `${LANG_FLAGS[fromLang]} ${LANG_NAMES[fromLang]}:\n${original}\n\n${LANG_FLAGS[toLang]} ${LANG_NAMES[toLang]}:\n${translated}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

export function TranscriptDisplay({
  entries,
  showText,
}: TranscriptDisplayProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="space-y-2 animate-fade-up">
          {/* Original text */}
          <div className="transcript-bubble transcript-bubble-me">
            <div className="flex items-center gap-2 mb-1">
              <span className="lang-badge">
                {LANG_FLAGS[entry.originalLang]} {LANG_NAMES[entry.originalLang]}
              </span>
            </div>
            <p className="text-foreground font-medium text-sm leading-relaxed">
              {entry.originalText}
            </p>
          </div>

          {/* Translated text */}
          <div className="transcript-bubble bg-card border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="lang-badge">
                {LANG_FLAGS[entry.targetLang]} {LANG_NAMES[entry.targetLang]}
              </span>
              <button
                onClick={() =>
                  shareToWhatsApp(
                    entry.originalText,
                    entry.translatedText,
                    entry.originalLang,
                    entry.targetLang
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-semibold"
                title="Envoyer sur WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp
              </button>
            </div>
            <p className="text-foreground font-medium text-sm leading-relaxed">
              {entry.translatedText}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
