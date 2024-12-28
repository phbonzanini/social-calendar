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

    // Validação básica dos nichos
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    // Inicialização do cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todas as datas
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    console.log('Resultado da consulta:', { error: dbError, count: allDates?.length });

    if (dbError) {
      throw dbError;
    }

    if (!allDates || allDates.length === 0) {
      console.log('Nenhuma data encontrada no banco');
      return new Response(
        JSON.stringify({ dates: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Filtrar datas relevantes
    const relevantDates = allDates.filter(date => {
      // Incluir feriados nacionais
      if (date.tipo?.toLowerCase() === 'holiday') {
        console.log('Incluindo feriado:', date.descrição);
        return true;
      }

      // Verificar correspondência de nichos
      const dateNiches = [date['nicho 1'], date['nicho 2'], date['nicho 3']]
        .filter(niche => niche !== null && niche !== undefined && niche !== '');

      console.log('Verificando nichos para data:', {
        data: date.data,
        descricao: date.descrição,
        nichos: dateNiches
      });

      // Verificar se algum dos nichos selecionados corresponde aos nichos da data
      const hasMatch = niches.some(selectedNiche => 
        dateNiches.some(dateNiche => 
          dateNiche?.toLowerCase() === selectedNiche.toLowerCase()
        )
      );

      if (hasMatch) {
        console.log('Match encontrado para:', date.descrição);
      }

      return hasMatch;
    });

    console.log('Total de datas encontradas:', relevantDates.length);

    // Formatar datas para resposta
    const formattedDates = relevantDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo,
      description: date.descrição
    }));

    console.log('Datas formatadas:', formattedDates);

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