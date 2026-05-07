"use client";
import { useState } from "react";
import { BellIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface OverdueItem {
  id: string;
  member: string;
  book: string;
  dueDate: string;
}

interface StatusResult {
  markedOverdue: number;
  dueSoonCount: number;
  overdue: OverdueItem[];
  dueSoon: OverdueItem[];
}

export default function NotificationsPage() {
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [sentResults, setSentResults] = useState<{ name: string; book: string; result: string }[]>([]);

  async function checkStatus() {
    setLoadingStatus(true);
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setStatus(data);
    setLoadingStatus(false);
  }

  async function sendBulkNotifications(items: OverdueItem[], type: "DUE_REMINDER" | "OVERDUE_ALERT") {
    setSendingAll(true);
    setSentResults([]);
    const results = [];

    for (const item of items) {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId: item.id, type }),
      });
      const data = await res.json();
      const channels: { channel: string; success: boolean }[] = data.results ?? [];
      const summary = channels.length > 0
        ? channels.map((c) => `${c.channel} ${c.success ? "✓" : "✗"}`).join(", ")
        : "No contact info";
      results.push({ name: item.member, book: item.book, result: summary });
    }

    setSentResults(results);
    setSendingAll(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Notifications</h1>
        <p className="text-sm text-gray-500">Check for overdue and due-soon books, then send reminders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status check */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Step 1 — Sync & Check Status</h2>
          <p className="text-sm text-gray-500 mb-4">
            This will mark any past-due loans as OVERDUE and show you who needs to be notified.
          </p>
          <button
            onClick={checkStatus}
            disabled={loadingStatus}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
          >
            <BellIcon className="w-4 h-4" />
            {loadingStatus ? "Checking…" : "Check Loan Status"}
          </button>

          {status && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                <span className="font-medium text-red-700">{status.markedOverdue}</span>
                <span className="text-gray-600">overdue loan{status.markedOverdue !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BellIcon className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-yellow-700">{status.dueSoonCount}</span>
                <span className="text-gray-600">due within 2 days</span>
              </div>
            </div>
          )}
        </div>

        {/* Send notifications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Step 2 — Send Bulk Notifications</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sends email and SMS to all members with overdue books or books due soon.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => status && sendBulkNotifications(status.overdue, "OVERDUE_ALERT")}
              disabled={!status || sendingAll || status.overdue.length === 0}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
              {sendingAll ? "Sending…" : `Send Overdue Alerts (${status?.overdue.length ?? 0})`}
            </button>
            <button
              onClick={() => status && sendBulkNotifications(status.dueSoon, "DUE_REMINDER")}
              disabled={!status || sendingAll || status.dueSoon.length === 0}
              className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
            >
              <BellIcon className="w-4 h-4" />
              {sendingAll ? "Sending…" : `Send Due Reminders (${status?.dueSoon.length ?? 0})`}
            </button>
          </div>
        </div>
      </div>

      {/* Overdue list */}
      {status && status.overdue.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-red-50 border-b border-red-100">
            <h3 className="font-semibold text-red-800 text-sm">Overdue Books</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Member", "Book", "Was Due"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {status.overdue.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.member}</td>
                  <td className="px-4 py-3 text-gray-600">{item.book}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">
                    {new Date(item.dueDate).toLocaleDateString("en-ZA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Due soon list */}
      {status && status.dueSoon.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-yellow-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100">
            <h3 className="font-semibold text-yellow-800 text-sm">Due Within 2 Days</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Member", "Book", "Due Date"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {status.dueSoon.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.member}</td>
                  <td className="px-4 py-3 text-gray-600">{item.book}</td>
                  <td className="px-4 py-3 text-yellow-700 font-medium">
                    {new Date(item.dueDate).toLocaleDateString("en-ZA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Send results */}
      {sentResults.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-green-700" />
            <h3 className="font-semibold text-green-800 text-sm">Notification Results</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Member", "Book", "Result"].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sentResults.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.book}</td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{r.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
