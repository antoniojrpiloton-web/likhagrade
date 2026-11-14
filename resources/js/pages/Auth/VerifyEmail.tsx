import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { MailCheck, LogOut, RotateCcw } from 'lucide-react';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    const logout = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('logout'));
    };

    return (
        <GuestLayout>
            <Head title="Verify Email Address — LikhaGrade" />

            <div className="text-center mb-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-3 shadow-xs">
                    <MailCheck className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Verify your email
                </h1>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Thanks for registering! Please check your inbox and click the verification link before proceeding.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                    A new verification link has been sent to the email address you provided during registration.
                </div>
            )}

            <Card className="shadow-md">
                <div className="space-y-4">
                    <form onSubmit={submit}>
                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={processing}
                            leftIcon={<RotateCcw className="w-4 h-4" />}
                        >
                            Resend Verification Email
                        </Button>
                    </form>

                    <form onSubmit={logout}>
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full text-slate-500 hover:text-slate-800"
                            leftIcon={<LogOut className="w-4 h-4" />}
                        >
                            Sign Out
                        </Button>
                    </form>
                </div>
            </Card>
        </GuestLayout>
    );
}

