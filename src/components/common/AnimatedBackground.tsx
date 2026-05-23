import type { AnimatedBackgroundIntensity } from "@/lib/user/animated-background-intensity";
import { cn } from "@/lib/utils";

export type { AnimatedBackgroundIntensity };

type AnimatedBackgroundProps = {
  intensity?: AnimatedBackgroundIntensity;
};

export function AnimatedBackground({ intensity = "normal" }: AnimatedBackgroundProps) {
  if (intensity === "none") {
    return null;
  }

  return (
    <div
      className={cn("sr-animated-bg", `sr-animated-bg--${intensity}`)}
      aria-hidden="true"
    >
      <div className="sr-animated-bg__gradient" />
      <div className="sr-animated-bg__grid" />
    </div>
  );
}
