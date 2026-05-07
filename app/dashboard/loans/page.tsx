"use client";
import { Suspense } from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  PlusIcon,
  ArrowUturnLeftIcon,
  ArrowPathIcon,
  BellIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/app/dashboard/ToastProvider";

interface Book { id: string; title: string; author: string; available: number }
interface Member { id: string; name: string; memberCode: string; active: boolean }
interface Loan {
  id: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST";
  renewalCount: number;
  fine: number;
  finePaid: boolean;
  book: { id: string; title: string; author: string };
  member: { id: string; name: string; email: string | null; phone: string | null; memberCode: string };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  RETURNED: "bg-gray-100 text-gray-600",
  OVERDUE: "bg-red-100 text-red-700",
  LOST: "bg-yellow-100 text-yellow-700",
};

function LoanDetailPanel({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-blue-900">Loan Details</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[loan.status]}`}>
              {loan.status}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Book</p>
            <p className="font-semibold text-gray-800">{loan.book.title}</p>
            <p className="text-sm text-gray-500">{loan.book.author}</p>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Member</p>
            <p className="font-semibold text-gray-800">{loan.member.name}</p>
            <p className="text-xs font-mono text-gray-400">{loan.member.memberCode}</p>
            {loan.member.email && <p className="text-sm text-gray-600 mt-1">{loan.member.email}</p>}
            {loan.member.phone && <p className="text-sm text-gray-600">{loan.member.phone}</p>}
          </div>
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Borrowed</p>
              <p className="text-gray-700">{format(new Date(loan.borrowedAt), "dd MMM yyyy")}</p>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wide font-semibold mb-1 ${
                loan.status === "OVERDUE" ? "text-red-400" : "text-gray-400"
              }`}>
                Due Date
              </p>
              <p className={loan.status === "OVERDUE" ? "text-red-600 font-semibold" : "text-gray-700"}>
                {format(new Date(loan.dueDate), "dd MMM yyyy")}
              </p>
            </div>
            {loan.returnedAt && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Returned</p>
                <p className="text-gray-700">{format(new Date(loan.returnedAt), "dd MMM yyyy")}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Renewals</p>
              <p className="text-gray-700">{loan.renewalCount} / 2</p>
            </div>
          </div>
          {loan.fine > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Fine</p>
              <div className={`rounded-lg p-4 ${loan.finePaid ? "bg-green-50" : "bg-red-50"}`}>
                <p className={`text-2xl font-bold ${loan.finePaid ? "text-green-600" : "text-red-600"}`}>
                  R{loan.fine.toFixed(2)}
                </p>
                <p className={`text-xs mt-1 ${loan.finePaid ? "text-green-600" : "text-red-500"}`}>
                  {loan.finePaid ? "Paid" : "Unpaid"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Searchable combobox ──────────────────────────────────────────────────────
function SearchSelect({
  label,
  placeholder,
  value,
  options,
  renderLabel,
  renderSub,
  onSelect,
  required,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: { id: string }[];
  renderLabel: (o: { id: string }) => string;
  renderSub?: (o: { id: string }) => string;
  onSelect: (id: string) => void;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = query.trim()
    ? options.filter((o) =>
        renderLabel(o).toLowerCase().includes(query.toLowerCase()) ||
        (renderSub?.(o) ?? "").toLowerCase().includes(query.toLowerCase())
      )
    : options;

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && " *"}</label>
      {/* hidden native input to satisfy HTML5 required validation */}
      <input type="text" required={required} value={value} onChange={() => {}} className="sr-only" />
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(""); }}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected ? renderLabel(selected) : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">No results</li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.id}
                  onMouseDown={() => { onSelect(o.id); setOpen(false); setQuery(""); }}
                  className={`px-3 py-2 cursor-pointer text-sm hover:bg-blue-50 ${o.id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800"}`}
                >
                  {renderLabel(o)}
                  {renderSub && <span className="ml-1 text-xs text-gray-400">{renderSub(o)}</span>}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function NewLoanModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ bookId: "", memberId: "", dueDays: "14", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/books").then((r) => r.json()), fetch("/api/members").then((r) => r.json())]).then(
      ([b, m]) => {
        setBooks(b.filter((x: Book) => x.available > 0));
        setMembers(m.filter((x: Member) => x.active));
      }
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dueDays: Number(form.dueDays) }),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Something went wrong");
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Lend a Book</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <SearchSelect
            label="Book"
            placeholder="Select a book…"
            value={form.bookId}
            options={books}
            renderLabel={(o) => { const b = o as Book; return `${b.title} — ${b.author}`; }}
            renderSub={(o) => { const b = o as Book; return `${b.available} available`; }}
            onSelect={(id) => setForm({ ...form, bookId: id })}
            required
          />
          <SearchSelect
            label="Member"
            placeholder="Select a member…"
            value={form.memberId}
            options={members}
            renderLabel={(o) => (o as Member).name}
            renderSub={(o) => (o as Member).memberCode}
            onSelect={(id) => setForm({ ...form, memberId: id })}
            required
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Loan Period (days)</label>
            <input
              type="number"
              min="1"
              max="90"
              value={form.dueDays}
              onChange={(e) => setForm({ ...form, dueDays: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
              {loading ? "Processing…" : "Lend Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoansInner() {
  const searchParams = useSearchParams();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [loading, setLoading] = useState(true);
  const [newLoanModal, setNewLoanModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const [viewLoan, setViewLoan] = useState<Loan | null>(null);
  const { toast } = useToast();

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    const url = statusFilter ? `/api/loans?status=${statusFilter}` : "/api/loans";
    const res = await fetch(url);
    const data = await res.json();
    setLoans(data);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  async function loanAction(id: string, action: string) {
    setActionLoading(id + action);
    const res = await fetch(`/api/loans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActionLoading(null);
    if (!res.ok) {
      const d = await res.json();
      toast(d.error ?? "Action failed", "error");
      return;
    }
    fetchLoans();
  }

  async function sendNotification(loanId: string, type: "DUE_REMINDER" | "OVERDUE_ALERT") {
    setActionLoading(loanId + type);
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId, type }),
    });
    setActionLoading(null);
    const d = await res.json();
    const results: { channel: string; success: boolean; error?: string }[] = d.results ?? [];
    if (results.length === 0) {
      toast("No contact info (email/phone) found for this member.", "warning");
    } else {
      results.forEach((r) => {
        if (r.success) toast(`${r.channel}: notification sent`, "success");
        else toast(`${r.channel}: ${r.error ?? "failed to send"}`, "error");
      });
    }
  }

  async function requestFeedback(loanId: string) {
    setActionLoading(loanId + "feedback");
    const res = await fetch("/api/feedback/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId }),
    });
    setActionLoading(null);
    const d = await res.json();
    if (!res.ok) { toast(d.error ?? "Something went wrong", "error"); return; }
    setFeedbackSent((prev) => new Set(prev).add(loanId));
    const channels: { channel: string; success: boolean; error?: string }[] = d.results ?? [];
    if (d.noContactInfo) {
      toast("Member has no email or phone saved — add contact info first.", "warning");
    } else {
      channels.forEach((r) => {
        if (r.success) toast(`Feedback request sent via ${r.channel.toLowerCase()}`, "success");
        else toast(`${r.channel}: ${r.error ?? "failed to send"}`, "error");
      });
    }
  }

  const filters = ["", "ACTIVE", "OVERDUE", "RETURNED", "LOST"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Loans</h1>
          <p className="text-sm text-gray-500">{loans.length} loan{loans.length !== 1 ? "s" : ""} found</p>
        </div>
        <button
          onClick={() => setNewLoanModal(true)}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
        >
          <PlusIcon className="w-4 h-4" /> New Loan
        </button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              statusFilter === f
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-700 border-t-transparent" />
          </div>
        ) : loans.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No loans found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Book", "Member", "Borrowed", "Due Date", "Status", "Fine", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewLoan(loan)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 max-w-[180px] truncate">{loan.book.title}</p>
                    <p className="text-xs text-gray-500">{loan.book.author}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">{loan.member.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{loan.member.memberCode}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(loan.borrowedAt), "dd MMM yyyy")}</td>
                  <td className={`px-4 py-3 whitespace-nowrap font-medium ${loan.status === "OVERDUE" ? "text-red-600" : "text-gray-700"}`}>
                    {format(new Date(loan.dueDate), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[loan.status]}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {loan.fine > 0 ? (
                      <span className={loan.finePaid ? "text-green-600 text-xs" : "text-red-600 text-xs font-semibold"}>
                        R{loan.fine.toFixed(2)} {loan.finePaid ? "(paid)" : "(unpaid)"}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {loan.status === "ACTIVE" && (
                        <>
                          <button
                            onClick={() => loanAction(loan.id, "return")}
                            disabled={!!actionLoading}
                            title="Return book"
                            className="p-1.5 rounded hover:bg-green-50 text-green-700 disabled:opacity-40"
                          >
                            <ArrowUturnLeftIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => loanAction(loan.id, "renew")}
                            disabled={!!actionLoading || loan.renewalCount >= 2}
                            title={`Renew (${2 - loan.renewalCount} left)`}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600 disabled:opacity-40"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => sendNotification(loan.id, "DUE_REMINDER")}
                            disabled={!!actionLoading}
                            title="Send due reminder"
                            className="p-1.5 rounded hover:bg-purple-50 text-purple-600 disabled:opacity-40"
                          >
                            <BellIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {loan.status === "OVERDUE" && (
                        <>
                          <button
                            onClick={() => loanAction(loan.id, "return")}
                            disabled={!!actionLoading}
                            title="Mark as returned"
                            className="p-1.5 rounded hover:bg-green-50 text-green-700 disabled:opacity-40"
                          >
                            <ArrowUturnLeftIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => sendNotification(loan.id, "OVERDUE_ALERT")}
                            disabled={!!actionLoading}
                            title="Send overdue alert"
                            className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-40"
                          >
                            <BellIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {loan.status === "RETURNED" && loan.fine > 0 && !loan.finePaid && (
                        <button
                          onClick={() => loanAction(loan.id, "pay_fine")}
                          disabled={!!actionLoading}
                          title="Mark fine as paid"
                          className="p-1.5 rounded hover:bg-yellow-50 text-yellow-700 disabled:opacity-40"
                        >
                          <CurrencyDollarIcon className="w-4 h-4" />
                        </button>
                      )}
                      {loan.status === "RETURNED" && (
                        <button
                          onClick={() => requestFeedback(loan.id)}
                          disabled={!!actionLoading || feedbackSent.has(loan.id)}
                          title={feedbackSent.has(loan.id) ? "Feedback request sent" : "Request book feedback"}
                          className={`p-1.5 rounded disabled:opacity-40 ${
                            feedbackSent.has(loan.id)
                              ? "text-purple-300 cursor-default"
                              : "hover:bg-purple-50 text-purple-600"
                          }`}
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewLoan && <LoanDetailPanel loan={viewLoan} onClose={() => setViewLoan(null)} />}
      {newLoanModal && <NewLoanModal onClose={() => setNewLoanModal(false)} onSaved={fetchLoans} />}
    </div>
  );
}

export default function LoansPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-700 border-t-transparent" /></div>}>
      <LoansInner />
    </Suspense>
  );
}
