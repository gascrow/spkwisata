"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2 } from "lucide-react";

type LoadingState = {
  text: string;
};

const LoaderCore = ({
  loadingStates,
  value = 0,
}: {
  loadingStates: LoadingState[];
  value?: number;
}) => {
  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      {loadingStates.map((loadingState, index) => {
        const isCompleted = index < value;
        const isActive = index === value;
        const isPending = index > value;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: isPending ? 0.3 : 1,
              x: 0,
            }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            {/* Step indicator */}
            <div className="shrink-0">
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <Check className="h-4 w-4 text-white stroke-[3]" />
                </motion.div>
              ) : isActive ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="h-7 w-7 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20"
                >
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                </motion.div>
              ) : (
                <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                </div>
              )}
            </div>

            {/* Step text */}
            <span
              className={cn(
                "text-sm font-medium transition-all duration-300",
                isCompleted && "text-emerald-400 line-through decoration-emerald-500/40",
                isActive && "text-white font-bold text-[15px]",
                isPending && "text-white/30 font-normal"
              )}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 2000,
  loop = true,
  value,
  title = "Kalkulasi TOPSIS",
  subtitle = "Memproses perhitungan perankingan alternatif...",
}: {
  loadingStates: LoadingState[];
  loading?: boolean;
  duration?: number;
  loop?: boolean;
  value?: number;
  title?: string;
  subtitle?: string;
}) => {
  const [currentState, setCurrentState] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (value !== undefined) {
      setCurrentState(value);
      return;
    }
    if (!loading) {
      setCurrentState(0);
      return;
    }
    const timeout = setTimeout(() => {
      setCurrentState((prevState) =>
        loop
          ? prevState === loadingStates.length - 1
            ? 0
            : prevState + 1
          : Math.min(prevState + 1, loadingStates.length - 1)
      );
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration, value]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ width: "100vw", height: "100vh", top: 0, left: 0 }}
        >
          {/* Full-screen solid dark background */}
          <div className="absolute inset-0 bg-slate-950" />

          {/* Subtle gradient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />

          {/* Centered content */}
          <div className="relative z-10 flex flex-col items-center gap-8 px-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-2"
            >
              <h2 className="text-xl font-bold text-white tracking-tight">
                {title}
              </h2>
              <p className="text-sm text-white/40 font-medium">
                {subtitle}
              </p>
            </motion.div>

            {/* Progress bar */}
            <div className="w-full max-w-md">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${((currentState + 1) / loadingStates.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-white/30 font-mono font-bold">
                  Tahap {currentState + 1}/{loadingStates.length}
                </span>
                <span className="text-[11px] text-white/30 font-mono font-bold">
                  {Math.round(((currentState + 1) / loadingStates.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Steps list */}
            <LoaderCore value={currentState} loadingStates={loadingStates} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
