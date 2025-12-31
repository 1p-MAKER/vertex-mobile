'use client';

import { useEffect, useState } from 'react';
import { initI18n } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import { Smartphone, Globe, Rocket } from 'lucide-react';

export default function ClientWrapper() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        initI18n().then(() => setReady(true));
    }, []);

    if (!ready) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
                    <span className="text-xl font-light tracking-widest">LOADING</span>
                </div>
            </div>
        );
    }

    return <MainContent />;
}

function MainContent() {
    const { t, i18n } = useTranslation();

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6 text-white overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-3xl filter"></div>
            <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-purple-600/20 blur-3xl filter"></div>

            <div className="z-10 flex w-full max-w-md flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
                    <Rocket className="h-10 w-10 text-white" />
                </div>

                <div className="text-center">
                    <h1 className="bg-gradient-to-r from-blue-200 to-white bg-clip-text text-4xl font-bold text-transparent">
                        {t('welcome_title')}
                    </h1>
                    <p className="mt-4 text-gray-400 font-light text-lg">
                        {t('welcome_msg')}
                    </p>
                </div>

                <div className="flex w-full flex-col gap-4">
                    <button className="group relative w-full overflow-hidden rounded-xl bg-white p-4 text-center font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95">
                        <span className="relative z-10">{t('start_btn')}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 transition-opacity group-hover:opacity-100"></div>
                    </button>
                </div>

                <div className="mt-8 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-gray-500">
                    <Globe className="h-3 w-3" />
                    <span>{t('device_lang', { lang: i18n.language })}</span>
                </div>
            </div>
        </div>
    );
}
