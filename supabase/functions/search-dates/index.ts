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
    console.log('Received niches:', niches);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todas as datas do banco
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*')
      .order('data');

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    if (!allDates || allDates.length === 0) {
      console.log('No dates found in database');
      return new Response(JSON.stringify({ dates: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found dates in database:', allDates.length);

    // Preparar o prompt para o GPT
    const prompt = `
      Analise estas datas comemorativas e identifique quais são mais relevantes para os seguintes nichos de negócio: ${niches.join(', ')}.
      
      Datas disponíveis:
      ${allDates.map(d => `${d.id}. ${d.data}: ${d.descrição} (${d.tipo})`).join('\n')}
      
      Retorne apenas os IDs das datas mais relevantes separados por vírgula.
      Exemplo: 1,4,7,12
      
      Responda APENAS com os números, sem texto adicional.
    `;

    console.log('Sending request to GPT');

    // Consultar o GPT
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um assistente especializado em identificar datas comemorativas relevantes para diferentes nichos de negócio. Responda apenas com os IDs das datas relevantes.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!gptResponse.ok) {
      console.error('GPT API error:', await gptResponse.text());
      throw new Error('Failed to get response from GPT');
    }

    const gptData = await gptResponse.json();
    console.log('GPT response:', gptData);

    const relevantIds = gptData.choices[0].message.content
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    console.log('Relevant IDs:', relevantIds);

    if (relevantIds.length === 0) {
      console.log('No relevant dates found by GPT');
      return new Response(JSON.stringify({ dates: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar as datas relevantes
    const { data: relevantDates, error: finalError } = await supabase
      .from('datas_2025')
      .select('*')
      .in('id', relevantIds)
      .order('data');

    if (finalError) {
      console.error('Error fetching relevant dates:', finalError);
      throw finalError;
    }

    console.log('Returning relevant dates:', relevantDates?.length);

    return new Response(JSON.stringify({ dates: relevantDates }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search-dates function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});