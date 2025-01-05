import { Database } from '../_shared/database.types';
import { DateResponse } from './types';

type DateRecord = Database['public']['Tables']['datas_2025']['Row'];

export const filterDatesForNiches = (dates: DateRecord[], niches: string[]): DateResponse[] => {
  // First, let's identify general commemorative dates that should always be included
  const generalDates = dates.filter(date => {
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

  // Then filter dates by niches
  const nicheDates = dates.filter(date => {
    if (!date['nicho 1'] && !date['nicho 2'] && !date['nicho 3']) return false;
    
    return niches.some(niche => {
      const nicheValue = niche.toLowerCase();
      return (
        (date['nicho 1']?.toLowerCase() === nicheValue) ||
        (date['nicho 2']?.toLowerCase() === nicheValue) ||
        (date['nicho 3']?.toLowerCase() === nicheValue)
      );
    });
  });

  // Combine general dates with niche-specific dates
  const allDates = [...generalDates, ...nicheDates];

  // Remove duplicates based on date
  const uniqueDates = Array.from(new Set(allDates.map(date => 
    JSON.stringify({ date: date.data, title: date.descrição })
  ))).map(str => JSON.parse(str));

  // Map to the expected format
  return uniqueDates.map(({ date, title }) => {
    const originalDate = allDates.find(d => 
      d.data === date && d.descrição === title
    );

    return {
      date: date || '',
      title: title || '',
      category: (originalDate?.tipo?.toLowerCase() as 'commemorative' | 'holiday' | 'optional') || 'commemorative',
      description: title || '',
    };
  });
};

export const validateNiches = (niches: string[]): boolean => {
  const validNiches = [
    'educacao', 'education',
    'moda', 'fashion',
    'saude', 'healthcare',
    'financas', 'finance',
    'gastronomia', 'gastronomy',
    'logistica', 'logistics',
    'industria', 'industry',
    'turismo', 'tourism'
  ].map(n => n.toLowerCase());

  return niches.every(niche => 
    validNiches.includes(niche.toLowerCase())
  );
};