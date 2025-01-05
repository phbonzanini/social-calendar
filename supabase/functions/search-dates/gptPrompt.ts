export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `You are a marketing expert. Analyze these dates and return ONLY a JSON array for niches: ${niches.join(', ')}.

The response must be EXACTLY in this format, with no additional text:
[
  {
    "date": "2025-01-01",
    "relevance": "high",
    "reason": "New Year celebration"
  }
]

Strict rules:
1. Return ONLY a JSON array, no explanations or other text
2. Each object must have exactly: date, relevance, reason
3. Date format: YYYY-MM-DD
4. Relevance values: high, medium, or low
5. Reason: brief, clear explanation
6. Include health awareness dates for healthcare/saúde e bem-estar niche

Dates to analyze:
${datesContent}`;
}