import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="bg-[#faf9f6] min-h-screen py-24">
            <ResponsiveContainer className="max-w-4xl space-y-16">
                <div className="space-y-6 text-center">
                    <p className="text-[10px] uppercase tracking-[0.6em] font-black text-fuchsia-600">Get In Touch</p>
                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">Contact Our Studio</h1>
                    <p className="mx-auto max-w-xl text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Whether it's a styling question or an order update, we're here to help.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6 hover:shadow-xl transition-shadow group">
                        <div className="h-12 w-12 bg-fuchsia-50 rounded-2xl flex items-center justify-center text-fuchsia-600 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Email Us</h3>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">hello@lyralabel.com.np</p>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6 hover:shadow-xl transition-shadow group">
                        <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">WhatsApp Support</h3>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">+977 9801234567</p>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6 hover:shadow-xl transition-shadow group">
                        <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-2">Our Boutique</h3>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">Durbar Marg, Kathmandu, Nepal</p>
                        </div>
                    </div>
                </div>
            </ResponsiveContainer>
        </div>
    );
}
