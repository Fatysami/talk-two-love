import { useState } from "react";
import { VoiceButton } from "@/components/VoiceButton";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { LanguageIndicator } from "@/components/LanguageIndicator";
import { useVoiceTranslation } from "@/hooks/useVoiceTranslation";
import { ArrowLeftRight } from "lucide-react";

type TranslationMode = "ar-tr" | "tr-ar";

const MODE_CONFIG = {
  "ar-tr": {
    sourceLabel: "🇲🇦 العربية / 🇫🇷 Français",
    targetLabel: "🇹🇷 Türkçe",
    sourceLangs: ["ar", "fr"],
    targetLang: "tr",
  },
  "tr-ar": {
    sourceLabel: "🇹🇷 Türkçe",
    targetLabel: "🇲🇦 العربية",
    sourceLangs: ["tr"],
    targetLang: "ar",
  },
};

const Index = () => {
  const [mode, setMode] = useState<TranslationMode>("ar-tr");
  const config = MODE_CONFIG[mode];

  const {
    meState,
    otherState,
    detectedLang,
    transcripts,
    draftText,
    setDraftText,
    startListening,
    stopListening,
    translateDraft,
    isBackendConnected,
    meLang,
    otherLang,
    setMeLang,
    setOtherLang,
  } = useVoiceTranslation();

  // Sync languages with mode
  const handleModeSwitch = () => {
    const newMode = mode === "ar-tr" ? "tr-ar" : "ar-tr";
    setMode(newMode);
    if (newMode === "ar-tr") {
      setMeLang("ar");
      setOtherLang("tr");
    } else {
      setMeLang("tr");
      setOtherLang("ar");
    }
  };

  const isAnyActive = meState !== "idle" || otherState !== "idle";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-center px-4 py-3 border-b border-border/50">
        <h1 className="text-xl font-bold text-foreground">
          <span className="text-primary">Voix</span>
          <span className="text-secondary">Duo</span>
        </h1>
      </header>

      {/* Mode selector */}
      <div className="flex items-center justify-center gap-3 px-4 py-4">
        <button
          onClick={handleModeSwitch}
          disabled={isAnyActive}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          <span className="text-sm font-semibold text-foreground">
            {config.sourceLabel}
          </span>
          <ArrowLeftRight className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            {config.targetLabel}
          </span>
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-between p-6 pb-safe">
        {/* Language detection indicator */}
        <div className="h-8">
          <LanguageIndicator
            detectedLang={detectedLang}
            isListening={meState === "listening" || otherState === "listening"}
          />
        </div>

        {/* Single voice button */}
        <div className="flex flex-col items-center gap-4 py-6">
          <VoiceButton
            variant="me"
            state={meState !== "idle" ? meState : otherState}
            label="🎙️ Parlez"
            onPressStart={() => {
              // Set correct languages based on mode
              if (mode === "ar-tr") {
                setMeLang("ar");
                setOtherLang("tr");
              } else {
                setMeLang("tr");
                setOtherLang("ar");
              }
              startListening("me");
            }}
            onPressEnd={stopListening}
            disabled={false}
          />
          <p className="text-xs text-muted-foreground">
            Maintenez appuyé et parlez
          </p>
        </div>

        {/* Transcript display with WhatsApp share */}
        <div className="w-full">
          <TranscriptDisplay
            entries={transcripts}
            showText={true}
            onToggleText={() => {}}
          />
        </div>

        {/* Instructions */}
        {!isAnyActive && transcripts.length === 0 && (
          <div className="text-center text-muted-foreground space-y-2 mt-4">
            <p className="text-sm">
              👆 Maintenez le bouton et dictez votre texte
            </p>
            <p className="text-xs opacity-75">
              La traduction sera lue automatiquement
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
