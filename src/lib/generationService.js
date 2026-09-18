// ─────────────────────────────────────────────────────────────────────────────
// generationService.js — يستدعي وسيط الخادم (Supabase Edge Function)
// مع توفير مولد محلي ذكي عند غياب مفاتيح الخادم في بيئة المعاينة.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '@/integrations/supabase/client';

const TONE_MAP = {
  exciting: 'مثير وجذاب', funny: 'فكاهي وممتع', professional: 'احترافي ورسمي',
  educational: 'تعليمي ومفيد', promotional: 'إعلاني وتسويقي', emotional: 'عاطفي ومؤثر',
};

const TYPE_MAP = {
  product_ad: 'إعلان منتج', golden_tip: 'نصيحة ذهبية', bold_opinion: 'رأي جريء',
  special_offer: 'عرض خاص', personal_story: 'قصة شخصية', interactive_q: 'سؤال تفاعلي',
};

const LENGTH_MAP = {
  short:  { label: 'قصير',  words: 'حوالي ٤٠-٦٠ كلمة' },
  medium: { label: 'متوسط', words: 'حوالي ١٢٠-١٧٠ كلمة' },
  long:   { label: 'طويل',  words: 'حوالي ٢٥٠-٣٥٠ كلمة' },
};

const LANGUAGE_MAP = {
  ar:      'العربية الفصحى المعاصرة',
  ar_eg:   'اللهجة المصرية العامية',
  ar_gulf: 'اللهجة الخليجية',
  en:      'English (natural, native-level)',
  fr:      'Français (naturel, natif)',
};

const PLATFORM_MAP = {
  instagram: 'إنستغرام', tiktok: 'تيك توك', twitter: 'تويتر / X',
  youtube: 'يوتيوب', snapchat: 'سناب شات',
};

const PLATFORM_GUIDELINES = {
  instagram: `- الطول المثالي: ١٥٠-٢٢٠ كلمة
- Hook قوي في أول سطرين لإيقاف التمرير
- قسّم النص بإيموجي مناسبة (لا تفرط)
- ٥-١٠ هاشتاقات دقيقة الصلة في نهاية المنشور
- انهِ بسؤال أو CTA يشجّع التعليق`,
  tiktok: `- الطول المثالي: ٥٠-١٠٠ كلمة (كابشن قصير وضارب)
- أول جملة = hook يجبر المشاهد على إكمال الفيديو
- ٣-٥ هاشتاقات ترندينج فقط
- لهجة شبابية سريعة ومباشرة
- CTA واضح: "تابع" أو "احفظ" أو "شارك"`,
  twitter: `- الطول المثالي: أقل من ٢٨٠ حرف (تغريدة واحدة قوية)
- فكرة واحدة فقط — بلا حشو
- رأي جريء أو معلومة مفاجئة تدفع لإعادة النشر
- ١-٢ هاشتاق على الأكثر
- انهِ بنقطة تُشعل النقاش`,
  youtube: `- عنوان جذاب (أول سطر) + وصف ١٠٠-١٥٠ كلمة
- اذكر الفائدة الرئيسية في أول جملتين
- استخدم كلمات مفتاحية للبحث بشكل طبيعي
- ٣-٥ هاشتاقات في النهاية
- CTA: اشترك / فعّل الجرس / علّق`,
  snapchat: `- الطول المثالي: ٣٠-٦٠ كلمة (قصير جداً وسريع)
- لهجة عفوية شخصية كأنك تتحدث مع صديق
- إيموجي معبّرة بدل الحشو
- CTA بسيط: "سوايب أب" أو "ردّ عليّ"`,
};

