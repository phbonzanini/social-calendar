import { DateEntry } from './types.ts';
import { nicheMapping } from './types.ts';

export function filterGeneralDates(dates: DateEntry[]): DateEntry[] {
  return dates.filter(date => {
    const description = date.descrição?.toLowerCase() || '';
    return (
      description.includes('dia das mães') ||
      description.includes('dia dos pais') ||
      description.includes('natal') ||
      description.includes('ano novo') ||
      description.includes('dia do cliente') ||
      description.includes('black friday')
    );
  });
}

export function filterDatesByNiches(dates: DateEntry[], translatedNiches: string[]): DateEntry[] {
  return dates.filter(date => {
    const dateNiches = [
      date['nicho 1']?.toLowerCase(),
      date['nicho 2']?.toLowerCase(),
      date['nicho 3']?.toLowerCase()
    ].filter(Boolean);

    return translatedNiches.some(niche => 
      dateNiches.some(dateNiche => dateNiche?.includes(niche.toLowerCase()))
    );
  });
}

export function formatDatesForPrompt(dates: DateEntry[]): string {
  return dates.map(date => 
    `Data: ${date.data}\nDescrição: ${date.descrição}\nTipo: ${date.tipo}\nNichos: ${[
      date['nicho 1'], 
      date['nicho 2'], 
      date['nicho 3']
    ].filter(Boolean).join(', ')}`
  ).join('\n\n');
}

export function translateNiches(niches: string[]): string[] {
  return niches.map(niche => {
    const translated = nicheMapping[niche]?.toLowerCase();
    console.log(`[Niche] Translating ${niche} to ${translated}`);
    return translated || niche.toLowerCase();
  });
}