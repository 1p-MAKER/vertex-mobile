'use client';

import React, { useState } from 'react';
import { useGameState } from '@/lib/game-state';
import { GameScene } from './game/Scene';
import { useTranslation } from 'react-i18next';
import { initI18n } from '@/lib/i18n';
import { useEffect } from 'react';

export default function ClientWrapper() {
    const [ready, setReady] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        initI18n().then(() => setReady(true));
    }, []);

    if (!ready) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-black">
                <div className="text-white font-black animate-pulse tracking-widest text-2xl uppercase">
                    {t('loading')}
                </div>
            </div>
        );
    }

    return (
        <main className="relative h-screen w-screen overflow-hidden bg-black font-sans selection:bg-blue-500 selection:text-white">
            <GameScene />
        </main>
    );
}
