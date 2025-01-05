import { DateEntry, FormattedDate, nicheMapping } from './types.ts';

export function filterDatesByNiches(dates: DateEntry[], niches: string[]): DateEntry[] {
  console.log(`[dateFilters] Filtering ${dates.length} dates for niches:`, niches);
  
  const translatedNiches = niches.map(niche => nicheMapping[niche]?.toLowerCase() || niche.toLowerCase());
  
  return dates.filter(date => {
    const dateNiches = [
      date['nicho 1']?.toLowerCase(),
      date['nicho 2']?.toLowerCase(),
      date['nicho 3']?.toLowerCase()
    ].filter(Boolean);

    const hasMatchingNiche = translatedNiches.some(niche => 
      dateNiches.some(dateNiche => dateNiche.includes(niche))
    );

    return hasMatchingNiche;
  });
}

export function formatDatesForGPT(dates: DateEntry[]): string {
  return dates.map(date => ({
    date: date.data?.split('T')[0],
    description: date.descrição,
    type: date.tipo,
    niches: [
      date['nicho 1'],
      date['nicho 2'],
      date['nicho 3']
    ].filter(Boolean)
  })).map(d => 
    `Data: ${d.date}\nDescrição: ${d.description}\nTipo: ${d.type}\nNichos: ${d.niches.join(', ')}`
  ).join('\n\n');
}

export function validateAndFormatDates(
  relevantDates: any[],
  allDates: DateEntry[],
  niches: string[]
): FormattedDate[] {
  console.log(`[dateFilters] Validating and formatting ${relevantDates.length} dates`);
  
  const translatedNiches = niches.map(niche => nicheMapping[niche]?.toLowerCase() || niche.toLowerCase());

  return relevantDates
    .filter(date => {
      const originalDate = allDates.find(d => d.data?.split('T')[0] === date.date);
      if (!originalDate) {
        console.log(`[dateFilters] Removing invalid date ${date.date} - not found in Supabase`);
        return false;
      }

      const dateNiches = [
        originalDate['nicho 1']?.toLowerCase(),
        originalDate['nicho 2']?.toLowerCase(),
        originalDate['nicho 3']?.toLowerCase()
      ].filter(Boolean);

      const hasMatchingNiche = translatedNiches.some(niche => 
        dateNiches.some(dateNiche => dateNiche.includes(niche))
      );

      if (!hasMatchingNiche) {
        console.log(`[dateFilters] Removing date ${date.date} - no matching niches`);
        return false;
      }

      return true;
    })
    .map(date => {
      const originalDate = allDates.find(d => d.data?.split('T')[0] === date.date);
      if (!originalDate) return null;
      
      return {
        date: date.date,
        title: originalDate.descrição || '',
        category: originalDate.tipo?.toLowerCase() || 'commemorative',
        description: originalDate.descrição || ''
      };
    })
    .filter((date): date is FormattedDate => date !== null);
}