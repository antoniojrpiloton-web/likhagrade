import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Building2, School, User, Mail, Phone, MapPin, Lock, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { SharedProps } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

const ORG_TYPES = [
    'University',
    'College',
    'High School',
    'Elementary School',
    'DepEd Division',
    'Private Institution',
    'Training Center',
    'Other',
];

export default function OrganizationRegister() {
    const { auth } = usePage<SharedProps>().props;
    const currentUser = auth.user;

    const { data, setData, post, processing, errors } = useForm({
        org_name: '',
        org_type: 'University',
        contact_person: currentUser ? currentUser.name : '',
        contact_email: currentUser ? currentUser.email : '',
        contact_number: '',
        address: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('organization.register.store'));
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Head title="Register Educational Institution" />

            <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="flex justify-center items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Building2 className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            LikhaGrade <span className="text-blue-600 text-xs uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 font-semibold tracking-wide">Enterprise</span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Institutional Examination & Grading Cloud</p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Register Your Educational Institution
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                        Create an institutional workspace for your university, college, or school. Invite faculty, organize departments, share quotas, and manage OMR assessments centrally.
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Institution Information */}
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                            <div className="flex items-center gap-2 mb-4">
                                <School className="h-5 w-5 text-blue-600" />
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                    Institution Details
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Institution / Organization Name"
                                        placeholder="e.g. Surigao del Norte State University (SNSU)"
                                        value={data.org_name}
                                        onChange={(e) => setData('org_name', e.target.value)}
                                        error={errors.org_name}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Institution Type
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={data.org_type}
                                        onChange={(e) => setData('org_type', e.target.value)}
                                    >
                                        {ORG_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.org_type && (
                                        <p className="mt-1 text-xs text-rose-600">{errors.org_type}</p>
                                    )}
                                </div>

                                <div>
                                    <Input
                                        label="Official Contact Number (Optional)"
                                        placeholder="+63 (86) 826-0134"
                                        value={data.contact_number}
                                        onChange={(e) => setData('contact_number', e.target.value)}
                                        error={errors.contact_number}
                                    />
                                </div>

                                <div>
                                    <Input
                                        label="Contact Person (Dean / Principal / Officer)"
                                        placeholder="Dr. John Santos"
                                        value={data.contact_person}
                                        onChange={(e) => setData('contact_person', e.target.value)}
                                        error={errors.contact_person}
                                        required
                                    />
                                </div>

                                <div>
                                    <Input
                                        label="Official Contact Email"
                                        type="email"
                                        placeholder="registrar@snsu.edu.ph"
                                        value={data.contact_email}
                                        onChange={(e) => setData('contact_email', e.target.value)}
                                        error={errors.contact_email}
                                        required
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <Input
                                        label="Campus Address (Optional)"
                                        placeholder="Narciso Street, Surigao City, Surigao del Norte, Philippines"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        error={errors.address}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Administrator Account (if guest) */}
                        {!currentUser ? (
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                        Organization Administrator Account
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Input
                                            label="First Name"
                                            value={data.first_name}
                                            onChange={(e) => setData('first_name', e.target.value)}
                                            error={errors.first_name}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            label="Last Name"
                                            value={data.last_name}
                                            onChange={(e) => setData('last_name', e.target.value)}
                                            error={errors.last_name}
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Input
                                            label="Your Personal / Professional Email (Login Account)"
                                            type="email"
                                            placeholder="admin.lead@gmail.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            error={errors.email}
                                            helperText="Any valid email address is accepted. School email not mandatory."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            label="Password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            error={errors.password}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            label="Confirm Password"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            error={errors.password_confirmation}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                        {currentUser.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            Registering as {currentUser.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            ({currentUser.email}) — You will become the Organization Owner
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                    Logged in
                                </span>
                            </div>
                        )}

                        {!currentUser && (
                            <div className="flex items-start">
                                <Checkbox
                                    id="terms"
                                    checked={data.terms}
                                    onChange={(e) => setData('terms', e.target.checked)}
                                    label={
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            I agree to the{' '}
                                            <a href="#" className="text-blue-600 hover:underline">
                                                Institutional Service Terms
                                            </a>{' '}
                                            and{' '}
                                            <a href="#" className="text-blue-600 hover:underline">
                                                Educational Privacy Policy
                                            </a>
                                            .
                                        </span>
                                    }
                                    error={errors.terms}
                                />
                            </div>
                        )}

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full justify-center text-base py-3 shadow-md shadow-blue-500/20"
                                isLoading={processing}
                            >
                                Complete Organization Registration
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                        Looking for an individual teacher workspace instead?{' '}
                        <Link href={route('register')} className="font-semibold text-blue-600 hover:text-blue-500">
                            Register as an Individual Teacher
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

