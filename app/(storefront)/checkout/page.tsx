"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ResponsiveContainer } from "@/components/shared/ResponsiveContainer";
import { getMediaUrl } from "@/lib/utils";
import { calculateShipping } from "@/lib/api/shipping";
import { createCheckoutSession } from "@/lib/api/checkout";
import type { ShippingCalculationResult } from "@/types/shipping";
import {
    ChevronLeft,
    Trash2,
    Truck,
    ChevronDown,
    ChevronUp,
    MapPin,
    Search,
    Loader2,
    ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
    const { cart, items } = useCart();
    const { token } = useAuth();
    const router = useRouter();

    // Form State: Personal
    const [personal, setPersonal] = useState({
        full_name: "",
        email: "",
        phone: ""
    });

    // Form State: Smart Auto-Complete Address
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isSearchingMap, setIsSearchingMap] = useState(false);

    // Extracted Geodata
    const [selectedGeo, setSelectedGeo] = useState<{ city: string, district: string, province: string, original: string } | null>(null);
    const [landmark, setLandmark] = useState("");

    // Shipping result (single matched rule from backend)
    const [shippingResult, setShippingResult] = useState<ShippingCalculationResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [shippingError, setShippingError] = useState<string | null>(null);

    // Form State: UI
    const [isCartItemsOpen, setIsCartItemsOpen] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- LIVE GEOCODING (OpenStreetMap Nominatim) ---
    useEffect(() => {
        if (!searchQuery || selectedGeo?.original === searchQuery || searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        const fetchLocations = async () => {
            setIsSearchingMap(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=np&limit=5&q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                setSuggestions(data);
            } catch (err) {
                console.error("Geocoding failed", err);
            } finally {
                setIsSearchingMap(false);
            }
        };

        const timer = setTimeout(fetchLocations, 600);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedGeo]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setSuggestions([]);
                setIsSuggesting(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectSuggestion = (place: any) => {
        const addressName = place.display_name.split(",").slice(0, 2).join(", ");
        setSearchQuery(addressName);
        const addr = place.address || {};
        let stateName = (addr.state || addr.region || "").replace(/\s*Province\s*/gi, "").trim();
        let districtName = (addr.county || addr.district || addr.state_district || "").replace(/\s*District\s*/gi, "").trim();

        setSelectedGeo({
            original: addressName,
            city: addr.city || addr.town || addr.village || addr.municipality || "",
            district: districtName,
            province: stateName
        });

        setSuggestions([]);
        setIsSuggesting(false);
    };

    // --- CALCULATE SHIPPING SILENTLY ---
    useEffect(() => {
        if (!selectedGeo) {
            setShippingResult(null);
            setShippingError(null);
            return;
        }

        const fetchRates = async () => {
            setIsCalculating(true);
            setShippingError(null);
            setShippingResult(null);

            try {
                const res = await calculateShipping({
                    province: selectedGeo.province || undefined,
                    district: selectedGeo.district || undefined,
                    city: selectedGeo.city || undefined,
                    order_total: Number(cart?.total_price || 0),
                }, token ?? undefined);

                if (res) {
                    setShippingResult(res);
                } else {
                    setShippingError("We currently do not deliver to this location.");
                }
            } catch {
                setShippingError("We currently do not deliver to this location.");
            } finally {
                setIsCalculating(false);
            }
        };

        fetchRates();
    }, [selectedGeo, cart?.total_price]);

    const totalAmount = useMemo(() => {
        const base = Number(cart?.total_price || 0);
        const fee = Number(shippingResult?.fee || 0);
        return (base + fee).toFixed(2);
    }, [cart?.total_price, shippingResult]);

    const deliveryEstimation = useMemo(() => {
        if (!shippingResult) return null;
        if (shippingResult.arrival_estimate) {
            return shippingResult.arrival_estimate;
        }
        return shippingResult.estimated_days;
    }, [shippingResult]);

    const handleCreateSession = async () => {
        if (!selectedGeo || !shippingResult) return;
        if (!personal.full_name || !personal.phone) {
            alert("Please fill in your name and phone number.");
            return;
        }

        setIsProcessing(true);
        try {
            const session = await createCheckoutSession({
                name: personal.full_name,
                email: personal.email,
                phone: personal.phone,
                province: selectedGeo.province,
                district: selectedGeo.district,
                city: selectedGeo.city,
                street: searchQuery,
                shipping_rule_id: shippingResult.rule_id,
            }, token ?? undefined);
            router.push(`/checkout/payment/${session.id}`);
        } catch (err: any) {
            alert(err.message || "Failed to initialize checkout.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-[#fcfcfc] min-h-screen text-slate-900 pb-20">
            <ResponsiveContainer className="py-10 lg:py-16">
                <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-12 items-start">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-10 w-full">
                        <div className="animate-in fade-in duration-500 space-y-8">
                            {/* Personal Info */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm space-y-8">
                                <h2 className="text-lg font-bold tracking-tight">Personal Information</h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400">Full Name <span className="text-rose-500">*</span></label>
                                        <input type="text" placeholder="John Doe" value={personal.full_name} onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-slate-200 outline-none" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 text-slate-400"><label className="text-xs font-bold">Email Address</label><input type="email" placeholder="name@example.com" value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-medium outline-none" /></div>
                                        <div className="space-y-2"><label className="text-xs font-bold text-slate-400">Phone Number <span className="text-rose-500">*</span></label><input type="tel" placeholder="98XXXXXXXX" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-medium outline-none" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Location Smart Search */}
                            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-8">
                                <h2 className="text-lg font-bold tracking-tight">Delivery Address</h2>
                                <div className="space-y-6">
                                    <div className="space-y-2 relative" ref={dropdownRef}>
                                        <label className="text-xs font-bold text-slate-400">Search Location <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="Start typing your address (e.g. Kathmandu)..."
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setSelectedGeo(null);
                                                    setIsSuggesting(true);
                                                }}
                                                onFocus={() => setIsSuggesting(true)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-5 py-4 text-sm font-medium focus:ring-2 focus:ring-slate-200 focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                        {isSuggesting && suggestions.length > 0 && searchQuery.trim() !== "" && (
                                            <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-1">
                                                {suggestions.map((loc, idx) => (
                                                    <button key={idx} onClick={() => handleSelectSuggestion(loc)} className="w-full text-left px-5 py-4 hover:bg-slate-50 flex items-center gap-4 transition-colors">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"><MapPin className="w-4 h-4 text-slate-400" /></div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 leading-tight">{loc.display_name.split(",").slice(0, 2).join(", ")}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{loc.address?.county || loc.address?.district || ''}, {(loc.address?.state || '').replace(' Province', '')}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2 relative">
                                        <label className="text-xs font-bold text-slate-400">Additional Context (Optional)</label>
                                        <input type="text" placeholder="e.g. Near the bakery, blue gate..." value={landmark} onChange={(e) => setLandmark(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-slate-200 outline-none transition-all" />
                                    </div>
                                    {selectedGeo && (
                                        <div className="pt-2 animate-in fade-in">
                                            {isCalculating ? (
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl animate-pulse"><Truck className="w-4 h-4 animate-bounce text-slate-300" /><span className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">Verifying regional access...</span></div>
                                            ) : shippingError ? (
                                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-500 text-[10px] font-black uppercase tracking-widest">{shippingError}</div>
                                            ) : shippingResult ? (
                                                <div className="p-5 rounded-2xl border bg-slate-900 border-slate-900 text-white shadow-xl flex justify-between items-center">
                                                    <div className="text-left">
                                                        <div className="flex items-center gap-2"><Truck className="w-3 h-3 text-white" /><p className="text-[10px] font-black uppercase tracking-widest">{shippingResult.title}</p></div>
                                                        <p className="text-[9px] mt-1 font-black italic text-white/60">Estimated Arrival: {deliveryEstimation}</p>
                                                    </div>
                                                    <p className="text-sm font-black text-right">Rs {shippingResult.fee}</p>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-6 xl:sticky xl:top-24 w-full">
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-10">
                            <h2 className="text-lg font-bold tracking-tight uppercase">Order Appraisal</h2>
                            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                                <button onClick={() => setIsCartItemsOpen(!isCartItemsOpen)} className="w-full flex items-center justify-between px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Bag Items ({items.length}) {isCartItemsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                                {isCartItemsOpen && (
                                    <div className="p-4 bg-white border-t border-slate-50 space-y-1 max-h-[300px] overflow-y-auto no-scrollbar">
                                        {items.map(item => (
                                            <div key={item.id} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                                <div className="h-14 w-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden"><img src={getMediaUrl(item.selected_image_url)} className="h-full w-full object-cover" /></div>
                                                <div className="flex-1 flex flex-col justify-center"><h3 className="text-[11px] font-bold text-slate-900 leading-tight">{item.product_name}</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Qty {item.quantity} • Rs {item.subtotal}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-5 pt-4">
                                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest"><span>Merchandise Total</span><span className="text-slate-900">Rs {cart?.total_price}</span></div>
                                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest"><span>Estimated Shipment</span><span className="text-slate-900">Rs {shippingResult ? shippingResult.fee : '0.00'}</span></div>
                                <div className="pt-8 border-t border-slate-50 flex justify-between items-center text-slate-900"><span className="text-sm font-black uppercase tracking-widest">Total Appraisal</span><span className="text-2xl font-black tracking-tighter">Rs {totalAmount}</span></div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={handleCreateSession} disabled={isProcessing || !selectedGeo || !shippingResult} className="w-full py-6 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:scale-[1.01] transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-3">
                                    {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Proceed to Review →
                                </button>
                                <Link href="/cart" className="text-center text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-600 transition-colors underline underline-offset-4">Modify Order Bag</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </ResponsiveContainer>
        </div>
    );
}
