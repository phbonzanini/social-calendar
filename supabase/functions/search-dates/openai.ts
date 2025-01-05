import { corsHeaders } from './cors.ts';

const RETRY_AFTER_MS = 3000;
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 1.5;

export async function callOpenAI(prompt: string): Promise<any> {
  return callOpenAIWithRetry(prompt);
}

async function callOpenAIWithRetry(prompt: string, retryCount = 0): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const waitTime = RETRY_AFTER_MS * Math.pow(BACKOFF_MULTIPLIER, retryCount);
  
  try {
    console.log(`[DEBUG] Attempt ${retryCount + 1}/${MAX_RETRIES} to call OpenAI API`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a marketing expert. Return only a JSON array of relevant dates.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      console.error(`[ERROR] OpenAI API response status: ${response.status}`);
      const errorText = await response.text();
      console.error(`[ERROR] OpenAI API error details:`, errorText);

      if (response.status === 429 && retryCount < MAX_RETRIES) {
        console.log(`[INFO] Rate limited, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return callOpenAIWithRetry(prompt, retryCount + 1);
      }

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[DEBUG] Successfully received OpenAI API response`);
    return data;

  } catch (error) {
    console.error(`[ERROR] Error in OpenAI API call:`, error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`[INFO] Retrying after error, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return callOpenAIWithRetry(prompt, retryCount + 1);
    }
    throw error;
  }
}