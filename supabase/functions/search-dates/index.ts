import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    console.log("Received request for niches:", niches);

    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Niches array is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all dates from the database
    const { data: allDates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!allDates || allDates.length === 0) {
      console.log("No dates found in database");
      return new Response(
        JSON.stringify({ dates: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${allDates.length} dates in database`);

    // Format dates for GPT analysis
    const datesForAnalysis = allDates.map(date => ({
      date: date.data,
      title: date.descrição,
      type: date.tipo
    }));

    // Prepare prompt for GPT
    const prompt = `
    Você é um especialista em marketing que ajuda a identificar datas comemorativas relevantes para diferentes nichos de negócio.
    
    Analise as seguintes datas comemorativas e determine quais são relevantes para os nichos: ${niches.join(', ')}.
    
    Datas para análise:
    ${JSON.stringify(datesForAnalysis, null, 2)}

    Para cada data, avalie:
    1. Se ela tem relevância direta ou indireta para os nichos mencionados
    2. Como essa data pode ser aproveitada para marketing no nicho
    
    Retorne APENAS um array JSON com as datas relevantes, mantendo a mesma estrutura de dados (date, title, type).
    Exemplo de resposta esperada:
    [
      {
        "date": "2025-01-01",
        "title": "Ano Novo",
        "type": "holiday"
      }
    ]
    
    Responda SOMENTE com o array JSON, sem texto adicional.`;

    console.log("Sending request to GPT");

    // Call GPT API
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em marketing que ajuda a identificar datas comemorativas relevantes para diferentes nichos de negócio.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!gptResponse.ok) {
      console.error('GPT API error:', await gptResponse.text());
      throw new Error(`OpenAI API error: ${gptResponse.status}`);
    }

    const gptData = await gptResponse.json();
    console.log("Received GPT response");

    try {
      // Parse GPT response and extract relevant dates
      const gptContent = gptData.choices[0].message.content;
      console.log("GPT content:", gptContent);
      
      const relevantDates = JSON.parse(gptContent);
      
      if (!Array.isArray(relevantDates)) {
        throw new Error('GPT response is not an array');
      }

      // Map back to original date format
      const formattedDates = relevantDates.map(date => {
        const originalDate = allDates.find(d => d.data === date.date);
        if (!originalDate) {
          console.warn(`Could not find original date for ${date.date}`);
          return date;
        }
        return {
          date: date.date,
          title: originalDate.descrição,
          category: originalDate.tipo?.toLowerCase() || 'commemorative',
          description: date.description || originalDate.descrição
        };
      });

      console.log(`Returning ${formattedDates.length} relevant dates`);

      return new Response(
        JSON.stringify({ dates: formattedDates }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error processing GPT response:', error);
      console.error('GPT content was:', gptData.choices[0].message.content);
      throw new Error('Failed to process AI response');
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: "Erro ao processar a requisição"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});