export const submitSignupForm = async (formData) => {
  const apiUrl = 'http://localhost:433/comall/user-signup'; // API endpoint
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('Failed to submit form');
    }

    const data = await response.json();
    return data; // Return the response data containing success and user info
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
};
