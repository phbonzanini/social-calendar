export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `You are a JSON-only response bot. Analyze these dates for niches: ${niches.join(', ')}.

You must return ONLY a JSON array in this exact format, with no additional text or explanation:
[
  {
    "date": "2025-01-01",
    "relevance": "high",
    "reason": "New Year celebration"
  }
]

Rules:
1. Return ONLY a JSON array, no other text
2. Each object must have exactly: date, relevance, reason
3. Date format must be YYYY-MM-DD
4. Relevance must be: high, medium, or low
5. Reason must be brief and clear
6. Include health awareness dates for healthcare/saúde e bem-estar niche

Dates to analyze:
${datesContent}`;
}