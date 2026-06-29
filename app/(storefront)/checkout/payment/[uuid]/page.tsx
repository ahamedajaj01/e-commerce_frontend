"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { fetchCheckoutSession, completeCheckoutSession, updateCheckoutSession } from "@/lib/api/checkout";
import { fetchStorefrontPaymentMethods, createStorefrontTransaction, submitPaymentProof } from "@/lib/api/payments";
import type { CheckoutSession } from "@/types/checkout";
import type { PaymentMethod } from "@/types/payment";
import {
    Loader2,
    ChevronLeft,
    Lock,
    ShieldCheck,
    CreditCard,
    Check,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { PaymentMethodCard } from "@/components/payments/PaymentMethodCard";
import { PaymentInstructionsCard } from "@/components/payments/PaymentInstructionsCard";
import { PaymentProofUploader } from "@/components/payments/PaymentProofUploader";

export default function PaymentReviewPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuth();
    const { clearCart } = useCart();
    const uuid = params.uuid as string;

    const [session, setSession] = useState<CheckoutSession | null>(null);
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // After completion state
    const [proofFile, setProofFile] = useState<File | null>(null);

    useEffect(() => {
        const loadInitial = async () => {
            try {
                const [sessionData, methodsData] = await Promise.all([
                    fetchCheckoutSession(uuid, token ?? undefined),
                    fetchStorefrontPaymentMethods(token ?? undefined)
                ]);
                setSession(sessionData);
                setMethods(methodsData);
                if (methodsData.length > 0) {
                    setSelectedMethodId(methodsData[0].id);
                }
            } catch (err: any) {
                setError(err.message || "Failed to load checkout details.");
            } finally {
                setIsLoading(false);
            }
        };
        loadInitial();
    }, [uuid]);

    const selectedMethod = useMemo(() =>
        methods.find(m => m.id === selectedMethodId),
        [methods, selectedMethodId]);

    const handleFinalize = async () => {
        if (!selectedMethod) return;
        setIsCompleting(true);
        setError(null);

        try {
            // STEP 2: Complete Checkout (Creates the Order)
            const completion = await completeCheckoutSession(uuid, token ?? undefined);
            const orderId = completion.order_id;

            // STEP 3: Link Payment (Creates the "Payment Row")
            const transaction = await createStorefrontTransaction({
                order_id: orderId,
                payment_method_id: selectedMethod.id
            }, token ?? undefined);

            // STEP 4: Optional Proof Upload
            if (selectedMethod.requires_proof && proofFile) {
                await submitPaymentProof(transaction.id, proofFile, token ?? undefined);
            }

            clearCart();

            // Redirect to success
            const statusParam = selectedMethod.requires_proof ? "&status=SUBMITTED" : "";
            router.push(`/order-success?order_number=${completion.order_number}&id=${orderId}${statusParam}`);

        } catch (err: any) {
            // Step 5: Explicitly show error message for 400 Bad Request / Insufficient Stock
            const message = err.message || "Payment orchestration failed. Please try again.";
            setError(message);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setIsCompleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Payment Securely...</p>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-6">
                <div className="max-w-md w-full border border-slate-100 p-10 text-center space-y-6">
                    <h1 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-6 uppercase tracking-tight">Session Link Broken</h1>
                    <p className="text-sm font-medium text-slate-500">{error || "Could not retrieve checkout session state."}</p>
                    <Link href="/checkout" className="block w-full py-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
                        Re-Initiate Checkout
                    </Link>
                </div>
            </div>
        );
    }

    const totalAmount = (Number(session.total_price) + Number(session.shipping_fee)).toFixed(2);

    return (
        <div className="bg-white min-h-screen text-slate-900 pb-20 pt-10 lg:pt-16">
            <ResponsiveContainer>
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Navigation Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => router.push("/checkout")}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Back to Information
                            </button>
                            <div className="w-px h-4 bg-slate-100" />
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Secure Settlement
                                </h1>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                            <Lock className="w-3.5 h-3.5" />
                            SSL Secured Checkout
                        </div>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-rose-900">Settlement Error</p>
                                <p className="text-xs text-rose-600 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start font-outfit">
                        {/* Left Column: Method Selection & Execution */}
                        <div className="lg:col-span-12 xl:col-span-7 space-y-10">

                            {/* Method Selection */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Payment Method</h3>
                                    <p className="text-xs text-slate-500 mt-1">Select your preferred way to settle this order.</p>
                                </div>
                                <div className="grid gap-4">
                                    {methods.map(method => (
                                        <PaymentMethodCard
                                            key={method.id}
                                            method={method}
                                            isSelected={selectedMethodId === method.id}
                                            onSelect={(id) => {
                                                setSelectedMethodId(id);
                                                updateCheckoutSession(uuid, { payment_method: "COD" }, token ?? undefined)
                                                    .catch(err => console.error("Failed to update payment method on session", err));
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Payment Context (Instructions & Proof) */}
                            {selectedMethod && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <PaymentInstructionsCard
                                        methodName={selectedMethod.name}
                                        instructions={selectedMethod.instructions || ""}
                                        qrImage={selectedMethod.qr_image}
                                        amount={totalAmount}
                                    />

                                    {selectedMethod.requires_proof && (
                                        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-8 shadow-sm">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center">
                                                        <CreditCard className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-none">Voucher Verification</p>
                                                        <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Upload proof for {selectedMethod.name}</p>
                                                    </div>
                                                </div>
                                                {proofFile && (
                                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                                        <Check className="w-3 h-3" />
                                                        Ready
                                                    </div>
                                                )}
                                            </div>
                                            <PaymentProofUploader
                                                onUpload={(file) => setProofFile(file)}
                                                isUploading={isCompleting}
                                            />
                                        </div>
                                    )}

                                    {/* Final Action */}
                                    <div className="pt-6">
                                        <button
                                            onClick={handleFinalize}
                                            disabled={isCompleting || (selectedMethod.requires_proof && !proofFile)}
                                            className="w-full py-5 rounded-2xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {isCompleting ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                            ) : (
                                                <ShieldCheck className="w-4 h-4" />
                                            )}
                                            Complete Order Registry
                                        </button>
                                        <p className="text-center text-[10px] font-medium text-slate-400 mt-6 uppercase tracking-widest italic">
                                            {selectedMethod.requires_proof
                                                ? "Order will be confirmed after voucher verification by our staff."
                                                : "Instant confirmation - Direct settlement method selected."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Sticky Order Summary */}
                        <div className="lg:col-span-12 xl:col-span-5 xl:sticky xl:top-24">
                            <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-8 pt-10 space-y-8">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-4">Order Summary</h2>
                                <div className="space-y-5">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900">Rs {session.total_price}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        <span>Shipping</span>
                                        <span className="text-slate-900">Rs {session.shipping_fee}</span>
                                    </div>
                                    <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Total Due</p>
                                            <p className="text-3xl font-bold tracking-tight text-slate-900 mt-1">Rs {totalAmount}</p>
                                        </div>
                                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-200">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 border border-slate-100 rounded-3xl flex items-center gap-4 bg-white">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-5 h-5 text-slate-400" />
                                </div>
                                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                                    Your secure order information is encrypted. Settlement instructions are verified endpoints.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </ResponsiveContainer>
        </div>
    );
}
