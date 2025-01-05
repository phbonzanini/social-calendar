export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Analyze these dates and return ONLY a JSON array of relevant dates for these niches: ${niches.join(', ')}.

CRITICAL: You must return ONLY a valid JSON array with this exact structure. No text before or after:
[
  {
    "date": "YYYY-MM-DD",
    "relevance": "high/medium/low",
    "reason": "brief explanation"
  }
]

Example of valid response:
[{"date": "2025-01-01", "relevance": "high", "reason": "New Year's Day"}]

For healthcare/saúde e bem-estar niche, include health awareness and medical dates.

Dates to analyze:
${datesContent}

Remember: Return ONLY the JSON array. No explanations or additional text.`;
}