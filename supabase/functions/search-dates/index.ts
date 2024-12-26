import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    
    // Criar cliente Supabase com service role key para acesso total
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Primeiro, buscar todas as datas do banco
    const { data: allDates, error: dbError } = await supabase
      .from('dastas_2025')
      .select('*')
      .order('data');

    if (dbError) throw dbError;

    // Preparar o prompt para o GPT
    const prompt = `
      Analise estas datas comemorativas e me ajude a identificar quais são mais relevantes para os seguintes nichos: ${niches.join(', ')}.
      
      Datas disponíveis:
      ${allDates.map(d => `- ${d.data}: ${d.descrição} (${d.tipo})`).join('\n')}
      
      Por favor, retorne apenas os IDs das datas mais relevantes separados por vírgula.
      Exemplo de resposta: 1,4,7,12
      
      Responda APENAS com os números, sem texto adicional.
    `;

    // Consultar o GPT
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em identificar datas comemorativas relevantes para diferentes nichos de negócio.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const gptData = await gptResponse.json();
    const relevantIds = gptData.choices[0].message.content
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    // Buscar as datas relevantes
    const { data: relevantDates, error: finalError } = await supabase
      .from('dastas_2025')
      .select('*')
      .in('id', relevantIds)
      .order('data');

    if (finalError) throw finalError;

    return new Response(JSON.stringify({ dates: relevantDates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função search-dates:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});