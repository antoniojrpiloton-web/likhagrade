import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password — LikhaGrade" />

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Forgot password?
                </h1>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Enter your email address and we will send you a secure link to reset your password.
                </p>
            </div>

            {status && (
                <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                    {status}
                </div>
            )}

            <Card className="shadow-md">
                <form onSubmit={submit} className="space-y-4">
                    <Input
                        label="Email Address"
                        type="email"
                        required
                        autoFocus
                        placeholder="teacher@example.com"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        leftIcon={<Mail className="w-4 h-4" />}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full"
                            size="md"
                            isLoading={processing}
                            leftIcon={<Send className="w-4 h-4" />}
                        >
                            Email Password Reset Link
                        </Button>
                    </div>
                </form>

                <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
                    <Link
                        href={route('login')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                    </Link>
                </div>
            </Card>
        </GuestLayout>
    );
}

