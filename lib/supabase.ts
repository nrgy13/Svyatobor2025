import { createClient } from '@supabase/supabase-js';

// Supabase используется только для загрузки изображений и работы с БД,
// если это необходимо. Для формы обратной связи используется api/contact.

// Create Supabase client with environment variables if available
export const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  : {
      // Mock client if config is missing
      storage: {
        from: () => ({
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          upload: async () => ({ error: { message: 'Supabase not configured' } }),
          remove: async () => ({ error: { message: 'Supabase not configured' } }),
        }),
      },
    } as any;

// Create server-side Supabase client for Storage operations (только если Service Role Key доступен)
export const supabaseAdmin = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

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
