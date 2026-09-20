import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

const REVENUECAT_GOOGLE_API_KEY = 'goog_RwEUDqQcFidADjlaDOIznImUAKH';

/**
 * تهيئة SDK — تعمل فقط على المنصات الأصلية (Android/iOS)
 */
export async function initPurchases() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Purchases.configure({
      apiKey: REVENUECAT_GOOGLE_API_KEY,
    });
  } catch (error) {
    console.error('[RevenueCat] فشل التهيئة:', error);
  }
}

/**
 * تسجيل هوية المستخدم بربطه بمعرّف Supabase
 * @param {string} userId - معرّف UUID للمستخدم من Supabase Auth
 */
export async function identifyPurchasesUser(userId) {
  if (!Capacitor.isNativePlatform() || !userId) return;
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
