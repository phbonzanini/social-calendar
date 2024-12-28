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

    console.log('🔍 Recebido pedido para nichos:', niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Iniciando busca no banco de dados...');

    // Buscar todas as datas
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('❌ Erro ao buscar datas:', dbError);
      throw dbError;
    }

    if (!allDates || allDates.length === 0) {
      console.log('❌ Nenhuma data encontrada no banco de dados');
      return new Response(
        JSON.stringify({ dates: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log(`📊 Total de datas no banco: ${allDates.length}`);

    // Converter nichos selecionados para lowercase para comparação
    const selectedNichesLower = niches.map(n => n.toLowerCase());

    // Filtrar as datas relevantes
    const relevantDates = allDates.filter(date => {
      // Log detalhado para cada data
      console.log('\n📅 Analisando data:', {
        data: date.data,
        descricao: date.descrição,
        tipo: date.tipo,
        nicho1: date["nicho 1"],
        nicho2: date["nicho 2"],
        nicho3: date["nicho 3"]
      });

      // Sempre incluir feriados nacionais
      if (date.tipo === 'holiday') {
        console.log('✅ Incluindo feriado nacional:', date.descrição);
        return true;
      }

      // Verificar se algum dos nichos da data corresponde aos nichos selecionados
      const dateNiches = [
        date["nicho 1"],
        date["nicho 2"],
        date["nicho 3"]
      ]
      .filter(Boolean) // Remove valores null/undefined
      .map(niche => niche.toLowerCase()); // Converter para lowercase

      console.log('📌 Nichos da data:', dateNiches);
      console.log('📌 Nichos selecionados:', selectedNichesLower);

      const hasMatchingNiche = dateNiches.some(niche => 
        selectedNichesLower.includes(niche)
      );

      if (hasMatchingNiche) {
        console.log(`✅ Data incluída - corresponde aos nichos selecionados:`, date.descrição);
        return true;
      }

      // Incluir datas comemorativas gerais (sem nichos específicos)
      if (date.tipo === 'commemorative' && dateNiches.length === 0) {
        console.log('✅ Incluindo data comemorativa geral:', date.descrição);
        return true;
      }

      console.log('❌ Data não incluída:', date.descrição);
      return false;
    });

    console.log(`\n📊 Total de datas relevantes encontradas: ${relevantDates.length}`);

    // Formatar datas para resposta
    const formattedDates = relevantDates.map(date => ({
      date: date.data,
      title: date.descrição,
      category: date.tipo,
      description: date.descrição,
    }));

    // Ordenar datas cronologicamente
    formattedDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('\n📋 Resumo das datas por categoria:');
    const summary = formattedDates.reduce((acc, date) => {
      acc[date.category] = (acc[date.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(summary);

    return new Response(
      JSON.stringify({ dates: formattedDates }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('❌ Erro na função search-dates:', error);
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