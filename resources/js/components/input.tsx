import { ChangeEvent } from 'react';

interface InputProps {
    label: string;
    name: string;
    type?: string;
    value: string | number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export function Input({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
    className = '',
}: InputProps) {
    return (
        <div className={className}>
            <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            />
        </div>
    );
}
