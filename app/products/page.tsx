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

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products..."
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-shadow focus:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        <select
          value={category}
          onChange={(e) => changeCategory(e.target.value)}
          disabled={!!debouncedSearch}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          Something went wrong.{" "}
          <button
            onClick={() => goToPage(page)}
            className="font-medium underline underline-offset-2 hover:text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500">No products found.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="px-4 py-3 font-medium">Image</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/products/${p.id}`)}
                    className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.thumbnail} alt={p.title} className="h-10 w-10 rounded-md object-cover" />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.title}</td>
                    <td className="px-4 py-3 text-slate-500">{p.category}</td>
                    <td className="px-4 py-3">${p.price}</td>
                    <td className="px-4 py-3">★ {p.rating}</td>
                    <td className="px-4 py-3">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/products/${p.id}`)}
                className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbnail} alt={p.title} className="h-16 w-16 rounded-lg object-cover" />
                <div>
                  <p className="font-medium text-slate-900">{p.title}</p>
                  <p className="text-sm text-slate-500">{p.category}</p>
                  <p className="text-sm text-slate-600">
                    ${p.price} · ★{p.rating} · Stock: {p.stock}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm text-slate-600 sm:flex-row">
            <span>
              Showing {showingFrom}–{showingTo} of {total}
            </span>

            <select
              value={limit}
              onChange={(e) => changeLimit(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="rounded-md px-3 py-1.5 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), page + 2)
                .map((n) => (
                  <button
                    key={n}
                    onClick={() => goToPage(n)}
                    className={`h-8 w-8 rounded-md transition-colors ${
                      n === page ? "bg-slate-900 text-white shadow-sm" : "hover:bg-slate-100"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              <button
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="rounded-md px-3 py-1.5 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}