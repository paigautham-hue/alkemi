import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedProgressBarProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  variant?: "primary" | "secondary" | "accent" | "success";
  className?: string;
}

export function AnimatedProgressBar({
  value,
  label,
  showValue = true,
  variant = "primary",
  className,
}: AnimatedProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Animate from 0 to target value
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);

    return () => clearTimeout(timer);
  }, [value]);

  const variantClasses = {
    primary: "gradient-primary",
    secondary: "gradient-secondary",
    accent: "gradient-accent",
    success: "gradient-success",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">{label}</span>
          {showValue && (
            <span className="text-muted-foreground font-mono">
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}
      <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out shadow-lg",
            variantClasses[variant]
          )}
          style={{ width: `${animatedValue}%` }}
        >
          <div className="absolute inset-0 shimmer opacity-30" />
        </div>
      </div>
    </div>
  );
}

interface ConfidenceMeterProps {
  confidence: number; // 0-1
  label?: string;
  className?: string;
}

export function ConfidenceMeter({
  confidence,
  label,
  className,
}: ConfidenceMeterProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = confidence * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(percentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage]);

  // Color transitions: red (0-40%) → yellow (40-70%) → green (70-100%)
  const getColor = (value: number) => {
    if (value < 40) {
      return "from-red-500 to-orange-500";
    } else if (value < 70) {
      return "from-yellow-500 to-amber-500";
    } else {
      return "from-green-500 to-emerald-500";
    }
  };

  const getTextColor = (value: number) => {
    if (value < 40) {
      return "text-red-600 dark:text-red-400";
    } else if (value < 70) {
      return "text-yellow-600 dark:text-yellow-400";
    } else {
      return "text-green-600 dark:text-green-400";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">{label}</span>
          <span className={cn("font-semibold font-mono", getTextColor(animatedValue))}>
            {Math.round(animatedValue)}%
          </span>
        </div>
      )}
      <div className="h-4 w-full bg-muted/30 rounded-full overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out shadow-lg bg-gradient-to-r",
            getColor(animatedValue)
          )}
          style={{ width: `${animatedValue}%` }}
        >
          <div className="absolute inset-0 animate-pulse opacity-20 bg-white" />
        </div>
      </div>
    </div>
  );
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}
