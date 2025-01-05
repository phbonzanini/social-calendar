import { corsHeaders } from './cors.ts';

const RETRY_DELAY = 2000;
const MAX_RETRIES = 3;

export async function callOpenAI(prompt: string, retryCount = 0): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }

  try {
    console.log(`[OpenAI] Attempt ${retryCount + 1}/${MAX_RETRIES}`);
    
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
            content: 'You are a JSON-only response bot. Return an array of date objects, each with date (YYYY-MM-DD), relevance (high/medium/low), and reason fields. Example: [{"date":"2025-01-01","relevance":"high","reason":"New Year"}]'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        response_format: { type: "json_object" },
        max_tokens: 1000,
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
    console.log('[OpenAI] Raw response:', data);
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const content = data.choices[0].message.content.trim();
    console.log('[OpenAI] Content:', content);

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (error) {
      console.error('[OpenAI] Parse error:', error);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    // Extract dates array from response
    const dates = parsedData.dates || parsedData;
    if (!Array.isArray(dates)) {
      throw new Error('Response is not an array');
    }

    // Validate each date object
    dates.forEach((item: any, index: number) => {
      if (!item.date || !item.relevance || !item.reason) {
        throw new Error(`Invalid date object at index ${index}: missing required fields`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
        throw new Error(`Invalid date format at index ${index}: ${item.date}`);
      }
      if (!['high', 'medium', 'low'].includes(item.relevance)) {
        throw new Error(`Invalid relevance value at index ${index}: ${item.relevance}`);
      }
    });

    console.log('[OpenAI] Successfully validated response:', dates);
    return dates;

  } catch (error) {
    console.error('[OpenAI] Error:', error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`[OpenAI] Retrying with simplified prompt...`);
      const simplifiedPrompt = `Return an array of date objects. Each date must have date (YYYY-MM-DD), relevance (high/medium/low), and reason. Example: [{"date":"2025-01-01","relevance":"high","reason":"New Year"}]. Original prompt: ${prompt}`;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return callOpenAI(simplifiedPrompt, retryCount + 1);
    }
    
    throw error;
  }
}