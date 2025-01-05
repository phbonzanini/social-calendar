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
            content: 'You are a marketing expert. You must return ONLY a valid JSON array with dates. The array must contain objects with exactly these fields: date (YYYY-MM-DD format), relevance (high/medium/low), and reason (brief text). Example: [{"date":"2025-01-01","relevance":"high","reason":"New Year"}]. No other text or formatting allowed.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
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
      // First, try to extract just the JSON array if there's any extra text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      
      const parsedData = JSON.parse(jsonContent);
      console.log('[OpenAI] Successfully parsed JSON:', parsedData);
      
      if (!Array.isArray(parsedData)) {
        throw new Error('Response is not an array');
      }
      
      if (parsedData.length === 0) {
        throw new Error('Response array is empty');
      }

      // Validate array items
      parsedData.forEach((item, index) => {
        if (!item.date || !item.relevance || !item.reason) {
          throw new Error(`Invalid item at index ${index}: missing required fields`);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
          throw new Error(`Invalid date format at index ${index}`);
        }
        if (!['high', 'medium', 'low'].includes(item.relevance)) {
          throw new Error(`Invalid relevance value at index ${index}`);
        }
      });

      return parsedData;
      
    } catch (parseError) {
      console.error('[OpenAI] Parse/validation error:', parseError);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`[OpenAI] Retrying with simplified prompt...`);
        const updatedPrompt = `Return ONLY a JSON array like this: [{"date":"2025-01-01","relevance":"high","reason":"New Year"}]. Dates to analyze: ${prompt}`;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return callOpenAI(updatedPrompt, retryCount + 1);
      }
      
      throw new Error(`Failed to get valid JSON response after ${MAX_RETRIES} attempts`);
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