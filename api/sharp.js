export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, ...params } = req.query;
    const queryString = new URLSearchParams(params).toString();
    const url = `https://api.sharpapi.io/v1/${endpoint}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.SHARP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('SharpAPI response status:', response.status);
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('SharpAPI proxy error:', error);
    return res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
