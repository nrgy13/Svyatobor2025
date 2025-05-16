import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client with environment variables
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type ContactFormData = {
  name: string;
  phone: string;
  preferredTime?: string;
};

export async function submitContactForm(data: ContactFormData) {
  const { error } = await supabase.from('contact_requests').insert([data]);
  
  if (error) {
    throw new Error('Не удалось отправить форму. Пожалуйста, попробуйте позже.');
  }
  
  return { success: true };
}
