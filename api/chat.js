const ALLOWED_ORIGINS = new Set([
  'https://ahmadshabestani.github.io',
  'http://localhost:3000',
  'http://localhost:5173'
]);

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://ahmadshabestani.github.io';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8'
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const message = String(body.message || '').trim();
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

  if (!message) return res.status(400).json({ error: 'message is required' });
  if (message.length > 4000) return res.status(413).json({ error: 'message is too long' });

  const input = [
    {
      role: 'system',
      content: [{
        type: 'input_text',
        text: 'تو INDUSTRIA AI هستی؛ یک دستیار هوشمند صنعتی فارسی‌زبان. پاسخ‌ها را دقیق، کاربردی و کوتاه بده. برای انتخاب ابزار و تجهیزات، ابتدا کاربرد، شدت استفاده، بودجه و محدودیت‌های مهم را در نظر بگیر. اگر اطلاعات کافی نیست، حداکثر 3 سؤال هدفمند بپرس. مشخصات فنی را حدس نزن و اگر داده‌ای در اختیار نداری صریح بگو. فعلاً دیتابیس محصول متصل نیست، بنابراین قیمت، موجودی یا مدل واقعی را ادعا نکن.'
      }]
    },
    ...history
      .filter(item => item && (item.role === 'user' || item.role === 'assistant'))
      .map(item => ({
        role: item.role,
        content: [{ type: item.role === 'user' ? 'input_text' : 'output_text', text: String(item.content || '').slice(0, 4000) }]
      })),
    { role: 'user', content: [{ type: 'input_text', text: message }] }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        input,
        max_output_tokens: 700
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'AI request failed' });
    }

    return res.status(200).json({
      answer: data.output_text || 'پاسخی از مدل دریافت نشد.',
      response_id: data.id || null
    });
  } catch (error) {
    return res.status(500).json({ error: 'AI service unavailable' });
  }
}