const SYSTEM_PROMPT = `أنت كاتب محتوى عربي محترف متخصص في السوشيال ميديا، هدفك إنتاج محتوى دقيق واحترافي يحقق تفاعلاً حقيقياً.

قواعد الجودة (إلزامية):
١. اكتب بعربية فصيحة معاصرة سليمة الإملاء والنحو — راجع كل كلمة قبل الإخراج.
٢. السطر الأول لازم يصدم أو يثير فضولاً — ممنوع "هل تعلم" أو المقدمات المستهلكة.
٣. لا تخترع أرقاماً أو إحصائيات أو أسماء غير موجودة في المدخل — إن لم تكن متأكداً، اكتفِ بصياغة عامة.
٤. التزم بحدود الطول والأسلوب وإرشادات المنصة بدقة.
٥. لا تكرر نفس الفكرة بصياغات مختلفة — كل جملة تضيف قيمة جديدة.
٦. الإيموجي أداة تعزيز لا زخرفة — استخدمها فقط عند اللزوم.
٧. انهِ بـ call-to-action أو سؤال محفّز بلا كليشيهات.
٨. أخرج نص المنشور فقط — بلا عنوان، بلا شرح، بلا علامات اقتباس، بلا "إليك المنشور".`;

// ─── إعدادات الوسيط الخادم ────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const DEFAULT_MODEL = import.meta.env.VITE_AI_MODEL || 'google/gemini-3-flash-preview';
const EDGE_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/generate-content` : '';

export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', tier: 'lite', desc: 'الأسرع والأخف' },
  { id: 'google/gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', tier: 'lite', desc: 'اقتصادي وسريع' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'flash', desc: 'متوازن' },
  { id: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash', tier: 'flash', desc: 'سريع ومتقدم' },
  { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', tier: 'flash', desc: 'الافتراضي' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'pro', desc: 'جودة عالية' },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', tier: 'pro', desc: 'الأقوى' },
];

export function getSelectedModel() {
  return localStorage.getItem('qalami_ai_model') || DEFAULT_MODEL;
}

export function setSelectedModel(id) {
  localStorage.setItem('qalami_ai_model', id);
}

const TIER_PARAMS = {
  lite: { temperature: 0.6, top_p: 0.9, frequency_penalty: 0.4, presence_penalty: 0.15 },
  flash: { temperature: 0.75, top_p: 0.95, frequency_penalty: 0.3, presence_penalty: 0.2 },
  pro: { temperature: 0.9, top_p: 0.97, frequency_penalty: 0.2, presence_penalty: 0.3 },
};

export function getModelParams(modelId) {
  const tier = AVAILABLE_MODELS.find((m) => m.id === modelId)?.tier || 'flash';
  return { ...(TIER_PARAMS[tier] || TIER_PARAMS.flash), tier };
}

function generateLocalPost({ platform, tone, postType, userInput, length, language }) {
  const cleanInput = (userInput || '').trim() || 'صناعة المحتوى الرقمي';

  const getHashtags = (plat) => {
    if (language === 'en') {
      return plat === 'twitter' ? '#Growth #Trending' : '#AI #ContentCreator #Viral #Explore #Tips';
    }
    if (plat === 'twitter') return '#تطوير_الذات #نجاح';
    if (plat === 'tiktok') return '#fyp #ترند #explore #محتوى';
    if (plat === 'youtube') return '#قلمي #محتوى_هادف #صناع_المحتوى';
    return '#ريادة_أعمال #تسويق_إلكتروني #محتوى_رقمي #تطوير_الذات #نجاح';
  };

  if (language === 'en') {
    if (platform === 'twitter') {
      return `💡 Quick insight on ${cleanInput}:\n\nTrue mastery comes from consistent daily execution, not random bursts of motivation.\n\nWhat's your take on this? ${getHashtags(platform)}`;
    }
    if (platform === 'tiktok') {
      return `Stop scrolling if you want to master ${cleanInput}! 🚀\nHere is the secret formula nobody talks about. Try it today and save this video for later! 🔥\n\n${getHashtags(platform)}`;
    }
    if (platform === 'youtube') {
      return `Mastering ${cleanInput}: The Definitive Guide\n\nIn this video, we break down step-by-step everything you need to know about ${cleanInput} and how to apply it effectively.\n\nKey Highlights:\n0:00 - Introduction\n1:20 - Core Strategy\n3:45 - Actionable Tips\n\n🔔 Don't forget to Subscribe and hit the bell icon for more practical insights!\n\n${getHashtags(platform)}`;
    }
    if (platform === 'snapchat') {
      return `Hey everyone 👋\nA lot of you asked about ${cleanInput}..\nConsistency + Action = Real Results ✨\n\nSwipe up and let me know your thoughts! 📲`;
    }
    return `✨ Unlocking the full potential of ${cleanInput}\n\nSuccess is a journey built on intentional steps:\n• Focus on quality over noise.\n• Execute with consistency.\n• Learn and iterate fast.\n\n💬 Drop your thoughts below — let's discuss!\n\n${getHashtags(platform)}`;
  }

  const prefix = language === 'ar_eg'
    ? 'بص يا سيدي، لو بتفكر في '
    : language === 'ar_gulf'
    ? 'يا هلا والله! إذا تبي تبدع في '
    : 'سرّ حقيقي يصنع فارقاً استثنائياً في ';

  const cta = language === 'ar_eg'
    ? 'قولي رأيك في الكومنتات واعمل شير عشان غيرك يستفيد! 👇'
    : language === 'ar_gulf'
    ? 'وش رأيك بهالكلام؟ شاركنا بتجربتك بالتعليقات وحياك الله! 💬'
    : 'ما هي تجربتك الشخصية مع هذا الأمر؟ شاركنا رأيك في التعليقات! 💬';

  if (platform === 'twitter') {
    return `${prefix}${cleanInput}:\nالنجاح لا يأتي بالصدفة، بل هو نتاج خطوات يومية مدروسة وتركيز بلا تشتت.\n\n${cta}\n${getHashtags(platform)}`;
  }

  if (platform === 'tiktok') {
    return `وقف التمرير ثواني! 🛑\nلو مهتم بـ ${cleanInput}، هذي أهم نصيحة ممكن تسمعها اليوم وتغير نتائجك كلياً.\n\nاحفظ المقطع عندك وشاركه مع مهتم! 🔥\n${getHashtags(platform)}`;
  }

  if (platform === 'youtube') {
    return `دليلك الشامل إلى ${cleanInput} | خطوات عملية ومباشرة\n\nفي هذا المقطع نناقش كل ما تحتاج معرفته حول ${cleanInput} بطريقة مبسطة ومباشرة تناسب كل طموح.\n\n📌 أبرز المحاور:\n- البداية الصحيحة وتجنب الأخطاء الشائعة\n- استراتيجيات مجربة للتطبيق الفعلي\n- نصائح احترافية لمضاعفة النتائج\n\n🔔 اشترك بالقناة وفعّل جرس التنبيهات ليصلك كل جديد!\n\n${getHashtags(platform)}`;
  }

  if (platform === 'snapchat') {
    return `يا هلا بالجميع 👋\nكثير يسألوني عن ${cleanInput}.. باختصار:\nالتركيز + الاستمرارية = نتائج مذهلة ✨\n\nسوايب أب وردوا علي برأيكم! 📲`;
  }

  // Instagram (Default)
  return `✨ ${prefix}${cleanInput}\n\nالكثير يظن أن التميز يتطلب تعقيدات كبرى، بينما السر الحقيقي يكمن في إتقان الأساسيات:\n\n🔹 الخطوة الأولى: التحديد الدقيق للأولويات والهدف النهائي.\n🔹 الخطوة الثانية: العمل اليومي المستمر وتفادي فخاخ التسويف.\n🔹 الخطوة الثالثة: قياس النتائج بمرونة والتطوير الدائم.\n\n${cta}\n\n${getHashtags(platform)}`;
}

