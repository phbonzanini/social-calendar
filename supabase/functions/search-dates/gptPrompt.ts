export function buildGPTPrompt(niches: string[], datesContent: string): string {
  return `Analyze these dates for niches: ${niches.join(', ')} and return a JSON object with relevant dates.

Your response MUST be a valid JSON object in this exact format:
{
  "dates": [
    {
      "date": "2025-01-01",
      "title": "New Year's Day",
      "category": "commemorative",
      "description": "New Year celebration"
    }
  ]
}

Rules:
1. Return ONLY a JSON object with a dates array
2. Each date object must have exactly: date, title, category, description
3. Date format must be YYYY-MM-DD
4. Category must be one of: commemorative, holiday, optional
5. Include health awareness dates for healthcare/saúde e bem-estar niche
6. Response must be valid JSON with no trailing commas

Dates to analyze:
${datesContent}`;
}