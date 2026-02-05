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

// Language mapping for Web Speech API
const LANGUAGE_CODES: Record<string, string> = {
  'ar': 'ar-MA', // Moroccan Arabic
  'tr': 'tr-TR',
  'fr': 'fr-FR',
  'en': 'en-US',
};


// Check if Web Speech API is supported
const isSpeechRecognitionSupported = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

const isSpeechSynthesisSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

export function useVoiceTranslation(): UseVoiceTranslationReturn {
  const [meState, setMeState] = useState<VoiceState>("idle");
  const [otherState, setOtherState] = useState<VoiceState>("idle");
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [meLang, setMeLang] = useState<string>("ar");
  const [otherLang, setOtherLang] = useState<string>("fr");
  const { toast } = useToast();
  
  const currentSpeaker = useRef<Speaker | null>(null);
  const recognitionRef = useRef<any>(null);
  const isBackendConnected = isSpeechRecognitionSupported() && isSpeechSynthesisSupported();

  // Get target language based on speaker's selected language
  const getTargetLang = useCallback((speaker: Speaker): string => {
    // If "me" speaks, translate to "other"'s language and vice versa
    return speaker === "me" ? otherLang : meLang;
  }, [meLang, otherLang]);

  // Get source language based on speaker
  const getSourceLang = useCallback((speaker: Speaker): string => {
    return speaker === "me" ? meLang : otherLang;
  }, [meLang, otherLang]);

  // Translate text using Lovable AI
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

  // Speak text using Web Speech API
  const speakText = useCallback((text: string, lang: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSpeechSynthesisSupported()) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANGUAGE_CODES[lang] || lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Try to find a voice for the language
      const voices = window.speechSynthesis.getVoices();
      const langCode = LANGUAGE_CODES[lang] || lang;
      const voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Process the recognized speech
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

      // Add to transcripts
      const newEntry: TranscriptEntry = {
        id: Date.now().toString(),
        speaker,
        originalText: transcript,
        translatedText,
        originalLang: sourceLang,
        targetLang,
        timestamp: new Date(),
      };
      setTranscripts(prev => [...prev, newEntry]);

      // Speak the translation
      setState("speaking");
      await speakText(translatedText, targetLang);
      
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
    if (meState !== "idle" || otherState !== "idle") {
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Non supporté",
        description: "Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Edge.",
        variant: "destructive",
      });
      return;
    }

    currentSpeaker.current = speaker;
    const setState = speaker === "me" ? setMeState : setOtherState;

    // Create speech recognition instance
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    // Enable multiple language detection
    // We'll try to detect from the supported languages
    recognition.lang = ''; // Empty for auto-detection (may not work in all browsers)
    
    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const transcript = result[0].transcript;
        const sourceLang = getSourceLang(speaker);
        setDetectedLang(sourceLang);
        processRecognizedSpeech(transcript, speaker);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setState("idle");
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone bloqué",
          description: "Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      // Recognition ended - reset to idle
      setMeState("idle");
      setOtherState("idle");
    };

    recognitionRef.current = recognition;
    
    // Use the selected language for the speaker
    const langCode = LANGUAGE_CODES[getSourceLang(speaker)] || getSourceLang(speaker);
    recognition.lang = langCode;
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

// Simple language detection based on character patterns
function detectLanguageFromText(text: string): string {
  // Check for Arabic characters
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar';
  }
  // Check for Turkish-specific characters
  if (/[ğüşıöçĞÜŞİÖÇ]/.test(text)) {
    return 'tr';
  }
  // Check for French-specific patterns
  if (/[àâäéèêëïîôùûüÿçœæ]/i.test(text) || /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des)\b/i.test(text)) {
    return 'fr';
  }
  // Default to English
  return 'en';
}
