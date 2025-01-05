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
  const { data: allDates, error: dbError } = await supabase
    .from('datas_2025')
    .select('*');

  if (dbError) {
    console.error('[ERROR] Database error:', dbError);
    throw new Error(`Database error: ${dbError.message}`);
  }

  return allDates || [];
}

export function formatDatesForAnalysis(dates: any[]): DateAnalysis[] {
  return dates.map(date => ({
    date: date.data,
    title: date.descrição,
    category: date.tipo?.toLowerCase() || 'commemorative'
  }));
}

export function parseRelevantDates(gptContent: string): any[] {
  try {
    return JSON.parse(gptContent);
  } catch (firstError) {
    console.error('[ERROR] First parse attempt failed:', firstError);
    const jsonMatch = gptContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    console.error('[ERROR] Failed to parse GPT content:', firstError);
    console.error('[ERROR] GPT content was:', gptContent);
    throw new Error('Failed to parse GPT response as JSON');
  }
}