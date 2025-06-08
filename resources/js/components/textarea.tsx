import { ChangeEvent } from 'react';

interface TextareaProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    className?: string;
}

export function Textarea({
    label,
    name,
    value,
    onChange,
    placeholder = '',
    required = false,
    rows = 3,
    className = '',
}: TextareaProps) {
    return (
        <div className={className}>
            <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                rows={rows}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            />
        </div>
    );
}