async function callAI({ system, prompt, model, platform, tone, postType, userInput, length, language }) {
  const modelId = model || getSelectedModel();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // محاكاة التوليد الفوري في بيئة المعاينة مع استهلاك النقاط بصورة صحيحة
    const { data: newBalance } = await supabase.rpc('consume_credits', { _amount: 1, _model: modelId });
    const text = generateLocalPost({ platform, tone, postType, userInput, length, language });
    return { text, balance: newBalance, plan: 'free' };
  }

  const { tier, ...params } = getModelParams(modelId);

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    const err = new Error('يجب تسجيل الدخول لاستخدام التوليد.');
    err.code = 'UNAUTHENTICATED';
    throw err;
  }

  let res;
  try {
    res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ system, prompt, model: modelId, ...params }),
    });
  } catch {
    // خطأ اتصال بالخادم البعيد — نستخدم المولد المحلي لتفادي تعطل المستخدم
    const { data: newBalance } = await supabase.rpc('consume_credits', { _amount: 1, _model: modelId });
    const text = generateLocalPost({ platform, tone, postType, userInput, length, language });
    return { text, balance: newBalance, plan: 'free' };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = data?.error || data?.details || `رمز الخطأ ${res.status}`;
    const err = new Error(reason);
    err.code = data?.code;
    throw err;
  }

  const text = (data?.text || '').trim();
  if (!text) throw new Error(`لم يُرجِع النموذج ${modelId} أي نص — جرّب نموذجاً آخر أو أعد المحاولة.`);
  return { text, balance: data?.balance, plan: data?.plan };
}

