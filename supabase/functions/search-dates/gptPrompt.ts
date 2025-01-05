export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Analyze these dates and return ONLY those highly relevant to these business niches: ${niches.join(', ')}.

Focus on dates valuable for marketing campaigns in these sectors.

Dates to analyze:
${datesContent}

You MUST return ONLY a JSON array in this exact format:
[
  {
    "date": "YYYY-MM-DD",
    "relevance": "high/medium/low",
    "reason": "brief explanation"
  }
]

For healthcare/saúde e bem-estar, include dates related to health awareness, wellness, and medical commemorations. Do not include any text outside the JSON array.`;
}