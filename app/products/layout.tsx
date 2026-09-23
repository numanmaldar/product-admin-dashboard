import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { LogoutButton } from "@/components/LogoutButton";
import { Footer } from "@/components/Footer";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-sm shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Product Admin</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/products/new"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              + Add product
            </Link>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-6">{children}</main>
        <Footer />
      </div>
    </AuthGuard>
  );
}