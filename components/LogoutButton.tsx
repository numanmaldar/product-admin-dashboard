"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
  onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
  className="rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
>
  Log out
</button>
  );
}