import { corsHeaders } from './cors.ts';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function analyzeRelevantDates(prompt: string): Promise<OpenAIResponse> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const requestBody = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Você é um especialista em marketing que ajuda a identificar datas comemorativas relevantes para diferentes nichos de negócio. Analise as datas fornecidas e retorne apenas as que são realmente relevantes para os nichos especificados, incluindo uma breve explicação do por quê cada data é relevante."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0,
    response_format: { type: "json_object" }
  };

  console.log("[OpenAI] Sending request with prompt:", JSON.stringify(requestBody, null, 2));

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAIApiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OpenAI] Request failed (attempt ${attempt + 1}/${MAX_RETRIES}):`, errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("[OpenAI] Received response:", JSON.stringify(data, null, 2));
      return data;

    } catch (error) {
      lastError = error;
      console.error(`[OpenAI] Error on attempt ${attempt + 1}/${MAX_RETRIES}:`, error);
      
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        console.log(`[OpenAI] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to get valid response from OpenAI after all retries');
}