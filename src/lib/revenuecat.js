import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

// مفتاح SDK العام لـ Google Play (يبدأ بـ goog_) من RevenueCat Dashboard
// ← Project Settings ← API keys. مفتاح عام يُشحن داخل التطبيق ولا يُعد سراً،
// لكن يبقى في متغير بيئة لسهولة التدوير وفصل البيئات.
const REVENUECAT_GOOGLE_API_KEY = import.meta.env.VITE_REVENUECAT_GOOGLE_KEY || '';

let configured = false;

/**
 * تهيئة SDK — تعمل فقط على المنصات الأصلية (Android/iOS)
 */
export async function initPurchases() {
  if (!Capacitor.isNativePlatform()) return;
  if (!REVENUECAT_GOOGLE_API_KEY) {
    console.warn('[RevenueCat] VITE_REVENUECAT_GOOGLE_KEY غير مضبوط في .env');
    return;
  }
  if (configured) return;
  try {
    await Purchases.configure({ apiKey: REVENUECAT_GOOGLE_API_KEY });
    configured = true;
  } catch (error) {
    console.error('[RevenueCat] فشل التهيئة:', error);
  }
}

/**
 * تسجيل هوية المستخدم بربطه بمعرّف Supabase
 * (نفس الـ UUID الذي يصل في webhook إلى Supabase → grant_subscription)
 */
export async function identifyPurchasesUser(userId) {
  if (!Capacitor.isNativePlatform() || !userId || !configured) return;
  try {
    await Purchases.logIn({ appUserID: userId });
  } catch (error) {
    console.error('[RevenueCat] فشل تسجيل هوية المستخدم:', error);
  }
}

/**
 * إعادة تعيين هوية المستخدم عند تسجيل الخروج
 */
export async function resetPurchasesUser() {
  if (!Capacitor.isNativePlatform() || !configured) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('[RevenueCat] فشل تسجيل الخروج:', error);
  }
}

/**
 * فتح شاشة الاشتراك الأصلية (Paywall)
 */
export async function presentPaywall() {
  if (!Capacitor.isNativePlatform()) return null;
  return await RevenueCatUI.presentPaywall();
}

export { PAYWALL_RESULT };
export async function resetPurchasesUser() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('[RevenueCat] فشل تسجيل الخروج:', error);
  }
}

/**
 * فتح شاشة الاشتراك الأصلية (Paywall)
 * @returns {Promise<{ result: PAYWALL_RESULT } | null>}
 */
export async function presentPaywall() {
  if (!Capacitor.isNativePlatform()) return null;
  return await RevenueCatUI.presentPaywall();
}

export { PAYWALL_RESULT };
