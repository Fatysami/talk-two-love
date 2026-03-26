import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  meLang: string;
  otherLang: string;
  setMeLang: (lang: string) => void;
  setOtherLang: (lang: string) => void;
}

const LANGUAGE_CODES: Record<string, string> = {
  'ar': 'ar-MA',
  'tr': 'tr-TR',
  'fr': 'fr-FR',
  'en': 'en-US',
};

const isSpeechRecognitionSupported = (): boolean =>
  'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

const isSpeechSynthesisSupported = (): boolean =>
  'speechSynthesis' in window;

export function useVoiceTranslation(): UseVoiceTranslationReturn {
  const [meState, setMeState] = useState<VoiceState>("idle");
  const [otherState, setOtherState] = useState<VoiceState>("idle");
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [meLang, setMeLang] = useState<string>("ar");
  const [otherLang, setOtherLang] = useState<string>("tr");
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef<string>("");
  const interimRef = useRef<string>("");
  const isStoppingRef = useRef<boolean>(false);
  const speakerRef = useRef<Speaker>("me");
  const isBackendConnected = isSpeechRecognitionSupported() && isSpeechSynthesisSupported();

  const getTargetLang = useCallback((speaker: Speaker): string => {
    return speaker === "me" ? otherLang : meLang;
  }, [meLang, otherLang]);

  const getSourceLang = useCallback((speaker: Speaker): string => {
    return speaker === "me" ? meLang : otherLang;
  }, [meLang, otherLang]);

  const translateText = useCallback(async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('translate', {
      body: { text, sourceLang, targetLang }
    });
    if (error) {
      console.error('Translation error:', error);
      throw new Error('Translation failed');
    }
    return data.translatedText;
  }, []);

  const speakText = useCallback((text: string, lang: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSpeechSynthesisSupported()) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANGUAGE_CODES[lang] || lang;
      utterance.rate = 1.1;
      utterance.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const langCode = LANGUAGE_CODES[lang] || lang;
      const voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
      if (voice) utterance.voice = voice;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const processRecognizedSpeech = useCallback(async (
    transcript: string,
    speaker: Speaker
  ) => {
    const setState = speaker === "me" ? setMeState : setOtherState;
    const sourceLang = getSourceLang(speaker);
    const targetLang = getTargetLang(speaker);

    try {
      setState("processing");
      const translatedText = await translateText(transcript, sourceLang, targetLang);

      const newEntry: TranscriptEntry = {
        id: Date.now().toString(),
        speaker,
        originalText: transcript,
        translatedText,
        originalLang: sourceLang,
        targetLang,
        timestamp: new Date(),
      };
      setTranscripts([newEntry]);

      // TTS removed - translation only
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Erreur",
        description: "La traduction a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setState("idle");
      setDetectedLang(null);
    }
  }, [getSourceLang, getTargetLang, translateText, speakText, toast]);

  const startListening = useCallback((speaker: Speaker) => {
    if (meState !== "idle" || otherState !== "idle") return;

    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Non supporté",
        description: "Utilisez Chrome ou Edge pour la reconnaissance vocale.",
        variant: "destructive",
      });
      return;
    }

    const setState = speaker === "me" ? setMeState : setOtherState;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    const langCode = LANGUAGE_CODES[getSourceLang(speaker)] || getSourceLang(speaker);

    fullTranscriptRef.current = "";
    interimRef.current = "";
    isStoppingRef.current = false;
    speakerRef.current = speaker;

    const createRecognition = () => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = langCode;

      recognition.onstart = () => {
        setState("listening");
      };

      recognition.onresult = (event: any) => {
        let finalText = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }
        if (finalText) {
          fullTranscriptRef.current += finalText;
        }
        interimRef.current = interim;
        setDetectedLang(getSourceLang(speakerRef.current));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone bloqué",
            description: "Autorisez l'accès au microphone.",
            variant: "destructive",
          });
          setState("idle");
        }
        // For other errors (network, aborted), let onend handle restart
      };

      recognition.onend = () => {
        if (!isStoppingRef.current) {
          // Auto-restart for long dictation (browser cuts after ~60s)
          try {
            const newRecognition = createRecognition();
            recognitionRef.current = newRecognition;
            newRecognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            const text = (fullTranscriptRef.current + interimRef.current).trim();
            if (text) {
              processRecognizedSpeech(text, speakerRef.current);
            } else {
              setState("idle");
            }
          }
          return;
        }
        // User stopped — process all accumulated text
        const text = (fullTranscriptRef.current + interimRef.current).trim();
        if (text) {
          processRecognizedSpeech(text, speakerRef.current);
        } else {
          setState("idle");
        }
      };

      return recognition;
    };

    const recognition = createRecognition();
    recognitionRef.current = recognition;
    recognition.start();
  }, [meState, otherState, getSourceLang, processRecognizedSpeech, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
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
  };
}
