export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Return ONLY a JSON array of relevant dates for these niches: ${niches.join(', ')}.

Format: [{"date": "YYYY-MM-DD", "relevance": "high/medium/low", "reason": "brief explanation"}]

Example: [{"date": "2025-01-01", "relevance": "high", "reason": "New Year celebration"}]

For healthcare/saúde e bem-estar niche, include health awareness and medical dates.

Dates to analyze:
${datesContent}

IMPORTANT: Return ONLY the JSON array. No text before or after.`;
}