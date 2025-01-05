export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Analyze and return ONLY a JSON array of relevant dates for these niches: ${niches.join(', ')}.

You MUST return a valid JSON array in this EXACT format, with NO additional text or formatting:
[
  {
    "date": "YYYY-MM-DD",
    "relevance": "high/medium/low",
    "reason": "brief explanation"
  }
]

For healthcare/saúde e bem-estar niche, include health awareness and medical dates.

Dates to analyze:
${datesContent}

IMPORTANT: Your response must be a valid JSON array ONLY. Do not include any text before or after the array.`;
}