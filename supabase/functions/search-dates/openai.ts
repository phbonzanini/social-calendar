import { corsHeaders } from './cors.ts';

const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

export async function callOpenAI(prompt: string, retryCount = 0): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  try {
    console.log(`[OpenAI] Attempt ${retryCount + 1}/${MAX_RETRIES}`);
    console.log('[OpenAI] Sending prompt:', prompt);
    
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
            content: 'You are a marketing expert specialized in analyzing commemorative dates and their relevance to specific business niches. You MUST return ONLY a JSON array of dates in this exact format: [{"date": "YYYY-MM-DD", "relevance": "high/medium/low", "reason": "brief explanation"}]. Do not include any additional text or explanations outside the JSON array.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error(`[OpenAI] Error status: ${response.status}`);
      const errorText = await response.text();
      console.error('[OpenAI] Error details:', errorText);

      if (response.status === 429 && retryCount < MAX_RETRIES) {
        console.log(`[OpenAI] Rate limited. Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return callOpenAI(prompt, retryCount + 1);
      }

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[OpenAI] Raw response:', JSON.stringify(data));
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const content = data.choices[0].message.content.trim();
    console.log('[OpenAI] Parsed content:', content);

    try {
      // Try to parse the entire response first
      const parsedData = JSON.parse(content);
      if (!Array.isArray(parsedData)) {
        throw new Error('Response is not an array');
      }
      return parsedData;
    } catch (parseError) {
      console.log('[OpenAI] Failed to parse entire response, trying to extract JSON array');
      // Try to extract JSON array from the response using regex
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsedData)) {
          throw new Error('Extracted data is not an array');
        }
        return parsedData;
      }
      throw new Error('Could not extract valid JSON from OpenAI response');
    }
  } catch (error) {
    console.error('[OpenAI] Error:', error);
    if (retryCount < MAX_RETRIES) {
      console.log(`[OpenAI] Error occurred. Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return callOpenAI(prompt, retryCount + 1);
    }
    throw error;
  }
}