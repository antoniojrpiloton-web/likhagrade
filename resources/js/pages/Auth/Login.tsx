import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { GoogleButton } from '@/components/ui/GoogleButton';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login.store'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Sign In — LikhaGrade" />

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Welcome back
                </h1>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Sign in to your teacher workspace or platform administration
                </p>
            </div>

            {status && (
                <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                    {status}
                </div>
            )}

            <Card className="shadow-md">
                <div className="mb-4">
                    <GoogleButton text="Sign in with Google" />
                </div>

                <div className="relative my-4 flex items-center justify-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 dark:bg-slate-900 absolute">
                        Or with email
                    </span>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <Input
                        label="Email Address"
                        type="email"
                        required
                        autoComplete="email"
                        autoFocus
                        placeholder="teacher@example.com"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        leftIcon={<Mail className="w-4 h-4" />}
                    />

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <Link
                                href={route('password.request')}
                                className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            type="password"
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                            leftIcon={<Lock className="w-4 h-4" />}
                        />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <Checkbox
                            id="remember"
                            label="Remember this device"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full"
                            size="md"
                            isLoading={processing}
                            leftIcon={<LogIn className="w-4 h-4" />}
                        >
                            Sign In to Account
                        </Button>
                    </div>
                </form>

                <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Don't have a teacher workspace yet?{' '}
                        <Link
                            href={route('register')}
                            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Create personal workspace
                        </Link>
                    </p>
                </div>
            </Card>
        </GuestLayout>
    );
}

