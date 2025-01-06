export interface DateEntry {
  data: string;
  descrição?: string;
  tipo?: string;
  'nicho 1'?: string;
  'nicho 2'?: string;
  'nicho 3'?: string;
}

export const nicheMapping: Record<string, string> = {
  'education': 'educação',
  'fashion': 'moda',
  'healthcare': 'saúde',
  'finance': 'finanças',
  'gastronomy': 'gastronomia',
  'logistics': 'logística',
  'industry': 'indústria',
  'tourism': 'turismo'
};