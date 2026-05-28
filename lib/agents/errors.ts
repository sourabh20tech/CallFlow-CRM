export class AgentEmailExistsError extends Error {
  constructor(message = "An account with this email already exists.") {
    super(message);
    this.name = "AgentEmailExistsError";
  }
}

export function isAgentEmailExistsError(error: unknown): boolean {
  if (error instanceof AgentEmailExistsError) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("already exists") ||
    message.includes("already registered") ||
    message.includes("duplicate") ||
    message.includes("user already")
  );
}
