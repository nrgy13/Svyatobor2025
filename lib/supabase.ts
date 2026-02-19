import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Service Role Key нужен только на сервере для загрузки файлов
// На клиенте достаточно анонимного ключа для чтения публичных изображений

// Create Supabase client with environment variables
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Create server-side Supabase client for Storage operations (только если Service Role Key доступен)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

export type ContactFormData = {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  objectType?: string;
  address?: string;
  message?: string;
  preferredTime?: string;
};

export async function submitContactForm(data: ContactFormData) {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Ошибка при отправке формы:', result);
      throw new Error(result.error || 'Не удалось отправить форму. Пожалуйста, попробуйте позже.');
    }

    return { success: true, message: result.message };
  } catch (error) {
    console.error('Ошибка при отправке формы:', error);
    throw error;
  }
}

// Storage configuration
const STORAGE_BUCKET = 'images';

// Upload image to Supabase Storage
export async function uploadImage(file: File, fileName: string): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('Service Role Key не настроен для загрузки изображений');
  }

  const fileExt = fileName.split('.').pop();
  const filePath = `${Date.now()}.${fileExt}`;

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);

  if (error) {
    throw new Error(`Ошибка загрузки изображения: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return publicUrl;
}

// Delete image from Supabase Storage
export async function deleteImage(filePath: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Service Role Key не настроен для удаления изображений');
  }

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Ошибка удаления изображения: ${error.message}`);
  }
}

// Get public URL for image
export function getImageUrl(filePath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return publicUrl;
}
