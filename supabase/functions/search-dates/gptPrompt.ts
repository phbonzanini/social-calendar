export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Return ONLY a JSON array of relevant dates for these niches: ${niches.join(', ')}.

The response MUST be a valid JSON array like this:
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

IMPORTANT: Return ONLY the JSON array, no other text.`;
}