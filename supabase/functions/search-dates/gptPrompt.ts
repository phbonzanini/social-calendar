export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Analyze these dates for niches: ${niches.join(', ')} and return a JSON object with a dates array containing relevant dates.

The response must be a JSON object in this exact format:
{
  "dates": [
    {
      "date": "2025-01-01",
      "relevance": "high",
      "reason": "New Year celebration"
    }
  ]
}

Rules:
1. Return ONLY a JSON object with a dates array
2. Each date object must have exactly: date, relevance, reason
3. Date format must be YYYY-MM-DD
4. Relevance must be: high, medium, or low
5. Reason must be brief and clear
6. Include health awareness dates for healthcare/saúde e bem-estar niche
7. Response must be valid JSON with no trailing commas

Dates to analyze:
${datesContent}`;
}