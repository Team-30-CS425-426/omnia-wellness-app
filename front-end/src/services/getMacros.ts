import axios from 'axios';

const CLIENT_ID = '78195e5af554444782f130dd094975a2';
const CLIENT_SECRET = 'd88022c5d1d545a28e59b49ad52329e2';

export const getToken = async () => {
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');

  const response = await axios.post(
    'https://oauth.fatsecret.com/connect/token',
    body.toString(),
    {
      auth: {
        username: CLIENT_ID,
        password: CLIENT_SECRET,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.access_token;
};

export const testNLP = async () => {
    const token = await getToken();
    console.log('✅ Token:', token);
  
    const body = JSON.stringify({
      user_input: '2 scrambled eggs and a cup of oats',
      region: 'US',
      language: 'en',
      include_food_data: true,
    });
  
    const response = await fetch(
      'https://platform.fatsecret.com/rest/natural-language-processing/v1', // ← fixed URL
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      }
    );
  
    const text = await response.text();
    console.log('📦 Status:', response.status);
    console.log('📦 Response:', text);
  };