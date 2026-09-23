import { Product } from "./types";

const KEY = "productOverrides";

type Overrides = Record<number, Product | "deleted">;

export function getOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
}

export function setOverride(id: number, value: Product | "deleted") {
  const overrides = getOverrides();
  overrides[id] = value;
  localStorage.setItem(KEY, JSON.stringify(overrides));
}

export function applyOverrides(products: Product[]): Product[] {
  const overrides = getOverrides();
  return products
    .map((p) => (overrides[p.id] && overrides[p.id] !== "deleted" ? (overrides[p.id] as Product) : p))
    .filter((p) => overrides[p.id] !== "deleted");
}