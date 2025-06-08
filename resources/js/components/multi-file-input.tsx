import { ChangeEvent } from 'react';
import { CirclePlus, Trash2 } from 'lucide-react';

interface MultiFileInputProps {
    label: string;
    name: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    previews: string[];
    currentImages?: string[];
    onRemove: (index: number) => void;
    className?: string;
}

export function MultiFileInput({
    label,
    name,
    onChange,
    previews,
    currentImages = [],
    onRemove,
    className = '',
}: MultiFileInputProps) {
    const allImages = [...currentImages, ...previews];

    return (
        <div className={className}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex flex-wrap gap-2">
                {allImages.map((image, index) => (
                    <div key={index} className="relative">
                        <img
                            src={image}
                            alt={`Preview ${index}`}
                            className="h-20 w-20 rounded object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white"
                            aria-label="Remove image"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                <div className="flex h-20 w-20 items-center justify-center rounded border-2 border-dashed border-gray-300">
                    <label htmlFor={name} className="cursor-pointer">
                        <CirclePlus className="text-gray-400" size={20} />
                        <input
                            type="file"
                            id={name}
                            name={name}
                            accept="image/*"
                            onChange={onChange}
                            multiple
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">Upload images (multiple allowed)</p>
        </div>
    );
}
