const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const isProduction = () => process.env.NODE_ENV === 'production';

const cleanText = (value, maxLength = 4000) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const systemInstruction = `
You are LocalFixr AI, a friendly customer support assistant for a MERN marketplace website named LocalFixr.
Answer only LocalFixr support questions about service booking, electricians, plumbing, AC repair, appliance repair, cleaning, carpentry, painting, provider registration, booking tracking, payments, reviews, refunds, and account help.
Use a professional, warm tone. Support Hindi, English, and Hinglish based on the user's language.
Keep answers concise, practical, and action-oriented. Do not invent unavailable booking IDs, prices, or provider names.
If a user needs urgent help, suggest calling LocalFixr support at +91 62800 08301 or emailing localfixr@gmail.com.
`;

const fallbackReply = (message) => {
  const text = message.toLowerCase();

  if (text.includes('provider') || text.includes('register')) {
    return 'You can register as a service provider from the Register button, choose "Service Provider", select your approved work type, verify your email OTP, and then admin can review your profile.';
  }
  if (text.includes('book') || text.includes('booking')) {
    return 'To book a service, open Services, choose your category, view available providers, and use the service/provider details to continue. After login, you can track bookings from your dashboard.';
  }
  if (text.includes('payment') || text.includes('refund')) {
    return 'For payment or refund support, please keep your booking details ready. LocalFixr admin reviews refund cases based on booking status, provider progress, and valid proof.';
  }
  if (text.includes('electric') || text.includes('plumb') || text.includes('clean') || text.includes('ac')) {
    return 'LocalFixr supports home services like electrician, plumbing, cleaning, appliance repair, carpentry, painting, and home maintenance. Open Services and filter by category to find providers.';
  }
  if (text.includes('password') || text.includes('login')) {
    return 'If login is not working, use Forgot Password to receive an OTP on your email and reset your password securely.';
  }

  return 'Hi, I am LocalFixr AI. I can help with bookings, service categories, provider registration, payment support, refunds, and account questions. How can I help you today?';
};

const buildContents = ({ message, history = [] }) => {
  const historyContents = history
    .filter((item) => ['user', 'assistant'].includes(item.role) && item.text)
    .slice(-10)
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: cleanText(item.text, 1200) }],
    }));

  return [
    ...historyContents,
    {
      role: 'user',
      parts: [{ text: cleanText(message) }],
    },
  ];
};

const getGeminiReply = async ({ message, history = [] }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      reply: fallbackReply(message),
      provider: 'local-fallback',
    };
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: buildContents({ message, history }),
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 450,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (!isProduction()) {
      console.warn(`Gemini API failed: ${payload.error?.message || response.statusText}. Using local chatbot fallback.`);
      return {
        reply: fallbackReply(message),
        provider: 'local-fallback',
      };
    }
    throw new Error(payload.error?.message || 'Gemini API request failed');
  }

  const reply = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  return {
    reply: reply || fallbackReply(message),
    provider: 'gemini',
  };
};

export {
  getGeminiReply,
};
