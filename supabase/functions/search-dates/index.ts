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
    console.log('Received niches:', niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Attempting to fetch dates for niches:', niches);

    // Construindo a query de forma mais simples e direta
    let query = supabase
      .from('datas_2025')
      .select('*');

    // Adicionando condições OR para cada nicho
    const conditions = niches.map(niche => {
      return `nicho1.eq.${niche},nicho2.eq.${niche},nicho3.eq.${niche}`;
    }).join(',');

    if (conditions) {
      query = query.or(conditions);
    }

    // Ordenando por data
    query = query.order('data');

    console.log('Executing query with conditions:', conditions);
    
    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      
      // Fallback para feriados se nenhuma data específica for encontrada
      console.log('Fetching default holidays...');
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
      
      // Formatando as datas dos feriados
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

    console.log('Query results:', data?.length || 0, 'records found');
    
    // Formatando todas as datas encontradas
    const formattedDates = data?.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo,
      description: date.descrição
    })) || [];

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