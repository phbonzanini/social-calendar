export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `
    Você é um especialista em marketing e análise de datas comemorativas para os seguintes nichos específicos:
    ${niches.join(', ')}

    CONTEXTO IMPORTANTE:
    - Existem 447 datas comemorativas cadastradas no banco de dados
    - Cada data pode estar associada a até 3 nichos diferentes
    - As datas fornecidas já foram pré-filtradas com base nas colunas de nichos do banco
    - Você deve analisar cuidadosamente cada data fornecida

    CRITÉRIOS DE ANÁLISE - uma data só deve ser incluída se atender TODOS estes critérios:

    1. RELEVÂNCIA DIRETA E EXPLÍCITA:
       - A data DEVE ter uma conexão DIRETA e EXPLÍCITA com pelo menos um dos nichos selecionados
       - A conexão deve ser óbvia e imediata, sem necessidade de interpretações forçadas
       - Exemplo válido: "Dia do Professor" para Educação
       - Exemplo inválido: "Dia do Trabalho" para qualquer nicho

    2. POTENCIAL DE MARKETING ESPECÍFICO:
       - A data deve permitir ações promocionais ou comunicação ESPECÍFICA para o nicho
       - Deve haver oportunidades claras de marketing direcionado
       - Exemplo válido: "Dia da Saúde" para Saúde e Bem-Estar
       - Exemplo inválido: "Dia da Amizade" (muito genérico)

    3. RELEVÂNCIA COMERCIAL:
       - A data deve ter potencial de impacto nos negócios do nicho
       - Deve haver uma clara oportunidade de engajamento com o público-alvo
       - Exemplo válido: "Black Friday" para Moda
       - Exemplo inválido: "Dia do Café" para Educação

    REGRAS DE EXCLUSÃO - NÃO inclua datas que:
    - Têm apenas conexão indireta ou tangencial
    - São genéricas demais
    - Não têm potencial claro de marketing para o nicho específico
    - Requerem interpretação forçada para relacionar ao nicho

    Analise estas datas e retorne APENAS as que têm conexão verdadeiramente relevante com os nichos:

    ${datesContent}

    Retorne EXATAMENTE neste formato JSON:
    [{ "date": "YYYY-MM-DD", "title": "Título original", "category": "Categoria original" }]

    IMPORTANTE: Retorne SOMENTE o array JSON, sem nenhum texto adicional.`;
}