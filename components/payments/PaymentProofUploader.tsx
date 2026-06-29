"use client";

import { useState, useRef } from "react";
import { Upload, X, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentProofUploaderProps {
    onUpload: (file: File) => void;
    isUploading?: boolean;
}

export function PaymentProofUploader({ onUpload, isUploading }: PaymentProofUploaderProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Only image files are accepted.");
            return;
        }

        // Generate preview for UI
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Pass the actual File object back for the API
        onUpload(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Proof of Settlement</label>

            <div
                className={cn(
                    "relative min-h-[300px] border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-12 transition-all group",
                    isDragging ? "bg-slate-50 border-slate-900" : "bg-white border-slate-100 hover:border-slate-300",
                    preview ? "border-solid border-emerald-100 bg-emerald-50/20" : ""
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
            >
                {preview ? (
                    <div className="relative w-full h-full flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                        <div className="relative h-48 w-full max-w-sm rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl shadow-emerald-200/50">
                            <img src={preview} alt="Proof" className="w-full h-full object-cover" />
                            {isUploading && (
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => { setPreview(null); }}
                            className="absolute -top-4 -right-4 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 text-emerald-600">
                            <Check className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Image Document Loaded</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:scale-110 group-hover:rotate-12">
                            <Upload className="w-8 h-8" />
                        </div>
                        <div className="text-center mt-8 space-y-2">
                            <p className="text-sm font-black text-slate-900 leading-tight">Drag and drop receipts or screenshots</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">JPEG, PNG, or PDF formats supported</p>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-8 px-10 py-4 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 transition-colors"
                        >
                            Select from Archive
                        </button>
                    </>
                )}

                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    accept="image/*"
                />
            </div>
        </div>
    );
}
