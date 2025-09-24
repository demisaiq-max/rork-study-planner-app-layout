import { publicProcedure } from '@/backend/trpc/create-context';
import { supabase } from '@/backend/lib/supabase';

export const getAnswerKeyCategoriesProcedure = publicProcedure.query(async () => {
  console.log('[answer-keys/categories] list');
  const { data, error } = await supabase
    .from('answer_key_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories', error);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data ?? [];
});

export default getAnswerKeyCategoriesProcedure;