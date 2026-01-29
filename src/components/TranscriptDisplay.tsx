import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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

export function TranscriptDisplay({
  entries,
  showText,
  onToggleText,
}: TranscriptDisplayProps) {
  const latestEntry = entries[entries.length - 1];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Toggle button */}
      <button
        onClick={onToggleText}
        className="flex items-center justify-center gap-2 w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        {showText ? (
          <>
            <ChevronDown className="w-4 h-4" />
            <span className="text-sm font-medium">Masquer le texte</span>
          </>
        ) : (
          <>
            <ChevronUp className="w-4 h-4" />
            <span className="text-sm font-medium">Afficher le texte</span>
          </>
        )}
      </button>

      {/* Transcript bubbles */}
      {showText && latestEntry && (
        <div className="space-y-3 animate-fade-up">
          {/* Original text */}
          <div
            className={cn(
              "transcript-bubble",
              latestEntry.speaker === "me"
                ? "transcript-bubble-me"
                : "transcript-bubble-other"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="lang-badge">
                {LANG_FLAGS[latestEntry.originalLang]}{" "}
                {LANG_NAMES[latestEntry.originalLang]}
              </span>
            </div>
            <p className="text-foreground font-medium">
              {latestEntry.originalText}
            </p>
          </div>

          {/* Translated text */}
          <div className="transcript-bubble bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="lang-badge">
                {LANG_FLAGS[latestEntry.targetLang]}{" "}
                {LANG_NAMES[latestEntry.targetLang]}
              </span>
              <span className="text-xs text-muted-foreground">→ Traduction</span>
            </div>
            <p className="text-foreground font-medium">
              {latestEntry.translatedText}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {showText && entries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">
            Appuyez sur un bouton et parlez pour commencer
          </p>
        </div>
      )}
    </div>
  );
}
