"use client";

import { useContext } from "react";
import { CartContext } from "@/providers/CartProvider";

export function useCart() {
  return useContext(CartContext);
}
