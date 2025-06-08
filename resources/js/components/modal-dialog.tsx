import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect } from 'react';

type ModalSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
};

interface ModalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: ModalSize;
}

export function ModalDialog({ isOpen, onClose, title, children, size = 'md' }: ModalDialogProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`relative w-full ${sizeClasses[size]} rounded-xl bg-white p-6 shadow-xl`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="mb-4 text-xl font-semibold text-gray-800">{title}</h2>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