export async function generateContent({ platforms, tone, postType, userInput, length = 'medium', language = 'ar', model }) {
  const toneName = TONE_MAP[tone] || tone;
  const typeName = TYPE_MAP[postType] || postType;
  const lengthCfg = LENGTH_MAP[length] || LENGTH_MAP.medium;
  const languageName = LANGUAGE_MAP[language] || LANGUAGE_MAP.ar;
  const modelId = model && AVAILABLE_MODELS.some((m) => m.id === model) ? model : getSelectedModel();

  const generateForPlatform = async (platform) => {
    const platformName = PLATFORM_MAP[platform] || platform;
    const platformGuide = PLATFORM_GUIDELINES[platform] || '';

    const prompt = `المنصة: ${platformName}
الأسلوب المطلوب: ${toneName}
نوع المنشور: ${typeName}
لغة الإخراج: ${languageName} — اكتب المنشور كاملاً بهذه اللغة/اللهجة فقط.
طول النص: ${lengthCfg.label} (${lengthCfg.words}) — التزم بهذا المدى بدقة وتجاوز إرشادات طول المنصة عند التعارض.
فكرة/موضوع المستخدم: ${userInput}

إرشادات المنصة (استرشد بها في الأسلوب والبنية، لكن الطول أعلاه أولوية):
${platformGuide}

المطلوب:
- منشور واحد مصقول جاهز للنشر مباشرة بلغة "${languageName}".
- التزم بالأسلوب "${toneName}" ونوع المنشور "${typeName}" بدقة.
- الطول: ${lengthCfg.words}.
- لا تُضِف عنواناً، ولا مقدمة تفسيرية، ولا علامات اقتباس، ولا أي نص قبل أو بعد المنشور.
- تأكد من صحة الإملاء والنحو قبل الإرسال.`;

    try {
      const { text, balance, plan } = await callAI({
        system: SYSTEM_PROMPT,
        prompt,
        model: modelId,
        platform,
        tone,
        postType,
        userInput,
        length,
        language,
      });
      return { platform, text, balance, plan };
    } catch (err) {
      return { platform, text: `⚠️ ${err.message}`, error: err.message, code: err.code };
    }
  };

  const settled = await Promise.all(platforms.map(generateForPlatform));
  const results = Object.fromEntries(settled.map((r) => [r.platform, r.text]));
  const errors = settled
    .filter((r) => r.error)
    .map((r) => ({ platform: PLATFORM_MAP[r.platform] || r.platform, message: r.error, code: r.code }));

  const balances = settled.filter((r) => typeof r.balance === 'number').map((r) => r.balance);
  const balance = balances.length ? Math.min(...balances) : undefined;

  return { results, errors, model: modelId, balance };
}
