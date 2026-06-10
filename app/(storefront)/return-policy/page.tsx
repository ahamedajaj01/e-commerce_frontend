import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";

export default function ReturnPolicyPage() {
    return (
        <div className="bg-[#faf9f6] min-h-screen py-24">
            <ResponsiveContainer className="max-w-3xl space-y-12">
                <div className="space-y-6">
                    <p className="text-[10px] uppercase tracking-[0.6em] font-black text-fuchsia-600">Customer Care</p>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Return & Exchange</h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Our commitment to your satisfaction and style.
                    </p>
                </div>

                <div className="prose prose-slate prose-sm max-w-none space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Exchange Window</h2>
                        <p className="text-slate-600 leading-relaxed">
                            We offer exchanges within 7 days of delivery. The item must be in its original condition, unworn, unwashed, and with all tags attached.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Return Process</h2>
                        <p className="text-slate-600 leading-relaxed">
                            To initiate a return or exchange, please contact our support team via WhatsApp or Email. We will arrange a pickup or provide instructions for shipping the item back to our studio.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Refunds</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Once your return is inspected, we will notify you of the approval or rejection of your refund. If approved, the refund will be processed to your original payment method or as store credit.
                        </p>
                    </section>
                </div>
            </ResponsiveContainer>
        </div>
    );
}
