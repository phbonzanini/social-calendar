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
            content: 'You are a JSON-only response bot. You must return ONLY a JSON object with a dates array containing objects with date, relevance, and reason fields.' 
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

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (initialError) {
        console.error('[OpenAI] Initial parse error:', initialError);
        throw new Error('Failed to parse OpenAI response as JSON');
      }

      // Ensure we have a dates array
      if (!parsedData?.dates || !Array.isArray(parsedData.dates)) {
        console.error('[OpenAI] Response missing dates array:', parsedData);
        throw new Error('Response missing dates array');
      }

      // Validate each item in the dates array
      parsedData.dates.forEach((item: any, index: number) => {
        if (!item.date || !item.relevance || !item.reason) {
          throw new Error(`Invalid item at index ${index}: missing required fields`);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
          throw new Error(`Invalid date format at index ${index}: ${item.date}`);
        }
        if (!['high', 'medium', 'low'].includes(item.relevance)) {
          throw new Error(`Invalid relevance value at index ${index}: ${item.relevance}`);
        }
      });

      console.log('[OpenAI] Successfully validated response:', parsedData.dates);
      return parsedData.dates;
      
    } catch (parseError) {
      console.error('[OpenAI] Parse/validation error:', parseError);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`[OpenAI] Retrying with strict prompt...`);
        const strictPrompt = `Return a JSON object with a dates array containing objects with exactly these fields: date (YYYY-MM-DD), relevance (high/medium/low), and reason (string). Example: {"dates":[{"date":"2025-01-01","relevance":"high","reason":"New Year"}]}. Original prompt: ${prompt}`;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return callOpenAI(strictPrompt, retryCount + 1);
      }
      
      throw parseError;
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