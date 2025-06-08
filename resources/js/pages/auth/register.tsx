import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    no_phone: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        no_phone: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const togglePassword = () => setShowPassword(!showPassword);
    const togglePasswordConfirmation = () => setShowPasswordConfirmation(!showPasswordConfirmation);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />
            <form className="flex w-full flex-col items-center gap-2" onSubmit={submit}>
                <div className="grid w-full max-w-sm gap-4">
                    <div className="grid md:flex md:items-start gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                disabled={processing}
                                placeholder="Full Name"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="no_phone">Phone Number</Label>
                            <Input
                                id="no_phone"
                                type="text"
                                required
                                tabIndex={3}
                                autoComplete="tel"
                                value={data.no_phone}
                                onChange={(e) => setData('no_phone', e.target.value)}
                                disabled={processing}
                                placeholder="081234567890"
                            />
                            <InputError message={errors.no_phone} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@gmail.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid md:flex md:items-start gap-3">
                        <div className="relative flex-1">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                placeholder="********"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={togglePassword}
                                className="absolute top-[72%] right-3 -translate-y-1/2 text-gray-500"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <InputError message={errors.password} />
                        </div>

                        <div className="relative flex-1">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                id="password_confirmation"
                                type={showPasswordConfirmation ? 'text' : 'password'}
                                required
                                tabIndex={5}
                                autoComplete="new-password"
                                placeholder="********"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                disabled={processing}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordConfirmation}
                                className="absolute top-[72%] right-3 -translate-y-1/2 text-gray-500"
                                tabIndex={-1}
                            >
                                {showPasswordConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <InputError message={errors.password_confirmation} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full rounded-xl bg-green-600 hover:bg-green-700" tabIndex={6} disabled={processing}>
                        {processing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Create Account
                    </Button>

                    <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                        <div className="h-px flex-1 bg-gray-300" />
                        <span>Or</span>
                        <div className="h-px flex-1 bg-gray-300" />
                    </div>

                    <Button className="group full rounded-xl border border-gray-300 bg-white">
                        <a href="/auth-google-redirect" className="flex w-full items-center justify-center gap-2">
                            <img src="/google.svg" alt="Google" className="h-5 w-5" />
                            <span className="text-black group-hover:text-white">Continue with Google</span>
                        </a>
                    </Button>

                    <div className="text-muted-foreground text-center text-sm">
                        Already have an account?{' '}
                        <TextLink href={route('login')} tabIndex={7}>
                            Log in
                        </TextLink>
                    </div>
                </div>
            </form>
        </AuthLayout>
    );
}
