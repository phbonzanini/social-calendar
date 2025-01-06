import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// Mapeamento de nichos em inglês para português
const nicheMapping: Record<string, string> = {
  'education': 'educação',
  'fashion': 'moda',
  'healthcare': 'saúde e bem-estar',
  'finance': 'finanças',
  'gastronomy': 'gastronomia',
  'logistics': 'logística',
  'industry': 'indústria',
  'tourism': 'turismo'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    console.log("Received niches:", niches);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Traduz os nichos para português
    const translatedNiches = niches.map(niche => nicheMapping[niche] || niche);
    console.log("Translated niches:", translatedNiches);

    // Busca datas do Supabase
    const { data: dates, error: dbError } = await supabase
      .from('datas_2025')
      .select('*');

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("Total dates from database:", dates?.length);

    // Primeiro, vamos pegar todas as datas comemorativas gerais
    const generalDates = dates.filter(date => {
      const description = date.descrição?.toLowerCase() || '';
      return (
        description.includes('dia das mães') ||
        description.includes('dia dos pais') ||
        description.includes('natal') ||
        description.includes('ano novo') ||
        description.includes('dia do cliente') ||
        description.includes('black friday')
      );
    });

    console.log("Found general dates:", generalDates.length);

    // Prepara as datas para análise do GPT
    const datesToAnalyze = dates.filter(date => {
      const dateNiches = [
        date['nicho 1']?.toLowerCase(),
        date['nicho 2']?.toLowerCase(),
        date['nicho 3']?.toLowerCase()
      ].filter(Boolean);

      return translatedNiches.some(niche => 
        dateNiches.some(dateNiche => dateNiche?.includes(niche.toLowerCase()))
      );
    });

    console.log("Dates to analyze:", datesToAnalyze.length);

    // Prepara o prompt para o GPT
    const prompt = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em marketing que ajuda a identificar datas comemorativas relevantes para diferentes nichos de negócio. Analise as datas fornecidas e retorne apenas as que são realmente relevantes para os nichos especificados, incluindo uma breve explicação do por quê cada data é relevante."
        },
        {
          role: "user",
          content: `Analise estas datas para os nichos: ${translatedNiches.join(", ")}.\n\nDatas para análise:\n${
            datesToAnalyze.map(date => 
              `Data: ${date.data}\nDescrição: ${date.descrição}\nTipo: ${date.tipo}\nNichos: ${[date['nicho 1'], date['nicho 2'], date['nicho 3']].filter(Boolean).join(', ')}`
            ).join('\n\n')
          }`
        }
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    };

    console.log("Sending request to OpenAI with prompt:", JSON.stringify(prompt, null, 2));

    // Chama a API do OpenAI com retry
    let openAIResponse;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAIApiKey}`
          },
          body: JSON.stringify(prompt)
        });

        if (openAIResponse.ok) {
          break;
        }

        console.error(`OpenAI request failed (attempt ${retryCount + 1}):`, await openAIResponse.text());
        retryCount++;
        
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      } catch (error) {
        console.error(`OpenAI request error (attempt ${retryCount + 1}):`, error);
        retryCount++;
        
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        } else {
          throw new Error('Failed to get response from OpenAI after multiple attempts');
        }
      }
    }

    if (!openAIResponse?.ok) {
      throw new Error('Failed to get valid response from OpenAI');
    }

    const gptResult = await openAIResponse.json();
    console.log("GPT Response:", gptResult);

    let relevantDates;
    try {
      const parsedContent = JSON.parse(gptResult.choices[0].message.content);
      relevantDates = parsedContent.relevant_dates || [];
      console.log("Parsed relevant dates:", relevantDates);
    } catch (error) {
      console.error("Error parsing GPT response:", error);
      relevantDates = [];
    }

    // Combina as datas relevantes com as datas comemorativas gerais
    const allRelevantDates = [...generalDates, ...datesToAnalyze.filter(date => 
      relevantDates.some((relevantDate: any) => 
        relevantDate.date === date.data?.split('T')[0]
      )
    )];

    // Remove duplicatas e formata as datas
    const uniqueDates = Array.from(new Set(allRelevantDates.map(date => 
      JSON.stringify({ date: date.data, title: date.descrição })
    ))).map(str => JSON.parse(str));

    // Formata as datas para o formato esperado
    const formattedDates = uniqueDates.map(({ date, title }) => {
      const originalDate = allRelevantDates.find(d => 
        d.data === date && d.descrição === title
      );

      return {
        date: date?.split('T')[0] || '',
        title: title || '',
        category: originalDate?.tipo?.toLowerCase() || 'commemorative',
        description: title || ''
      };
    });

    console.log("Final formatted dates:", formattedDates);

    return new Response(
      JSON.stringify({ dates: formattedDates }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in search-dates function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});