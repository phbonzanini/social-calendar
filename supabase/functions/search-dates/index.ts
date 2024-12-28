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

    // Buscar todas as datas
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Erro na consulta:', dbError);
      throw dbError;
    }

    console.log('Total de datas no banco:', allDates?.length || 0);

    if (!allDates || allDates.length === 0) {
      console.log('Nenhuma data encontrada no banco');
      return new Response(
        JSON.stringify({ dates: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Log de algumas datas para debug
    console.log('Primeiras 3 datas do banco:', allDates.slice(0, 3));

    // Filtrar datas relevantes com uma lógica mais simples
    const relevantDates = allDates.filter(date => {
      // Sempre incluir feriados
      if (date.tipo?.toLowerCase() === 'holiday') {
        return true;
      }

      // Verificar cada nicho da data
      const dateNiches = [
        date['nicho 1']?.toLowerCase(),
        date['nicho 2']?.toLowerCase(),
        date['nicho 3']?.toLowerCase()
      ].filter(niche => niche); // Remove null/undefined/empty

      // Log para cada data sendo verificada
      console.log('Verificando data:', {
        descricao: date.descrição,
        nichos_data: dateNiches,
        nichos_selecionados: niches.map(n => n.toLowerCase())
      });

      // Verificar se algum dos nichos selecionados está presente nos nichos da data
      return niches.some(selectedNiche => 
        dateNiches.includes(selectedNiche.toLowerCase())
      );
    });

    console.log('Datas relevantes encontradas:', relevantDates.length);
    
    if (relevantDates.length > 0) {
      console.log('Exemplo de data relevante:', relevantDates[0]);
    }

    // Formatar e ordenar as datas
    const formattedDates = relevantDates
      .map(date => ({
        date: date.data,
        title: date.descrição,
        category: date.tipo,
        description: date.descrição
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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