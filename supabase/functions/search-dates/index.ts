import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();

    console.log('Received request for niches:', niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching all dates from database...');

    // Fetch ALL dates from the database
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log(`Found ${allDates.length} total dates in database`);

    // Filter dates based on niches and always include holidays/commemorative dates
    const relevantDates = allDates.filter(date => {
      // Always include holidays
      if (date.tipo === 'holiday') {
        return true;
      }

      // For dates with niches, check if any selected niche matches
      if (date.niches && Array.isArray(date.niches)) {
        const hasMatchingNiche = date.niches.some(niche => 
          niches.includes(niche.toLowerCase())
        );
        
        if (hasMatchingNiche) {
          console.log(`Found matching date for niches:`, {
            date: date.data,
            description: date.descrição,
            matchingNiches: date.niches.filter(niche => 
              niches.includes(niche.toLowerCase())
            )
          });
          return true;
        }
      }

      // Include general commemorative dates that don't have specific niches
      if (date.tipo === 'commemorative' && (!date.niches || date.niches.length === 0)) {
        return true;
      }

      return false;
    });

    console.log(`Filtered down to ${relevantDates.length} relevant dates`);

    // Remove duplicates based on date and title
    const uniqueDates = Array.from(new Map(
      relevantDates.map(date => [date.data + date.descrição, date])
    ).values());

    console.log(`After removing duplicates: ${uniqueDates.length} dates`);

    // Format dates for response
    const formattedDates = uniqueDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo,
      description: date.descrição,
    }));

    // Sort dates chronologically
    formattedDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('Returning formatted dates:', formattedDates);

    return new Response(
      JSON.stringify({ dates: formattedDates }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Error in search-dates function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao processar a busca de datas. Por favor, tente novamente.'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});