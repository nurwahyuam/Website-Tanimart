import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="background min-h-screen flex flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-md bg-white p-6 rounded-3xl">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col items-center">
                        <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">
                            <div className="flex-col h-24 w-24 items-center justify-center rounded-md">
                                <img src="/Logo_Full.png" alt="TaniMart Logo" className="size-24 fill-current text-[var(--foreground)] dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium m-0">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm">{description}</p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
