"use client";

import { useCallback, useState } from "react";

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();

      let x: number, y: number;

      if ("touches" in event) {
        // Touch event
        const touch = event.touches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      } else {
        // Mouse event
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }

      const size = Math.max(rect.width, rect.height) * 2;
      const id = Date.now();

      const newRipple: Ripple = { x, y, size, id };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
      }, 600);
    },
    []
  );

  const clearRipples = useCallback(() => {
    setRipples([]);
  }, []);

  return { ripples, createRipple, clearRipples };
}

interface RippleContainerProps {
  ripples: Ripple[];
  color?: string;
}

export function RippleContainer({
  ripples,
  color = "rgba(0, 0, 0, 0.2)",
}: RippleContainerProps) {
  return (
    <span className="absolute inset-0 overflow-hidden pointer-events-none rounded-inherit">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            borderRadius: "50%",
            transform: "translate(-50%, -50%) scale(0)",
            opacity: 1,
          }}
        />
      ))}
    </span>
  );
}
