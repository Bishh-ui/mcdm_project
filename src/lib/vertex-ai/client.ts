import { GoogleAuth } from "google-auth-library";

const projectId = process.env.GCP_PROJECT_ID!;
const location = "us-central1"; // Vertex AI region
const MODEL_NAME = "gemini-3-flash-preview";

// Initialize auth
const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.SA_CLIENT_EMAIL,
    private_key: process.env.SA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

/**
 * Call Vertex AI Gemini API directly via REST
 */
async function callGeminiAPI(
  prompt: string,
  systemInstruction?: string,
  config?: {
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: Record<string, unknown>;
  }
): Promise<string> {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${MODEL_NAME}:generateContent`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: systemInstruction
      ? {
          parts: [{ text: systemInstruction }],
        }
      : undefined,
    generationConfig: {
      temperature: config?.temperature ?? 1.0,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: config?.responseMimeType,
      responseSchema: config?.responseSchema,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vertex AI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/**
 * Generate text using Gemini 3 Flash
 */
export async function generateText(
  prompt: string,
  systemInstruction?: string,
  temperature = 1.0
): Promise<string> {
  return callGeminiAPI(prompt, systemInstruction, { temperature });
}

/**
 * Generate structured JSON output using Gemini 3 Flash
 */
export async function generateStructuredOutput<T>(
  prompt: string,
  schema: Record<string, unknown>,
  systemInstruction?: string
): Promise<T> {
  const text = await callGeminiAPI(prompt, systemInstruction, {
    temperature: 0.7,
    responseMimeType: "application/json",
    responseSchema: schema,
  });
  return JSON.parse(text) as T;
}

/**
 * Chat with context (multi-turn conversation)
 */
export async function chat(
  messages: Array<{ role: "user" | "model"; content: string }>,
  systemInstruction?: string
): Promise<string> {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${MODEL_NAME}:generateContent`;

  const requestBody = {
    contents: messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    })),
    systemInstruction: systemInstruction
      ? {
          parts: [{ text: systemInstruction }],
        }
      : undefined,
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vertex AI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
