import { cn } from "@/lib/utils";
import { Mic, Volume2 } from "lucide-react";
import { SoundWave } from "./SoundWave";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceButtonProps {
  variant: "me" | "other";
  state: VoiceState;
  label: string;
  onPressStart: () => void;
  onPressEnd: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  variant,
  state,
  label,
  onPressStart,
  onPressEnd,
  disabled = false,
}: VoiceButtonProps) {
  const isActive = state === "listening";
  const isSpeaking = state === "speaking";
  const isProcessing = state === "processing";

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!disabled) onPressStart();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    onPressEnd();
  };

  const handleMouseDown = () => {
    if (!disabled) onPressStart();
  };

  const handleMouseUp = () => {
    onPressEnd();
  };

  return (
    <button
      className={cn(
        "voice-button",
        variant === "me" ? "voice-button-me" : "voice-button-other",
        isActive && "listening",
        isProcessing && "processing",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled}
      aria-label={label}
    >
      {/* Icon */}
      <div className="relative">
        {isActive ? (
          <SoundWave isActive={true} variant={variant} />
        ) : isSpeaking ? (
          <Volume2 className="w-12 h-12 animate-pulse-scale" />
        ) : (
          <Mic className={cn("w-12 h-12", isProcessing && "animate-pulse")} />
        )}
      </div>

      {/* Label */}
      <span className="text-xl font-bold tracking-wide">{label}</span>

      {/* State indicator */}
      {isProcessing && (
        <span className="text-sm opacity-80">Traduction...</span>
      )}
      {isSpeaking && (
        <span className="text-sm opacity-80">🔊</span>
      )}
    </button>
  );
}
