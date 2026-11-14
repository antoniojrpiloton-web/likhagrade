import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { School, Building2, UserCheck, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { GoogleButton } from '@/components/ui/GoogleButton';

interface InvitationData {
    token: string;
    email: string;
    role: string;
    tenant_name: string;
    org_type: string;
    department_name: string | null;
    inviter_name: string | null;
    expires_at: string;
}

interface CurrentUser {
    id: number;
    email: string;
    name: string;
}

interface Props {
    invitation: InvitationData;
    current_user: CurrentUser | null;
}

export default function AcceptInvitation({ invitation, current_user }: Props) {
    const isMatchingLoggedInUser = current_user && current_user.email.toLowerCase() === invitation.email.toLowerCase();

    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('invitations.accept', invitation.token));
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title={`Join ${invitation.tenant_name}`} />

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <School className="h-7 w-7" />
                    </div>
                </div>

                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Join {invitation.tenant_name}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                    You have been invited as a <span className="font-semibold text-blue-600">{invitation.role}</span>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    {/* Invitation Card Banner */}
                    <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700/60 mb-6">
                        <div className="flex items-start gap-3">
                            <Building2 className="h-6 w-6 text-blue-600 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                                    {invitation.tenant_name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {invitation.org_type}
                                    {invitation.department_name && (
                                        <span> • Department: <strong className="text-slate-700 dark:text-slate-300">{invitation.department_name}</strong></span>
                                    )}
                                </p>
                                <div className="pt-2 text-xs text-slate-600 dark:text-slate-400">
                                    Invited by: <span className="font-medium">{invitation.inviter_name || 'Organization Administrator'}</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    Assigned Email: <strong className="text-slate-700 dark:text-slate-300">{invitation.email}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {current_user ? (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                            {current_user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Logged in as {current_user.name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {current_user.email}
                                            </p>
                                        </div>
                                    </div>
                                    {!isMatchingLoggedInUser && (
                                        <div className="mt-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                                            Note: You are logged in with <strong>{current_user.email}</strong>, while this invitation was issued to <strong>{invitation.email}</strong>. Accepting will link this workspace to your active account.
                                        </div>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    className="w-full justify-center"
                                    isLoading={processing}
                                >
                                    Accept Invitation & Enter Workspace
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <GoogleButton
                                        href={`${route('auth.google')}?invitation_token=${invitation.token}`}
                                        text="Quick Join with Google"
                                    />
                                </div>

                                <div className="relative my-3 flex items-center justify-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                                    <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 dark:bg-slate-900 absolute">
                                        Or create password
                                    </span>
                                </div>

                                <div className="text-xs text-slate-500 pb-1">
                                    Complete your teacher profile to activate your institutional access:
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="First Name"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        error={errors.first_name}
                                        required
                                    />
                                    <Input
                                        label="Last Name"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        error={errors.last_name}
                                        required
                                    />
                                </div>

                                <Input
                                    label="Email Address"
                                    value={invitation.email}
                                    disabled
                                    helperText="Email is locked to this invitation"
                                />

                                <Input
                                    label="Create Password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    error={errors.password}
                                    required
                                />

                                <Input
                                    label="Confirm Password"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    error={errors.password_confirmation}
                                    required
                                />

                                <div className="pt-2">
                                    <Checkbox
                                        id="terms"
                                        checked={data.terms}
                                        onChange={(e) => setData('terms', e.target.checked)}
                                        label={
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                I agree to the Terms of Service & Privacy Policy.
                                            </span>
                                        }
                                        error={errors.terms}
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        className="w-full justify-center"
                                        isLoading={processing}
                                    >
                                        Register & Accept Invitation
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>

                                <div className="text-center pt-2 text-xs text-slate-500">
                                    Already have an account?{' '}
                                    <Link href={route('login')} className="text-blue-600 font-semibold hover:underline">
                                        Log in first
                                    </Link>
                                    , then re-open this invite link.
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

