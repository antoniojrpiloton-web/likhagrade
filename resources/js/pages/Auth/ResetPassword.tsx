import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock, KeyRound } from 'lucide-react';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.update'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password — LikhaGrade" />

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Set new password
                </h1>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Choose a secure new password for your account
                </p>
            </div>

            <Card className="shadow-md">
                <form onSubmit={submit} className="space-y-4">
                    <Input
                        label="Email Address"
                        type="email"
                        required
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                    />

                    <Input
                        label="New Password"
                        type="password"
                        required
                        autoFocus
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        leftIcon={<Lock className="w-4 h-4" />}
                    />

                    <Input
                        label="Confirm New Password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Repeat new password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        error={errors.password_confirmation}
                        leftIcon={<Lock className="w-4 h-4" />}
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full"
                            size="md"
                            isLoading={processing}
                            leftIcon={<KeyRound className="w-4 h-4" />}
                        >
                            Reset Password
                        </Button>
                    </div>
                </form>
            </Card>
        </GuestLayout>
    );
}

