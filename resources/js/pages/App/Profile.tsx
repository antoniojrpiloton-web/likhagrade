import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { User, Lock, Save, KeyRound, Sun, Moon, Laptop } from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Radio } from '@/components/ui/Radio';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/types';

interface ProfileProps {
    user: {
        id: number;
        first_name: string;
        last_name: string;
        name: string;
        email: string;
        theme_preference: Theme;
        created_at: string;
    };
}

export default function Profile({ user }: ProfileProps) {
    const { setTheme } = useTheme();

    const profileForm = useForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        theme_preference: user.theme_preference || 'light',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.patch(route('app.profile.update'), {
            onSuccess: () => {
                setTheme(profileForm.data.theme_preference as Theme);
            },
        });
    };

    const submitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put(route('app.profile.password'), {
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AppLayout title="Profile & Account">
            <Head title="Profile & Account — LikhaGrade" />

            <div className="max-w-4xl space-y-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Profile & Account Settings
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Manage your teacher identity, theme preferences, and account security
                    </p>
                </div>

                {/* Profile Information */}
                <Card
                    title="Personal Information"
                    description="Update your name and interface theme appearance"
                >
                    <form onSubmit={submitProfile} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                required
                                value={profileForm.data.first_name}
                                onChange={(e) => profileForm.setData('first_name', e.target.value)}
                                error={profileForm.errors.first_name}
                            />
                            <Input
                                label="Last Name"
                                required
                                value={profileForm.data.last_name}
                                onChange={(e) => profileForm.setData('last_name', e.target.value)}
                                error={profileForm.errors.last_name}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                disabled
                                value={user.email}
                                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 cursor-not-allowed"
                            />
                            <p className="mt-1 text-2xs text-slate-400">
                                Email cannot be changed directly. Member since {user.created_at}.
                            </p>
                        </div>

                        {/* Theme Preference */}
                        <div className="pt-2">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Theme Preference
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                        profileForm.data.theme_preference === 'light'
                                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="theme_preference"
                                        value="light"
                                        checked={profileForm.data.theme_preference === 'light'}
                                        onChange={() => profileForm.setData('theme_preference', 'light')}
                                        className="sr-only"
                                    />
                                    <Sun className="w-4 h-4 text-amber-500" />
                                    <div className="text-xs font-medium">Light mode</div>
                                </label>

                                <label
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                        profileForm.data.theme_preference === 'dark'
                                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="theme_preference"
                                        value="dark"
                                        checked={profileForm.data.theme_preference === 'dark'}
                                        onChange={() => profileForm.setData('theme_preference', 'dark')}
                                        className="sr-only"
                                    />
                                    <Moon className="w-4 h-4 text-blue-400" />
                                    <div className="text-xs font-medium">Dark mode</div>
                                </label>

                                <label
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                        profileForm.data.theme_preference === 'system'
                                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="theme_preference"
                                        value="system"
                                        checked={profileForm.data.theme_preference === 'system'}
                                        onChange={() => profileForm.setData('theme_preference', 'system')}
                                        className="sr-only"
                                    />
                                    <Laptop className="w-4 h-4 text-slate-500" />
                                    <div className="text-xs font-medium">System default</div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button
                                type="submit"
                                isLoading={profileForm.processing}
                                leftIcon={<Save className="w-4 h-4" />}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Change Password */}
                <Card
                    title="Change Password"
                    description="Ensure your account is using a long, random password to stay secure"
                >
                    <form onSubmit={submitPassword} className="space-y-4 max-w-lg">
                        <Input
                            label="Current Password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={passwordForm.data.current_password}
                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                            error={passwordForm.errors.current_password}
                            leftIcon={<KeyRound className="w-4 h-4" />}
                        />

                        <Input
                            label="New Password"
                            type="password"
                            required
                            placeholder="Minimum 8 characters"
                            value={passwordForm.data.password}
                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                            error={passwordForm.errors.password}
                            leftIcon={<Lock className="w-4 h-4" />}
                        />

                        <Input
                            label="Confirm New Password"
                            type="password"
                            required
                            placeholder="Repeat new password"
                            value={passwordForm.data.password_confirmation}
                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                            error={passwordForm.errors.password_confirmation}
                            leftIcon={<Lock className="w-4 h-4" />}
                        />

                        <div className="pt-2 flex justify-end">
                            <Button
                                type="submit"
                                variant="secondary"
                                isLoading={passwordForm.processing}
                                leftIcon={<KeyRound className="w-4 h-4" />}
                            >
                                Update Password
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}

