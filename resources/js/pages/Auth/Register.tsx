import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, User as UserIcon, UserPlus } from 'lucide-react';
import { GuestLayout } from '@/layouts/GuestLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card } from '@/components/ui/Card';
import { GoogleButton } from '@/components/ui/GoogleButton';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('register.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Create Teacher Account — LikhaGrade" />

            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Create Teacher Workspace
                </h1>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Register with any valid email address to start checking exams
                </p>
            </div>

            <Card className="shadow-md">
                <div className="mb-4">
                    <GoogleButton text="Sign up with Google" />
                </div>

                <div className="relative my-4 flex items-center justify-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 dark:bg-slate-900 absolute">
                        Or with email
                    </span>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                            label="First Name"
                            type="text"
                            required
                            autoFocus
                            placeholder="Maria"
                            value={data.first_name}
                            onChange={(e) => setData('first_name', e.target.value)}
                            error={errors.first_name}
                            leftIcon={<UserIcon className="w-4 h-4" />}
                        />
                        <Input
                            label="Last Name"
                            type="text"
                            required
                            placeholder="Santos"
                            value={data.last_name}
                            onChange={(e) => setData('last_name', e.target.value)}
                            error={errors.last_name}
                        />
                    </div>

                    <Input
                        label="Email Address"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="teacher.maria@gmail.com"
                        hint="Any standard or personal email address accepted"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        leftIcon={<Mail className="w-4 h-4" />}
                    />

                    <Input
                        label="Password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Minimum 8 characters"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        leftIcon={<Lock className="w-4 h-4" />}
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        error={errors.password_confirmation}
                        leftIcon={<Lock className="w-4 h-4" />}
                    />

                    <div className="pt-1">
                        <Checkbox
                            id="terms"
                            checked={data.terms}
                            onChange={(e) => setData('terms', e.target.checked)}
                            error={errors.terms}
                            label={
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                    I agree to the{' '}
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                                        Terms of Service
                                    </span>{' '}
                                    and{' '}
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                                        Privacy Agreement
                                    </span>
                                </span>
                            }
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full"
                            size="md"
                            isLoading={processing}
                            leftIcon={<UserPlus className="w-4 h-4" />}
                        >
                            Create Account & Personal Workspace
                        </Button>
                    </div>
                </form>

                <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link
                            href={route('login')}
                            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </Card>
        </GuestLayout>
    );
}

