import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => setShowPassword(!showPassword);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <form onSubmit={submit} className="flex w-full flex-col items-center gap-4">
                <div className="grid w-full max-w-sm gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            autoComplete="email"
                            placeholder="email@gmail.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            {canResetPassword && (
                                <TextLink href={route('password.request')} className="text-right text-xs">
                                    Forgot Password?
                                </TextLink>
                            )}
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="current-password"
                                placeholder="********"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={togglePassword}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <Button type="submit" className="w-full rounded-xl bg-green-600 hover:bg-green-700" disabled={processing}>
                        {processing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Login
                    </Button>

                    <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                        <div className="h-px flex-1 bg-gray-300" />
                        <span>Or</span>
                        <div className="h-px flex-1 bg-gray-300" />
                    </div>

                    <Button className='group full rounded-xl bg-white border border-gray-300'>
                        <a href="/auth-google-redirect" className="flex w-full items-center justify-center gap-2">
                            <img src="/google.svg" alt="Google" className="h-5 w-5" />
                            <span className='text-black group-hover:text-white'>Continue with Google</span>
                        </a>
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    Don’t have an account?{' '}
                    <TextLink href={route('register')}>
                        <strong>Sign up</strong>
                    </TextLink>
                </div>

                {status && <div className="mt-2 text-sm font-medium text-green-600">{status}</div>}
            </form>
        </AuthLayout>
    );
}
