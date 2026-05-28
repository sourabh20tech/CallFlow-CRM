/** Legacy DB paths pointing at .png assets that ship as .svg in /public */
const LEGACY_AVATAR_MAP: Record<string, string> = {
  "/avatars/agent.png": "/avatars/agent.svg",
  "/avatars/admin.png": "/avatars/admin.svg",
};

/**
 * Resolves avatar URL for display. Maps legacy .png paths to bundled SVGs;
 * returns undefined when empty so AvatarFallback (initials) is used.
 */
export function resolveAvatarSrc(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  return LEGACY_AVATAR_MAP[trimmed] ?? trimmed;
}
