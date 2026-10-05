export function getAuthErrorMessage(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again."
) {
  if (typeof error !== "object" || error === null) {
    return fallbackMessage;
  }

  const authError = error as {
    code?: unknown;
    message?: unknown;
    status?: unknown;
  };

  const normalizedMessage = [authError.code, authError.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .replaceAll("_", " ")
    .toLowerCase();

  if (
    authError.status === 429 ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests") ||
    normalizedMessage.includes("too many attempts")
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("confirm your email") ||
    normalizedMessage.includes("email is not confirmed")
  ) {
    return "Please verify your email before signing in.";
  }

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials") ||
    normalizedMessage.includes("wrong password")
  ) {
    return "Email or password is incorrect.";
  }

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("user already registered")
  ) {
    return "An account with this email already exists.";
  }

  return fallbackMessage;
}
