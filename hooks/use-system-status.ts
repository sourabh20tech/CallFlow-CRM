"use client";

import { useSystemStatusContext } from "@/contexts/system-status-context";

export function useSystemStatus() {
  return useSystemStatusContext();
}
