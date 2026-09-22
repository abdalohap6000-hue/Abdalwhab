import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';

// مفتاح SDK العام لـ Google Play (يبدأ بـ goog_) من RevenueCat Dashboard
// ← Project Settings ← API keys. مفتاح عام يُشحن داخل التطبيق ولا يُعد سراً،
// لكن يبقى في متغير بيئة لسهولة التدوير وفصل البيئات.
const REVENUECAT_GOOGLE_API_KEY = import.meta.env.VITE_REVENUECAT_GOOGLE_KEY || '';

let configured = false;
let configurePromise = null;
let pendingUserId = null;

// التهيئة مرة واحدة فقط، ويمكن انتظارها من أي مكان
export function initPurchases() {
  if (!Capacitor.isNativePlatform()) return Promise.resolve();
  if (configured) return Promise.resolve();
  if (configurePromise) return configurePromise; // تهيئة جارية — لا تبدأ نسخة ثانية

  configurePromise = (async () => {
    if (!REVENUECAT_GOOGLE_API_KEY) {
      console.warn('[RevenueCat] VITE_REVENUECAT_GOOGLE_KEY غير مضبوط في .env');
      return;
    }
    try {
      await Purchases.configure({ apiKey: REVENUECAT_GOOGLE_API_KEY });
      configured = true;
      // ربط الهوية المعلّقة التي وصلت قبل اكتمال التهيئة
      if (pendingUserId) {
        const queuedId = pendingUserId;
        pendingUserId = null;
        try {
          await Purchases.logIn({ appUserID: queuedId });
        } catch (e) {
          console.error('[RevenueCat] فشل ربط الهوية المعلقة:', e);
        }
      }
    } catch (error) {
      console.error('[RevenueCat] فشل التهيئة:', error);
    }
  })();

  return configurePromise;
}

export async function identifyPurchasesUser(userId) {
  if (!Capacitor.isNativePlatform() || !userId) return;
  if (!configured) {
    // التهيئة لم تكتمل بعد → خزّن الهوية وتُربط تلقائياً فور الجاهزية
    pendingUserId = userId;
    await initPurchases();
    return;
  }
  try {
    await Purchases.logIn({ appUserID: userId });
  } catch (error) {
    console.error('[RevenueCat] فشل تسجيل هوية المستخدم:', error);
  }
}

export async function resetPurchasesUser() {
  pendingUserId = null;
  if (!Capacitor.isNativePlatform() || !configured) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('[RevenueCat] فشل تسجيل الخروج:', error);
  }
}

export async function presentPaywall() {
  if (!Capacitor.isNativePlatform()) return null;
  return await RevenueCatUI.presentPaywall();
}

export { PAYWALL_RESULT };
