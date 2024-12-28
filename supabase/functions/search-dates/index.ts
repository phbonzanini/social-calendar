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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niches } = await req.json();
    console.log('Recebendo requisição para nichos:', niches);
    
    if (!niches || !Array.isArray(niches) || niches.length === 0) {
      throw new Error('Nichos inválidos ou vazios');
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    try {
      // Prepara o prompt para o GPT
      const prompt = `
        Analise estas datas comemorativas e identifique quais são mais relevantes para os seguintes nichos de negócio: ${niches.join(', ')}.
        
        Retorne apenas os IDs das datas mais relevantes separados por vírgula.
        Exemplo: 1,4,7,12
        
        Responda APENAS com os números, sem texto adicional.
      `;

      console.log('Enviando requisição para GPT');

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
              content: 'Você é um assistente especializado em identificar datas comemorativas relevantes para diferentes nichos de negócio. Responda apenas com os IDs das datas relevantes.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!gptResponse.ok) {
        console.error('Erro na resposta do GPT:', await gptResponse.text());
        throw new Error('Erro na API do GPT');
      }

      const gptData = await gptResponse.json();
      console.log('Resposta do GPT recebida:', gptData);

      if (!gptData.choices?.[0]?.message?.content) {
        throw new Error('Formato de resposta do GPT inválido');
      }

      // Busca as datas no banco
      const { data: dates, error: dbError } = await supabase
        .from('datas_2025')
        .select('*')
        .order('data');

      if (dbError) {
        console.error('Erro no banco de dados:', dbError);
        throw dbError;
      }

      if (!dates || dates.length === 0) {
        console.log('Nenhuma data encontrada no banco');
        return new Response(
          JSON.stringify({ dates: [] }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      // Filtra as datas com base na resposta do GPT
      const relevantIds = gptData.choices[0].message.content
        .split(',')
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id));

      console.log('IDs relevantes do GPT:', relevantIds);

      const filteredDates = dates.filter(date => relevantIds.includes(date.id));
      console.log('Total de datas filtradas:', filteredDates.length);

      return new Response(
        JSON.stringify({ dates: filteredDates }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );

    } catch (gptError) {
      console.error('Erro na API do GPT:', gptError);
      
      // Se o GPT falhar, usa filtragem direta no banco como fallback
      const { data: fallbackDates, error: fallbackError } = await supabase
        .from('datas_2025')
        .select('*')
        .order('data');

      if (fallbackError) {
        throw fallbackError;
      }

      // Filtragem simples por palavras-chave como fallback
      const filteredDates = fallbackDates.filter(date => {
        const description = date.descrição?.toLowerCase() || '';
        return niches.some(niche => 
          description.includes(niche.toLowerCase()) ||
          description.includes(niche.toLowerCase().replace('-', ' '))
        );
      });

      console.log('Total de datas encontradas no fallback:', filteredDates.length);

      return new Response(
        JSON.stringify({ dates: filteredDates }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

  } catch (error) {
    console.error('Erro na função search-dates:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});