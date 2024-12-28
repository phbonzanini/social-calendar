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

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou não fornecidos');
    }

    // Log inicial
    console.log('1. Nichos recebidos:', niches);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todas as datas
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Erro ao buscar datas:', dbError);
      throw dbError;
    }

    // Log após busca no banco
    console.log('2. Resultado da busca no banco:', {
      success: !!allDates,
      totalDates: allDates?.length || 0
    });

    if (!allDates || allDates.length === 0) {
      console.log('3. Nenhuma data encontrada no banco');
      return new Response(
        JSON.stringify({ dates: [] }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Log de exemplo das primeiras datas
    console.log('4. Primeiras 3 datas do banco:', allDates.slice(0, 3));

    // Converter nichos para lowercase
    const selectedNichesLower = niches.map(n => n.toLowerCase());
    console.log('5. Nichos convertidos:', selectedNichesLower);

    // Nova lógica simplificada de filtro
    const relevantDates = allDates.filter(date => {
      // Sempre incluir feriados
      if (date.tipo === 'holiday') {
        console.log('6. Incluindo feriado:', date.descrição);
        return true;
      }

      // Verificar nichos
      const dateNiches = [
        date['nicho 1'],
        date['nicho 2'],
        date['nicho 3']
      ];

      // Log para cada data sendo verificada
      console.log('7. Verificando data:', {
        descricao: date.descrição,
        nichos: dateNiches,
        tipo: date.tipo
      });

      // Verificar se algum dos nichos da data corresponde aos selecionados
      for (const niche of dateNiches) {
        if (niche && selectedNichesLower.includes(niche.toLowerCase())) {
          console.log('8. Match encontrado:', {
            data: date.descrição,
            nichoEncontrado: niche
          });
          return true;
        }
      }

      return false;
    });

    // Log do resultado do filtro
    console.log('9. Resultado do filtro:', {
      totalEncontrado: relevantDates.length,
      primeirosResultados: relevantDates.slice(0, 3)
    });

    // Formatar e ordenar datas
    const formattedDates = relevantDates
      .map(date => ({
        date: date.data,
        title: date.descrição,
        category: date.tipo,
        description: date.descrição
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Log final
    console.log('10. Datas formatadas:', {
      total: formattedDates.length,
      primeiras: formattedDates.slice(0, 3)
    });

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