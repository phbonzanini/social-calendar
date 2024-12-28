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

    // Validação inicial dos nichos
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      console.error('Erro: Nichos inválidos:', niches);
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    // Log dos nichos recebidos
    console.log('DEBUG - Nichos recebidos:', niches);

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todas as datas
    console.log('DEBUG - Iniciando busca no banco...');
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    // Verificar erro na busca
    if (dbError) {
      console.error('Erro ao buscar datas:', dbError);
      throw dbError;
    }

    // Verificar se há datas
    if (!allDates || allDates.length === 0) {
      console.log('DEBUG - Nenhuma data encontrada no banco');
      return new Response(
        JSON.stringify({ dates: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('DEBUG - Total de datas no banco:', allDates.length);
    console.log('DEBUG - Exemplo de data:', allDates[0]);

    // Simplificar a lógica de filtro
    const relevantDates = allDates.filter(date => {
      // Sempre incluir feriados nacionais
      if (date.tipo === 'holiday') {
        console.log('DEBUG - Incluindo feriado:', date.descrição);
        return true;
      }

      // Verificar se algum dos nichos da data corresponde aos selecionados
      const dateNiches = [
        date['nicho 1'],
        date['nicho 2'],
        date['nicho 3']
      ].filter(Boolean); // Remove valores null/undefined

      console.log('DEBUG - Verificando data:', {
        descricao: date.descrição,
        nichos: dateNiches,
        tipo: date.tipo
      });

      // Verificar correspondência de nichos (case insensitive)
      const hasMatch = dateNiches.some(niche => 
        niches.some(selectedNiche => 
          selectedNiche.toLowerCase() === niche?.toLowerCase()
        )
      );

      if (hasMatch) {
        console.log('DEBUG - Match encontrado para:', date.descrição);
      }

      return hasMatch;
    });

    console.log('DEBUG - Total de datas relevantes encontradas:', relevantDates.length);

    // Formatar datas para resposta
    const formattedDates = relevantDates
      .map(date => ({
        date: date.data,
        title: date.descrição,
        category: date.tipo,
        description: date.descrição
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('DEBUG - Datas formatadas:', formattedDates);

    return new Response(
      JSON.stringify({ dates: formattedDates }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error) {
    console.error('Erro na função search-dates:', error);
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