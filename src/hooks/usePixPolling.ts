"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PixStatusResponse } from "@/types";

interface UsePixPollingOptions {
  pixPaymentId: number | null;
  interval?: number;
}

export function usePixPolling({
  pixPaymentId,
  interval = 5000,
}: UsePixPollingOptions) {
  const [status, setStatus] = useState<PixStatusResponse["status"]>("pending");
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const checkStatus = useCallback(async () => {
    if (!pixPaymentId) return;

    try {
      const res = await fetch(`/api/pix/status/${pixPaymentId}`);
      const result = await res.json();

      if (result.success && result.data) {
        const { status: newStatus, paidAt: newPaidAt } = result.data;
        setStatus(newStatus);
        setPaidAt(newPaidAt);

        if (
          newStatus === "approved" ||
          newStatus === "expired" ||
          newStatus === "rejected"
        ) {
          stop();
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, [pixPaymentId, stop]);

  useEffect(() => {
    if (!pixPaymentId) return;

    setStatus("pending");
    setPaidAt(null);
    setIsPolling(true);

    // Check immediately
    checkStatus();

    intervalRef.current = setInterval(checkStatus, interval);

    return () => {
      stop();
    };
  }, [pixPaymentId, interval, checkStatus, stop]);

  return { status, paidAt, isPolling };
}
