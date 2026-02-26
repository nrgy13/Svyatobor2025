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
