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
            content: 'You are a marketing expert. Analyze dates and return ONLY a JSON array in this format: [{"date": "YYYY-MM-DD", "relevance": "high/medium/low", "reason": "brief explanation"}]. No additional text.' 
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
    console.log('[OpenAI] Content:', content);

    try {
      // First attempt: direct JSON parse
      const parsedData = JSON.parse(content);
      console.log('[OpenAI] Successfully parsed JSON directly');
      
      if (!Array.isArray(parsedData)) {
        throw new Error('Response is not an array');
      }
      
      return parsedData;
    } catch (parseError) {
      console.log('[OpenAI] Direct parse failed, attempting to extract JSON array');
      
      // Second attempt: try to find JSON array in the content
      const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];
          console.log('[OpenAI] Found JSON array:', extractedJson);
          
          const parsedData = JSON.parse(extractedJson);
          if (!Array.isArray(parsedData)) {
            throw new Error('Extracted data is not an array');
          }
          
          return parsedData;
        } catch (extractError) {
          console.error('[OpenAI] Failed to parse extracted JSON:', extractError);
          throw new Error('Failed to parse extracted JSON array');
        }
      }
      
      console.error('[OpenAI] No valid JSON array found in response');
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