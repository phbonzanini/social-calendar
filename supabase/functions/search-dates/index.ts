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

    console.log('Recebido pedido para nichos:', niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Iniciando busca completa no banco de dados...');

    // Buscar TODAS as datas disponíveis
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
        niches: date.niches
      });

      // Sempre incluir feriados nacionais
      if (date.tipo === 'holiday') {
        console.log('✅ Incluindo feriado nacional:', date.descrição);
        return true;
      }

      // Verificar datas específicas para os nichos selecionados
      if (date.niches && Array.isArray(date.niches)) {
        const dateNichesLower = date.niches.map(n => n.toLowerCase());
        
        // Verificar interseção entre nichos da data e nichos selecionados
        const matchingNiches = dateNichesLower.filter(niche => 
          selectedNichesLower.includes(niche)
        );

        if (matchingNiches.length > 0) {
          console.log(`✅ Data incluída - corresponde aos nichos: ${matchingNiches.join(', ')}`);
          return true;
        }
      }

      // Incluir datas comemorativas gerais
      if (date.tipo === 'commemorative' && (!date.niches || date.niches.length === 0)) {
        console.log('✅ Incluindo data comemorativa geral:', date.descrição);
        return true;
      }

      console.log('❌ Data não incluída:', date.descrição);
      return false;
    });

    console.log(`\n📊 Total de datas relevantes encontradas: ${relevantDates.length}`);

    // Remover possíveis duplicatas
    const uniqueDates = Array.from(new Map(
      relevantDates.map(date => [date.data + date.descrição, date])
    ).values());

    console.log(`📊 Após remover duplicatas: ${uniqueDates.length} datas`);

    // Formatar datas para resposta
    const formattedDates = uniqueDates.map(date => ({
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