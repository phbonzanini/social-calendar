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
            content: 'You are a marketing expert. Your task is to analyze dates and return a JSON array. You must ONLY return a valid JSON array with this exact structure: [{"date": "YYYY-MM-DD", "relevance": "high/medium/low", "reason": "brief explanation"}]. Do not include any explanations, text, or formatting outside of the JSON array.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Lower temperature for more consistent outputs
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
    console.log('[OpenAI] Raw response:', JSON.stringify(data));
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const content = data.choices[0].message.content.trim();
    console.log('[OpenAI] Content:', content);

    try {
      const parsedData = JSON.parse(content);
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
        console.log(`[OpenAI] Retrying with more explicit prompt...`);
        const updatedPrompt = `${prompt}\n\nCRITICAL: You must return ONLY a valid JSON array. No text before or after. Format: [{"date": "YYYY-MM-DD", "relevance": "high/medium/low", "reason": "brief explanation"}].\n\nExample of valid response:\n[{"date": "2025-01-01", "relevance": "high", "reason": "New Year's Day"}]`;
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