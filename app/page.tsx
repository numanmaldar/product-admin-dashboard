"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProducts, searchProducts, getProductsByCategory, getCategories } from "@/lib/api/products";
import { useDebounce } from "@/hooks/DeBounce";
import { applyOverrides } from "@/lib/LocalOverrides";
import { Product, Category } from "@/lib/types";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limitParam = parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = [10, 20, 50].includes(limitParam) ? limitParam : 20;
  const category = searchParams.get("category") ?? "";

  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(searchInput, 400);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load category list once, for the filter dropdown
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // When the debounced search value settles, push it into the URL and reset to page 1
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
      params.delete("category");
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Fetch products — race-condition safe, applies local overrides
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const skip = (page - 1) * limit;
        const data = debouncedSearch
          ? await searchProducts(debouncedSearch, limit, skip)
          : category
          ? await getProductsByCategory(category, limit, skip)
          : await getProducts(limit, skip);

        if (!cancelled) {
          setProducts(applyOverrides(data.products));
          setTotal(data.total);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, category, page, limit]);

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/products?${params.toString()}`);
  }

  function changeLimit(newLimit: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  }

  function changeCategory(newCategory: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newCategory) {
      params.set("category", newCategory);
      params.delete("q");
      setSearchInput("");
    } else {
      params.delete("category");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const clampedPage = Math.min(page, totalPages);
  const showingFrom = total === 0 ? 0 : (clampedPage - 1) * limit + 1;
  const showingTo = Math.min(clampedPage * limit, total);

  return (
    <div>
      {/* Search + filter controls */}
      <div className="flex gap-3 mb-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products..."
          className="border rounded px-3 py-2 flex-1"
        />
        <select
          value={category}
          onChange={(e) => changeCategory(e.target.value)}
          disabled={!!debouncedSearch}
          className="border rounded px-2 py-2 disabled:opacity-50"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && (
        <p>
          Something went wrong. <button onClick={() => goToPage(page)}>Retry</button>
        </p>
      )}
      {!loading && !error && products.length === 0 && <p>No products found.</p>}

      {!loading && !error && products.length > 0 && (
        <>
          {/* Desktop table */}
          <table className="hidden md:table w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">Image</th>
                <th className="p-2">Title</th>
                <th className="p-2">Category</th>
                <th className="p-2">Price</th>
                <th className="p-2">Rating</th>
                <th className="p-2">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/products/${p.id}`)}
                >
                  <td className="p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumbnail} alt={p.title} className="w-12 h-12 object-cover" />
                  </td>
                  <td className="p-2">{p.title}</td>
                  <td className="p-2">{p.category}</td>
                  <td className="p-2">${p.price}</td>
                  <td className="p-2">{p.rating}</td>
                  <td className="p-2">{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="border rounded p-3 flex gap-3"
                onClick={() => router.push(`/products/${p.id}`)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbnail} alt={p.title} className="w-16 h-16 object-cover rounded" />
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-gray-600">{p.category}</p>
                  <p className="text-sm">
                    ${p.price} · ★{p.rating} · Stock: {p.stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="flex items-center justify-between text-sm mt-4">
          <span>
            Showing {showingFrom}–{showingTo} of {total}
          </span>
          <select
            value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), page + 2)
              .map((n) => (
                <button
                  key={n}
                  onClick={() => goToPage(n)}
                  className={n === page ? "font-bold underline" : ""}
                >
                  {n}
                </button>
              ))}
            <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}