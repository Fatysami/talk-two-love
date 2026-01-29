import { cn } from "@/lib/utils";

interface SoundWaveProps {
  isActive: boolean;
  variant: "me" | "other";
  className?: string;
}

export function SoundWave({ isActive, variant, className }: SoundWaveProps) {
  const barColor = variant === "me" ? "bg-primary-foreground" : "bg-secondary-foreground";
  
  return (
    <div className={cn("flex items-center justify-center gap-1 h-8", className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-300",
            barColor,
            isActive ? "sound-wave-bar" : "h-2 opacity-50"
          )}
          style={{
            height: isActive ? `${Math.random() * 16 + 16}px` : "8px",
          }}
        />
      ))}
    </div>
  );
}
