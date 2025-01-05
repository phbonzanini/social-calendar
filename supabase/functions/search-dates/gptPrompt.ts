export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Analyze these dates and return ONLY a JSON array of relevant dates for these niches: ${niches.join(', ')}.

You MUST return ONLY a valid JSON array in this EXACT format, with NO additional text or formatting:
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

CRITICAL: Your response must be ONLY the JSON array. Do not include ANY text before or after the array. The response must be valid JSON that can be parsed directly.`;
}