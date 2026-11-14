import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import type { SharedProps, Theme } from '@/types';

export function useTheme() {
    const { auth } = usePage<SharedProps>().props;
    const initialUserTheme = auth.user?.theme_preference;

    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'light';
        const saved = localStorage.getItem('likhagrade_theme') as Theme | null;
        return initialUserTheme || saved || 'light';
    });

    useEffect(() => {
        const root = document.documentElement;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const effectiveDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

        if (effectiveDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem('likhagrade_theme', theme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return { theme, setTheme };
}

