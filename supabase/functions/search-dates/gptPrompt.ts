export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Analyze the following dates and return only those that are highly relevant to these business niches: ${niches.join(', ')}.

Focus on dates that would be valuable for marketing campaigns in these sectors.

Dates to analyze:
${datesContent}

Return your response as a JSON array of objects with this exact format:
[
  {
    "date": "YYYY-MM-DD",
    "relevance": "high/medium/low",
    "reason": "brief explanation of relevance"
  }
]

Only include dates that are truly relevant to the specified niches. For healthcare/saúde e bem-estar, include dates related to health awareness, wellness, and medical commemorations.`;
}