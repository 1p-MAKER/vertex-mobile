import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Device } from '@capacitor/device';

const resources = {
    en: {
        translation: {
            "game_title": "Build & Blast DIY",
            "phase_scan": "START SCAN",
            "phase_blast": "START BLAST PREP",
            "phase_demolition": "CLEANING UP...",
            "phase_build": "DIY BUILD",
            "btn_blast": "DETONATE!",
            "btn_next": "Next",
            "score": "Score",
            "loading": "Initializing Engine..."
        }
    },
    ja: {
        translation: {
            "game_title": "ビルド＆ブラスト DIY",
            "phase_scan": "スキャン開始",
            "phase_blast": "爆破の準備",
            "phase_demolition": "瓦礫を収集中...",
            "phase_build": "ビルドモード",
            "btn_blast": "起爆！",
            "btn_next": "次へ",
            "score": "スコア",
            "loading": "エンジン起動中..."
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
