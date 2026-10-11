/**
 * Environment validation — runs at startup.
 * Fail loudly if required variables are missing.
 */
const REQUIRED = [
  "MONGODB_URI",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];

const WARNINGS = [
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_FROM",
];

export function validateEnv() {
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `\n\n❌  Missing required environment variables:\n${missing.map(k => `   • ${k}`).join("\n")}\n\nPlease fill in your .env.local file.\n`
    );
  }
  const warned = WARNINGS.filter(k => !process.env[k]);
  if (warned.length > 0) {
    console.warn(`⚠️  Optional env vars not set (email will be disabled): ${warned.join(", ")}`);
  }
}
