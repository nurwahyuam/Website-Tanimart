import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'warning' | 'danger';

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
};

interface ButtonProps {
    type?: 'button' | 'submit' | 'reset';
    variant?: ButtonVariant;
    onClick?: () => void;
    children: ReactNode;
    disabled?: boolean;
    className?: string;
    isLoading?: boolean;
}

export function Button({
    type = 'button',
    variant = 'primary',
    onClick,
    children,
    disabled = false,
    className = '',
    isLoading = false,
}: ButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none ${variantClasses[variant]} ${disabled || isLoading ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {children}
                </>
            ) : (
                children
            )}
        </button>
    );
}
