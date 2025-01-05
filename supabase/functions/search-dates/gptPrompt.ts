export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Return a JSON array of relevant dates for these niches: ${niches.join(', ')}.

The response must be ONLY a JSON array like this example:
[{"date":"2025-01-01","relevance":"high","reason":"New Year"}]

Rules:
1. Return ONLY the JSON array, no other text
2. Each object must have exactly these fields: date, relevance, reason
3. Date format must be YYYY-MM-DD
4. Relevance must be: high, medium, or low
5. Reason must be a brief explanation

For healthcare/saúde e bem-estar niche, include health awareness and medical dates.

Dates to analyze:
${datesContent}`;
}