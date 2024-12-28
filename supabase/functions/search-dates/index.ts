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
    console.log('Nichos recebidos:', niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Construir a query para buscar datas que correspondem a qualquer um dos nichos selecionados
    const query = supabase
      .from('datas_2025')
      .select('*')
      .in('nicho 1', niches)
      .or(`nicho 2.in.(${niches.join(',')})`)
      .or(`nicho 3.in.(${niches.join(',')})`)
      .order('data');

    console.log('Executando query...');
    const { data: dates, error: dbError } = await query;

    if (dbError) {
      console.error('Erro na consulta:', dbError);
      throw dbError;
    }

    console.log('Datas encontradas:', dates?.length || 0);

    if (!dates || dates.length === 0) {
      // Se não encontrou datas específicas, buscar feriados nacionais
      console.log('Buscando feriados nacionais...');
      const { data: holidays, error: holidayError } = await supabase
        .from('datas_2025')
        .select('*')
        .eq('tipo', 'holiday')
        .order('data');

      if (holidayError) {
        console.error('Erro ao buscar feriados:', holidayError);
        throw holidayError;
      }

      console.log('Feriados encontrados:', holidays?.length || 0);
      
      const formattedHolidays = (holidays || []).map(date => ({
        date: date.data,
        title: date.descrição,
        category: date.tipo,
        description: date.descrição
      }));

      return new Response(
        JSON.stringify({ dates: formattedHolidays }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Formatar as datas encontradas
    const formattedDates = dates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo,
      description: date.descrição
    }));

    console.log('Total de datas formatadas:', formattedDates.length);
    if (formattedDates.length > 0) {
      console.log('Exemplo de data formatada:', formattedDates[0]);
    }

    return new Response(
      JSON.stringify({ dates: formattedDates }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Erro na função:', error);
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