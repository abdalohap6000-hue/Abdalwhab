// ── معالجة روابط العودة (Deep Links) لإتمام المصادقة على منصات الموبايل ──────────
//
// مسار المستخدم الجديد على التطبيق:
//   1. يسجل ببريده في التطبيق → Supabase يرسل بريد تأكيد
//   2. يفتح البريد ويضغط الرابط → Supabase يتحقق ثم يعيد توجيهه إلى:
//      com.qalami.app://auth-callback  (+ توكن الجلسة في الرابط)
//   3. أندرويد يفتح التطبيق تلقائياً (intent-filter في AndroidManifest)
//   4. هذا المستمع يلتقط الرابط ويثبّت الجلسة → useAuth يرصد التغيير
//      → الانتقال التلقائي إلى /home
//
// يدعم نمطي Supabase:
//   - PKCE:      com.qalami.app://auth-callback?code=XXXX
//   - Implicit:  com.qalami.app://auth-callback#access_token=...&refresh_token=...
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

export function initDeepLinkAuth() {
  // على الويب لا حاجة — supabase-js يلتقط الجلسة من رابط الصفحة تلقائياً
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appUrlOpen', async ({ url }) => {
    try {
      if (!url || !url.includes('auth-callback')) return;

      // استخراج البارامترات من الهاش أو الاستعلام (أيهما وجد)
      const hashIndex = url.indexOf('#');
      const queryIndex = url.indexOf('?');
      const raw = hashIndex > -1
        ? url.slice(hashIndex + 1)
        : queryIndex > -1 ? url.slice(queryIndex + 1) : '';
      const params = new URLSearchParams(raw);

      // نمط PKCE: استبدال الرمز بجلسة كاملة (الـ verifier محفوظ من لحظة بدء الطلب داخل التطبيق)
      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) console.error('[DeepLink] exchangeCodeForSession:', error.message);
        return;
      }

      // النمط الضمني: توكنات جاهزة
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) console.error('[DeepLink] setSession:', error.message);
      }
    } catch (e) {
      console.error('[DeepLink] appUrlOpen error:', e);
    }
  });
}
