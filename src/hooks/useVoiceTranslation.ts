import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";
export type Speaker = "me" | "other";

export interface TranscriptEntry {
  id: string;
  speaker: Speaker;
  originalText: string;
  translatedText: string;
  originalLang: string;
  targetLang: string;
  timestamp: Date;
}

interface UseVoiceTranslationReturn {
  meState: VoiceState;
  otherState: VoiceState;
  detectedLang: string | null;
  transcripts: TranscriptEntry[];
  startListening: (speaker: Speaker) => void;
  stopListening: () => void;
  isBackendConnected: boolean;
}

// Demo mode - simulates the translation flow
// In production, this would connect to real STT/Translation/TTS APIs
export function useVoiceTranslation(): UseVoiceTranslationReturn {
  const [meState, setMeState] = useState<VoiceState>("idle");
  const [otherState, setOtherState] = useState<VoiceState>("idle");
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isBackendConnected] = useState(false); // Will be true when Cloud is enabled
  const { toast } = useToast();
  
  const currentSpeaker = useRef<Speaker | null>(null);
  const listeningTimeout = useRef<NodeJS.Timeout | null>(null);

  // Demo phrases for simulation
  const demoPhrases: Record<string, { text: string; translation: string; targetLang: string }[]> = {
    ar: [
      { text: "كيف حالك؟", translation: "Nasılsın?", targetLang: "tr" },
      { text: "أحبك", translation: "Seni seviyorum", targetLang: "tr" },
      { text: "ما اسمك؟", translation: "Adın ne?", targetLang: "tr" },
    ],
    tr: [
      { text: "İyiyim, sen nasılsın?", translation: "أنا بخير، وأنت؟", targetLang: "ar" },
      { text: "Seni çok seviyorum", translation: "أحبك كثيرا", targetLang: "ar" },
      { text: "Benim adım...", translation: "اسمي...", targetLang: "ar" },
    ],
    fr: [
      { text: "Comment ça va?", translation: "How are you?", targetLang: "en" },
      { text: "Je t'aime", translation: "I love you", targetLang: "en" },
    ],
    en: [
      { text: "I'm doing well", translation: "Je vais bien", targetLang: "fr" },
      { text: "Nice to meet you", translation: "Enchanté", targetLang: "fr" },
    ],
  };

  const simulateTranslation = useCallback((speaker: Speaker) => {
    // Simulate language detection
    const langs = ["ar", "tr", "fr", "en"];
    const randomLang = langs[Math.floor(Math.random() * langs.length)];
    setDetectedLang(randomLang);

    // Get random phrase
    const phrases = demoPhrases[randomLang];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    // Simulate processing
    setTimeout(() => {
      if (speaker === "me") {
        setMeState("processing");
      } else {
        setOtherState("processing");
      }

      // Add transcript
      setTimeout(() => {
        const newEntry: TranscriptEntry = {
          id: Date.now().toString(),
          speaker,
          originalText: phrase.text,
          translatedText: phrase.translation,
          originalLang: randomLang,
          targetLang: phrase.targetLang,
          timestamp: new Date(),
        };

        setTranscripts((prev) => [...prev, newEntry]);

        // Simulate speaking
        if (speaker === "me") {
          setMeState("speaking");
        } else {
          setOtherState("speaking");
        }

        // Back to idle
        setTimeout(() => {
          if (speaker === "me") {
            setMeState("idle");
          } else {
            setOtherState("idle");
          }
          setDetectedLang(null);
        }, 2000);
      }, 1000);
    }, 500);
  }, []);

  const startListening = useCallback((speaker: Speaker) => {
    if (meState !== "idle" || otherState !== "idle") {
      return; // Already in use
    }

    currentSpeaker.current = speaker;

    if (!isBackendConnected) {
      // Demo mode
      if (speaker === "me") {
        setMeState("listening");
      } else {
        setOtherState("listening");
      }

      // Show a toast first time
      toast({
        title: "Mode démo 🎭",
        description: "Connectez le backend pour la vraie traduction vocale",
      });
    }
  }, [meState, otherState, isBackendConnected, toast]);

  const stopListening = useCallback(() => {
    const speaker = currentSpeaker.current;
    if (!speaker) return;

    if (listeningTimeout.current) {
      clearTimeout(listeningTimeout.current);
    }

    if (!isBackendConnected) {
      // Demo mode - simulate translation
      simulateTranslation(speaker);
    }

    currentSpeaker.current = null;
  }, [isBackendConnected, simulateTranslation]);

  return {
    meState,
    otherState,
    detectedLang,
    transcripts,
    startListening,
    stopListening,
    isBackendConnected,
  };
}
