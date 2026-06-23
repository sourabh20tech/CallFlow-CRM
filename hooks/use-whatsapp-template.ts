"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_TEMPLATE = "Hello {name},\nThank you for your interest.\nRegards, {agent_name}";

let cached: string | null = null;

export function useWhatsAppTemplate() {
  const [template, setTemplate] = useState(cached ?? DEFAULT_TEMPLATE);
  const [isLoading, setIsLoading] = useState(!cached);

  useEffect(() => {
    if (cached) {
      setTemplate(cached);
      setIsLoading(false);
      return;
    }

    fetch("/api/agent/whatsapp-template")
      .then((res) => res.json())
      .then((data) => {
        const t = data.template ?? DEFAULT_TEMPLATE;
        cached = t;
        setTemplate(t);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const invalidate = useCallback(() => { cached = null; }, []);

  return { template, isLoading, invalidate, setTemplate };
}

/**
 * Replace template variables with actual lead data.
 * Supported: {name}, {phone}, {status}, {source}, {agent_name}
 */
export function resolveTemplate(
  template: string,
  vars: {
    name?: string;
    phone?: string;
    status?: string;
    source?: string;
    agentName?: string;
  },
): string {
  return template
    .replace(/\{name\}/gi, vars.name ?? "")
    .replace(/\{phone\}/gi, vars.phone ?? "")
    .replace(/\{status\}/gi, vars.status ?? "")
    .replace(/\{source\}/gi, vars.source ?? "")
    .replace(/\{agent_name\}/gi, vars.agentName ?? "")
    .trim();
}
