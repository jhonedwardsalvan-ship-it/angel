import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Both or neither: a half-configured OAuth client fails confusingly at sign-in time. */
function oauthClient(prefix: string) {
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (!clientId && !clientSecret) return null;
  if (!clientId || !clientSecret) {
    throw new Error(`Set both ${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET, or neither`);
  }
  return { clientId, clientSecret };
}

export const env = {
  MONGODB_URI: required("MONGODB_URI"),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  /** Optional. When null, "Continue with Google" is hidden. */
  google: oauthClient("GOOGLE"),
};
