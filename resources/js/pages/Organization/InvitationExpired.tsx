import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, School } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
    tenant_name?: string;
}

export default function InvitationExpired({ tenant_name }: Props) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title="Invitation Expired" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Invitation Expired or Invalid
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    The invitation link for {tenant_name ? <strong>{tenant_name}</strong> : 'this workspace'} has expired or is no longer valid.
                </p>

                <div className="mt-8 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                    <p className="text-xs text-slate-500">
                        Please contact the administrator or coordinator of your educational institution to request a new invitation.
                    </p>

                    <div className="pt-2">
                        <Link href={route('login')}>
                            <Button variant="primary" className="w-full justify-center">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Return to Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

