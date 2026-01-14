"use client";

import { useState, useTransition } from "react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "danger",
}: ConfirmDialogProps) {
    const [isPending, startTransition] = useTransition();

    if (!isOpen) return null;

    const handleConfirm = () => {
        startTransition(async () => {
            await onConfirm();
            onClose();
        });
    };

    const variantStyles = {
        danger: "from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700",
        warning: "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
        info: "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fade-in">
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-300 text-sm mb-6">{message}</p>

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isPending}
                        className={`px-4 py-2 bg-gradient-to-r ${variantStyles[variant]} text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2`}
                    >
                        {isPending && (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
