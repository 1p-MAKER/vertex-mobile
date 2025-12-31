import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Device } from '@capacitor/device';

const resources = {
    en: {
        translation: {
            "welcome_title": "Vertex Mobile",
            "welcome_msg": "Experience the future of hybrid applications.",
            "start_btn": "Get Started",
            "device_lang": "Detected Language: {{lang}}",
            "loading": "Initializing..."
        }
    },
    ja: {
        translation: {
            "welcome_title": "Vertex Mobile",
            "welcome_msg": "ハイブリッドアプリの未来を体験しよう。",
            "start_btn": "はじめる",
            "device_lang": "検出言語: {{lang}}",
            "loading": "読み込み中..."
        }
    }
};

let initialized = false;

export const initI18n = async () => {
    if (initialized) return;

    let lang = 'en';
    try {
        const info = await Device.getLanguageCode();
        // iOS sends 'en', Android might send 'en_US' or 'en-US'
        const tag = info.value;
        console.log('Device language:', tag);
        if (tag && (tag.startsWith('ja') || tag === 'jp')) {
            lang = 'ja';
        }
    } catch (e) {
        console.warn('Device language check failed, falling back to navigator', e);
        if (typeof navigator !== 'undefined' && navigator.language.startsWith('ja')) {
            lang = 'ja';
        }
    }

    await i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: lang,
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false
            }
        });

    initialized = true;
};

export default i18n; // Export i18n instance
