"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollThrottle } from '@/hooks/use-scroll-throttle';

interface ScrollThrottleIndicatorProps {
  className?: string;
}

export function ScrollThrottleIndicator({ className = '' }: ScrollThrottleIndicatorProps) {
  const { isThrottling, currentSpeed, maxSpeed, safeSpeed } = useScrollThrottle({
    enabled: true,
  });

  const speedPercentage = Math.min((currentSpeed / maxSpeed) * 100, 100);
  const isNearLimit = speedPercentage > 80;

  return (
    <AnimatePresence>
      {isThrottling && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`fixed top-4 right-4 z-50 ${className}`}
        >
          <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg border border-white/10">
            <div className="flex items-center gap-2 text-sm">
              <motion.div
                animate={{
                  scale: isNearLimit ? [1, 1.2, 1] : 1,
                  rotate: isNearLimit ? [0, 180, 360] : 0,
                }}
                transition={{
                  duration: 0.6,
                  repeat: isNearLimit ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className={`w-2 h-2 rounded-full ${
                  isNearLimit ? 'bg-yellow-400' : 'bg-blue-400'
                }`}
              />
              <span className="font-medium">
                Замедление скролла
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-2 w-full bg-white/20 rounded-full h-1 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${speedPercentage}%` }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className={`h-full rounded-full transition-colors ${
                  speedPercentage > 80 ? 'bg-yellow-400' : 'bg-blue-400'
                }`}
              />
            </div>

            {/* Speed info */}
            <div className="mt-1 flex justify-between text-xs text-white/70">
              <span>{Math.round(currentSpeed)}px/s</span>
              <span>{Math.round(maxSpeed)}px/s</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}