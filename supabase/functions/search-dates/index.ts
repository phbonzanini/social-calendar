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

    // Buscar todas as datas disponíveis
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Filtrar as datas baseado nos nichos selecionados e datas comemorativas/feriados
    const relevantDates = allDates.filter(date => {
      // Sempre incluir feriados e datas comemorativas gerais
      if (date.tipo === 'holiday' || date.tipo === 'commemorative') {
        return true;
      }

      // Verificar se a data tem nichos e se algum deles corresponde aos selecionados
      if (date.niches && Array.isArray(date.niches)) {
        return date.niches.some(niche => niches.includes(niche));
      }

      return false;
    });

    console.log(`Found ${relevantDates.length} relevant dates from ${allDates.length} total dates`);

    if (relevantDates.length === 0) {
      return new Response(
        JSON.stringify({ 
          dates: [],
          message: 'Nenhuma data encontrada para os nichos selecionados.' 
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Format dates for response
    const formattedDates = relevantDates.map(date => ({
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