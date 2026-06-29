import { MapPin } from "lucide-react";

interface OrderAddressCardProps {
    name: string;
    phone: string;
    email?: string;
    province: string;
    district: string;
    city: string;
    street: string;
}

export function OrderAddressCard({
    name,
    phone,
    email,
    province,
    district,
    city,
    street
}: OrderAddressCardProps) {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Logistics Destination</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Recipient</p>
                    <div className="space-y-1">
                        <p className="text-sm font-black">{name}</p>
                        <p className="text-xs font-medium text-slate-500">{phone}</p>
                        {email && <p className="text-xs font-medium text-slate-500">{email}</p>}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Shipping Address</p>
                        <MapPin className="w-3 h-3 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black">{city}</p>
                        <p className="text-xs font-medium text-slate-500">{street}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{district}, {province}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
