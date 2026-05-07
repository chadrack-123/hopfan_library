"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  BookOpenIcon,
  UsersIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

interface DashboardData {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  unpaidFines: number;
  recentLoans: {
    id: string;
    borrowedAt: string;
    dueDate: string;
    status: string;
    book: { title: string };
    member: { name: string };
  }[];
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  RETURNED: "bg-gray-100 text-gray-600",
  OVERDUE: "bg-red-100 text-red-700",
  LOST: "bg-yellow-100 text-yellow-700",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-transparent" />
      </div>
    );
  }

  const stats = [
    { label: "Total Books", value: data.totalBooks, icon: BookOpenIcon, color: "bg-blue-600", href: "/dashboard/books" },
    { label: "Members", value: data.totalMembers, icon: UsersIcon, color: "bg-purple-600", href: "/dashboard/members" },
    { label: "Active Loans", value: data.activeLoans, icon: ArrowsRightLeftIcon, color: "bg-green-600", href: "/dashboard/loans?status=ACTIVE" },
    { label: "Overdue", value: data.overdueLoans, icon: ExclamationTriangleIcon, color: "bg-red-600", href: "/dashboard/loans?status=OVERDUE" },
    { label: "Unpaid Fines", value: `R${Number(data.unpaidFines).toFixed(2)}`, icon: CurrencyDollarIcon, color: "bg-yellow-500", href: "/dashboard/loans" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900">Welcome back</h1>
        <p className="text-gray-500 mt-1">House of Prayer for all Nations — Library Overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition"
          >
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent loans */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Loans</h2>
          <Link href="/dashboard/loans" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {data.recentLoans.length === 0 && (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No loans yet</p>
          )}
          {data.recentLoans.map((loan) => (
            <div key={loan.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm">{loan.book.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Borrowed by <span className="font-medium">{loan.member.name}</span> ·{" "}
                  {format(new Date(loan.borrowedAt), "dd MMM yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">Due {format(new Date(loan.dueDate), "dd MMM yyyy")}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[loan.status]}`}>
                  {loan.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
