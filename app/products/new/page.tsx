"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/api/products";
import { setOverride } from "@/lib/LocalOverrides";
import { Product } from "@/lib/types";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Product>>({
    title: "",
    price: 0,
    description: "",
    category: "",
    thumbnail: "",
    stock: 0,
    rating: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title || form.title.trim() === "") e.title = "Title is required.";
    if (!form.price || form.price <= 0) e.price = "Price must be greater than 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (saving) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const created = await createProduct(form);
      // DummyJSON always returns id 101/191 for /products/add — it's not a real persistent id.
      // Use a locally-unique fake id instead so this doesn't collide with real product ids.
      const fakeId = Date.now();
      const finalProduct: Product = {
  ...created,
  id: fakeId,
  title: form.title ?? "",
  description: form.description ?? "",
  category: form.category ?? "",
  price: form.price ?? 0,
  rating: form.rating ?? 0,
  stock: form.stock ?? 0,
  images: form.thumbnail ? [form.thumbnail] : [],
  thumbnail: form.thumbnail ?? "https://placehold.co/200x200?text=No+Image",
};
      setOverride(fakeId, finalProduct);
      router.push("/products");
    } catch {
      setErrors({ general: "Failed to create product. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Add product</h1>
      {errors.general && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errors.general}</p>
      )}

      <div>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
      </div>

      <div>
        <input
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          placeholder="Price"
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
      </div>

      <input
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        placeholder="Category"
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      />

      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Description"
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
      />

      {/* Image field — see Part 2 note below on why this is a URL input, not a file picker */}
      <div>
        <input
          value={form.thumbnail}
          onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
          placeholder="Image URL"
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        {form.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.thumbnail} alt="preview" className="mt-2 h-24 w-24 rounded-lg object-cover border" />
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => router.push("/products")}
          className="rounded-lg border border-slate-200 px-4 py-2.5 transition-colors hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}