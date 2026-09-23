"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProduct, updateProduct, deleteProduct } from "@/lib/api/products";
import { setOverride, getOverrides } from "@/lib/LocalOverrides";
import { Product } from "@/lib/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState<Partial<Product>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const overrides = getOverrides();
        if (overrides[Number(id)] === "deleted") {
          setNotFound(true);
          return;
        }
        const data = await getProduct(id);
        const merged = overrides[Number(id)] && overrides[Number(id)] !== "deleted"
          ? (overrides[Number(id)] as Product)
          : data;
        setProduct(merged);
        setForm(merged);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.title || form.title.trim() === "") errors.title = "Title is required.";
    if (!form.price || form.price <= 0) errors.price = "Price must be greater than 0.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (saving) return; // prevent double-submit
    if (!validate()) return;

    setSaving(true);
    try {
      const updated = await updateProduct(id, form);
      // API doesn't really persist — merge our local edits over whatever it returns
      const merged = { ...updated, ...form } as Product;
      setOverride(Number(id), merged);
      setProduct(merged);
      setMode("view");
    } catch {
      setFormErrors({ general: "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (deleting || confirmDeleteId === null) return;
    setDeleting(true);
    try {
      await deleteProduct(String(confirmDeleteId));
      setOverride(confirmDeleteId, "deleted");
      router.push("/products");
    } catch {
      setDeleting(false);
      setConfirmDeleteId(null);
      alert("Failed to delete. Please try again.");
    }
  }

  if (loading) return <p>Loading...</p>;
  if (notFound || !product) return <p>Product not found.</p>;

  return (
    <div className="max-w-2xl">
      {mode === "view" ? (
        <>
          <img src={product.images?.[0]} alt={product.title} className="w-64 mb-4 rounded" />
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-gray-600 mt-1">{product.description}</p>
          <p className="text-xl mt-2">${product.price}</p>
          <p className="text-sm text-gray-500">
            {product.category} · ★{product.rating} · Stock: {product.stock}
          </p>

          <div className="flex gap-2 mt-4">
            <button onClick={() => setMode("edit")} className="px-4 py-2 border rounded">
              Edit
            </button>
            <button
              onClick={() => setConfirmDeleteId(product.id)}
              className="px-4 py-2 border border-red-500 text-red-600 rounded"
            >
              Delete
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Edit product</h1>
          {formErrors.general && <p className="text-red-600 text-sm">{formErrors.general}</p>}

          <div>
            <input
              value={form.title ?? ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="w-full border rounded px-3 py-2"
            />
            {formErrors.title && <p className="text-red-600 text-sm">{formErrors.title}</p>}
          </div>

          <div>
            <input
              type="number"
              value={form.price ?? ""}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              placeholder="Price"
              className="w-full border rounded px-3 py-2"
            />
            {formErrors.price && <p className="text-red-600 text-sm">{formErrors.price}</p>}
          </div>

          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="w-full border rounded px-3 py-2"
          />

          <div>
            <input
                value={form.thumbnail ?? ""}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="Image URL"
                className="w-full border rounded px-3 py-2"
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
              className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => { setMode("view"); setForm(product); setFormErrors({}); }} className="px-4 py-2 border rounded">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ↓↓↓ THIS is the delete confirmation modal ↓↓↓ */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <p className="mb-4">Are you sure you want to delete this product?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}