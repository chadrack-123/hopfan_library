"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import {
  BookOpenIcon,
  UsersIcon,
  ArrowsRightLeftIcon,
  BellIcon,
  Squares2X2Icon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: Squares2X2Icon },
  { href: "/dashboard/books", label: "Books", icon: BookOpenIcon },
  { href: "/dashboard/members", label: "Members", icon: UsersIcon },
  { href: "/dashboard/loans", label: "Loans", icon: ArrowsRightLeftIcon },
];

const overflowNav = [
  { href: "/dashboard/notifications", label: "Notifications", icon: BellIcon },
  { href: "/dashboard/feedback", label: "Feedback", icon: ChatBubbleLeftRightIcon },
];

const nav = [...primaryNav, ...overflowNav];

export default function Sidebar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const overflowActive = overflowNav.some(
    ({ href }) => pathname === href || pathname.startsWith(href)
  );

  return (
    <>
      {/* ── Desktop sidebar (lg+) ─────────────────────────────────── */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-56 bg-blue-900 text-white flex-col z-20">
        <div className="px-5 py-5 border-b border-blue-800 flex items-center gap-3">
          <div
            className="w-11 h-11 flex items-center justify-center rounded-full overflow-hidden bg-white flex-shrink-0"
            style={{ boxShadow: "0 4px 18px 0 rgba(59,130,246,0.45), 0 1.5px 6px 0 rgba(0,0,0,0.18)" }}
          >
            <Image
              src="/hopfan-logo.PNG"
              alt="HOPFAN Logo"
              width={40}
              height={40}
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-300 leading-none mb-0.5">HOPFAN</p>
            <h2 className="font-bold text-base leading-tight">Library System</h2>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-blue-700 text-white"
                    : "text-blue-200 hover:bg-blue-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-blue-800">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav bar (< lg) ─────────────────────────── */}
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* Slide-up drawer */}
      <div
        className={`lg:hidden fixed left-0 right-0 z-40 bg-blue-900 border-t border-blue-700 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          moreOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ bottom: "4rem" }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-blue-700" />
        </div>
        <div className="px-4 py-3 space-y-1">
          {overflowNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active ? "bg-blue-700 text-white" : "text-blue-200 hover:bg-blue-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
          <div className="border-t border-blue-800 my-1" />
          <button
            onClick={() => { setMoreOpen(false); signOut({ callbackUrl: "/login" }); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
        <div className="h-2" />
      </div>

      {/* Primary bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-blue-900 border-t border-blue-800 flex items-center h-16">
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition ${
                active ? "text-white" : "text-blue-300 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] leading-none font-medium">{label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition relative ${
            moreOpen || overflowActive ? "text-white" : "text-blue-300 hover:text-white"
          }`}
        >
          <div className="relative">
            <EllipsisHorizontalIcon className="w-5 h-5" />
            {overflowActive && !moreOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400" />
            )}
          </div>
          <span className="text-[10px] leading-none font-medium">More</span>
        </button>
      </nav>
    </>
  );
}
