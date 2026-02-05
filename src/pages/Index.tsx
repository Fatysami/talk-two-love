import { useState } from "react";
import { VoiceButton } from "@/components/VoiceButton";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { LanguageIndicator } from "@/components/LanguageIndicator";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useVoiceTranslation } from "@/hooks/useVoiceTranslation";
import { Settings, History } from "lucide-react";

const Index = () => {
  const [showText, setShowText] = useState(true);
  const {
    meState,
    otherState,
    detectedLang,
    transcripts,
    startListening,
    stopListening,
    isBackendConnected,
    meLang,
    otherLang,
    setMeLang,
    setOtherLang,
  } = useVoiceTranslation();

  const isAnyActive = meState !== "idle" || otherState !== "idle";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h1 className="text-xl font-bold text-foreground">
          <span className="text-primary">Voix</span>
          <span className="text-secondary">Duo</span>
        </h1>
        
        <div className="flex items-center gap-2">
          {!isBackendConnected && (
            <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground">
              Mode démo
            </span>
          )}
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <History className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-between p-6 pb-safe">
        {/* Language detection indicator */}
        <div className="h-12">
          <LanguageIndicator
            detectedLang={detectedLang}
            isListening={meState === "listening" || otherState === "listening"}
          />
        </div>

        {/* Voice buttons - the main interaction */}
        <div className="flex flex-col items-center gap-8 py-8">
          {/* Me section */}
          <div className="flex flex-col items-center gap-3">
            <LanguageSelector
              selectedLang={meLang}
              onSelect={setMeLang}
              variant="me"
            />
            <VoiceButton
              variant="me"
              state={meState}
              label="Moi"
              onPressStart={() => startListening("me")}
              onPressEnd={stopListening}
              disabled={otherState !== "idle"}
            />
          </div>
          
          {/* Other section */}
          <div className="flex flex-col items-center gap-3">
            <LanguageSelector
              selectedLang={otherLang}
              onSelect={setOtherLang}
              variant="other"
            />
            <VoiceButton
              variant="other"
              state={otherState}
              label="L'autre"
              onPressStart={() => startListening("other")}
              onPressEnd={stopListening}
              disabled={meState !== "idle"}
            />
          </div>
        </div>

        {/* Transcript display */}
        <div className="w-full">
          <TranscriptDisplay
            entries={transcripts}
            showText={showText}
            onToggleText={() => setShowText(!showText)}
          />
        </div>

        {/* Instructions */}
        {!isAnyActive && transcripts.length === 0 && (
          <div className="text-center text-muted-foreground space-y-2 mt-4">
            <p className="text-sm">
              👆 Maintenez un bouton et parlez
            </p>
            <p className="text-xs opacity-75">
              La traduction sera lue automatiquement
            </p>
          </div>
        )}
      </main>

      {/* Supported languages footer */}
      <footer className="py-3 text-center border-t border-border/50">
        <div className="flex items-center justify-center gap-4 text-lg">
          <span title="Arabe marocain">🇲🇦</span>
          <span title="Turc">🇹🇷</span>
          <span title="Français">🇫🇷</span>
          <span title="Anglais">🇬🇧</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
