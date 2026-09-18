# قلمي AI — Standalone Version

## التثبيت
```bash
npm install
npm run dev
```

## ربط الذكاء الاصطناعي
افتح `src/lib/generationService.js` وعدّل دالة `generateForPlatform` لتستخدم API الخاص بك.

### مثال مع OpenAI:
```js
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}` },
  body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }] }),
});
const data = await response.json();
return [platform, data.choices[0].message.content];
```

### مثال مع Anthropic Claude:
```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
});
const data = await response.json();
return [platform, data.content[0].text];
```

## بوابة الدفع
تم ربط Lemon Squeezy مسبقاً في `src/pages/Premium.jsx` — استبدل الروابط برواباطك.

## التخزين
المكتبة تستخدم `localStorage` بدلاً من قاعدة بيانات خارجية.
لاستبدالها بـ Supabase أو Firebase، عدّل `src/lib/savedPostsService.js`.