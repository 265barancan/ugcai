/**
 * Environment variable validation utility
 * Validates required environment variables at startup
 */

interface EnvConfig {
  REPLICATE_API_TOKEN: string;
  ELEVENLABS_API_KEY: string;
  ELEVENLABS_VOICE_ID?: string;
  NEXT_PUBLIC_APP_URL?: string;
  GEMINI_API_KEY?: string;
  GROK_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  FAL_API_KEY?: string;
  HUGGINGFACE_API_KEY?: string;
}

const requiredEnvVars = ["REPLICATE_API_TOKEN", "ELEVENLABS_API_KEY"] as const;
const optionalEnvVars = ["ELEVENLABS_VOICE_ID", "NEXT_PUBLIC_APP_URL", "GEMINI_API_KEY", "GROK_API_KEY", "DEEPSEEK_API_KEY", "FAL_API_KEY", "HUGGINGFACE_API_KEY"] as const;

export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value || value.trim() === "") {
      errors.push(`${envVar} is required but not set`);
    } else if (value.length < 10) {
      errors.push(`${envVar} appears to be invalid (too short)`);
    }
  }

  // Validate REPLICATE_API_TOKEN format (should start with r8_)
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (replicateToken && !replicateToken.startsWith("r8_")) {
    errors.push("REPLICATE_API_TOKEN should start with 'r8_'");
  }

  // Validate ELEVENLABS_API_KEY format (should be a valid API key)
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  if (elevenlabsKey && elevenlabsKey.length < 20) {
    errors.push("ELEVENLABS_API_KEY appears to be invalid (too short)");
  }

  // Validate ELEVENLABS_VOICE_ID format if provided (should be 21 characters)
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (voiceId && !/^[a-zA-Z0-9]{21}$/.test(voiceId)) {
    errors.push("ELEVENLABS_VOICE_ID should be 21 alphanumeric characters");
  }

  // Validate NEXT_PUBLIC_APP_URL format if provided (should be a valid URL)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      new URL(appUrl);
    } catch {
      errors.push("NEXT_PUBLIC_APP_URL should be a valid URL");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getEnv(): EnvConfig {
  const validation = validateEnv();
  
  if (!validation.valid) {
    throw new Error(
      `Environment validation failed:\n${validation.errors.join("\n")}`
    );
  }

  return {
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN!,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY!,
    ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

// Validate on module load (server-side only)
if (typeof window === "undefined") {
  const validation = validateEnv();
  if (!validation.valid) {
    console.warn(
      "⚠️ Environment validation warnings:\n" +
      validation.errors.map((e) => `  - ${e}`).join("\n") +
      "\n\nSome features may not work correctly."
    );
  }
}

