import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export interface DateAnalysis {
  date: string;
  title: string;
  category: string;
}

export async function fetchDatesFromDB() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('[dateUtils] Fetching dates from datas_2025 table');
  const { data: allDates, error: dbError } = await supabase
    .from('datas_2025')
    .select('*')
    .order('data', { ascending: true });

  if (dbError) {
    console.error('[dateUtils] Database error:', dbError);
    throw new Error(`Database error: ${dbError.message}`);
  }

  if (!allDates || allDates.length === 0) {
    console.warn('[dateUtils] No dates found in database');
  } else {
    console.log(`[dateUtils] Found ${allDates.length} dates`);
  }

  return allDates || [];
}

export function formatDatesForAnalysis(dates: any[]): DateAnalysis[] {
  return dates
    .filter(date => date.data && date.descrição) // Only include dates with required fields
    .map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo?.toLowerCase() || 'commemorative'
    }));
}

export function parseRelevantDates(gptContent: string): any[] {
  try {
    return JSON.parse(gptContent);
  } catch (firstError) {
    console.error('[dateUtils] First parse attempt failed:', firstError);
    
    // Try to extract JSON from the response if it's wrapped in text
    const jsonMatch = gptContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (secondError) {
        console.error('[dateUtils] Second parse attempt failed:', secondError);
      }
    }
    
    console.error('[dateUtils] GPT content was:', gptContent);
    throw new Error('Failed to parse GPT response as JSON');
  }
}