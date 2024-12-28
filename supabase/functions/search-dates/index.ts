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

    console.log('Querying database for dates...');

    // Primeiro, buscar todas as datas comemorativas e feriados
    const { data: holidayDates, error: holidayError } = await supabase
      .from('datas_2025')
      .select('*')
      .or('tipo.eq.holiday,tipo.eq.commemorative');

    // Depois, buscar datas específicas dos nichos selecionados
    const { data: nicheDates, error: nicheError } = await supabase
      .from('datas_2025')
      .select('*')
      .overlaps('niches', niches);

    if (holidayError || nicheError) {
      console.error('Database error:', holidayError || nicheError);
      throw holidayError || nicheError;
    }

    // Combinar e remover duplicatas
    const allDates = [...(holidayDates || []), ...(nicheDates || [])];
    const uniqueDates = Array.from(new Map(allDates.map(date => [date.data, date])).values());

    console.log(`Found ${uniqueDates.length} unique dates in database`);

    if (uniqueDates.length === 0) {
      return new Response(
        JSON.stringify({ 
          dates: [],
          message: 'Nenhuma data encontrada para os nichos selecionados.' 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Format dates for response
    const formattedDates = uniqueDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo,
      description: date.descrição,
    }));

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