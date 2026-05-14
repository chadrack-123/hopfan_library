"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  BookOpenIcon,
  UsersIcon,
  ArrowsRightLeftIcon,
  BellIcon,
  Squares2X2Icon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Squares2X2Icon },
  { href: "/dashboard/books", label: "Books", icon: BookOpenIcon },
  { href: "/dashboard/members", label: "Members", icon: UsersIcon },
  { href: "/dashboard/loans", label: "Loans", icon: ArrowsRightLeftIcon },
  { href: "/dashboard/notifications", label: "Notifications", icon: BellIcon },
  { href: "/dashboard/feedback", label: "Feedback", icon: ChatBubbleLeftRightIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-full w-56 bg-blue-900 text-white flex flex-col z-20">
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
  );
}
