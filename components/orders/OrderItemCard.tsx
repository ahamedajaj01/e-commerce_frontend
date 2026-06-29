import { getMediaUrl } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

interface OrderItemCardProps {
    thumbnail?: string;
    image?: string;
    variant_image?: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
}

export function OrderItemCard({
    thumbnail,
    image,
    variant_image,
    productName,
    variantName,
    sku,
    quantity,
    unitPrice,
    lineTotal
}: OrderItemCardProps) {
    // Check various image keys provided by different endpoints (list vs detail)
    const imgUrl = image || variant_image || thumbnail;

    return (
        <div className="flex gap-4 p-4 rounded-xl hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-100/50">
            <div className="h-16 w-14 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden">
                {imgUrl ? (
                    <img src={getMediaUrl(imgUrl)} alt={productName} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-200">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                        <h3 className="text-[13px] font-semibold text-slate-900 truncate">{productName}</h3>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">{variantName}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                        <p className="text-[11px] font-bold text-slate-900">Rs {unitPrice}</p>
                        <span className="text-[10px] text-slate-300">×</span>
                        <p className="text-[11px] text-slate-500">Qty {quantity}</p>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900">Rs {lineTotal}</p>
                </div>
            </div>
        </div>
    );
}
