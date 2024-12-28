import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log('Received niches:', niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Attempting to fetch dates for niches:', niches);

    // Usando uma query mais simples com or()
    const { data, error } = await supabase
      .from('datas_2025')
      .select('*')
      .or(`"nicho 1".in.(${niches.map(n => `'${n}'`).join(',')}),` +
          `"nicho 2".in.(${niches.map(n => `'${n}'`).join(',')}),` +
          `"nicho 3".in.(${niches.map(n => `'${n}'`).join(',')})`)
      .order('data');

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Query results:', data?.length || 0, 'records found');
    
    // Se não encontrou datas específicas, busca feriados
    if (!data || data.length === 0) {
      console.log('No specific dates found, fetching holidays...');
      const { data: holidays, error: holidayError } = await supabase
        .from('datas_2025')
        .select('*')
        .eq('tipo', 'holiday')
        .order('data');

      if (holidayError) {
        console.error('Error fetching holidays:', holidayError);
        throw holidayError;
      }

      console.log('Found holidays:', holidays?.length || 0);

      const formattedHolidays = holidays?.map(date => ({
        date: date.data,
        title: date.descrição,
        category: date.tipo,
        description: date.descrição
      })) || [];

      return new Response(
        JSON.stringify({ dates: formattedHolidays }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formata as datas encontradas
    const formattedDates = data.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo,
      description: date.descrição
    }));

    return new Response(
      JSON.stringify({ dates: formattedDates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao processar a busca de datas.'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});