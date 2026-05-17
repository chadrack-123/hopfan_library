"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, ChevronUpIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/app/dashboard/ToastProvider";

interface FeedbackEntry {
  id: string;
  loanId: string;
  memberName: string;
  bookTitle: string;
  rating: number | null;
  review: string | null;
  learnings: string | null;
  wouldRecommend: boolean | null;
  submittedAt: string | null;
  createdAt: string;
  loan: {
    borrowedAt: string;
    returnedAt: string | null;
    book: { title: string; author: string; category: string | null };
    member: { name: string; memberCode: string; email: string | null };
  };
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-400 text-xs">No rating</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating
          ? <StarIcon key={s} className="w-4 h-4 text-yellow-400" />
          : <StarOutlineIcon key={s} className="w-4 h-4 text-gray-300" />
      )}
    </div>
  );
}

function FeedbackCard({ fb, onResend }: { fb: FeedbackEntry; onResend: (loanId: string) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleResend(e: React.MouseEvent) {
    e.stopPropagation();
    setResending(true);
    await onResend(fb.loanId);
    setResending(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-800 leading-snug truncate">{fb.loan.book.title}</p>
            <p className="text-xs text-gray-400">{fb.loan.book.author}</p>
            <p className="text-sm text-gray-700 mt-1">{fb.loan.member.name}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {fb.submittedAt ? (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Submitted</span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pending</span>
            )}
            {expanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <StarDisplay rating={fb.rating} />
          {fb.wouldRecommend === true && <span className="text-xs text-green-600">👍 Recommends</span>}
          {fb.wouldRecommend === false && <span className="text-xs text-red-500">👎 Doesn&apos;t recommend</span>}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-purple-50 bg-purple-50 space-y-3 pt-3">
          {fb.review ? (
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">What they thought</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-purple-100">{fb.review}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No review provided</p>
          )}
          {fb.learnings && (
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">What they learned</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-purple-100">{fb.learnings}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span>Borrowed: {format(new Date(fb.loan.borrowedAt), "dd MMM yyyy")}</span>
            {fb.loan.returnedAt && <span>Returned: {format(new Date(fb.loan.returnedAt), "dd MMM yyyy")}</span>}
          </div>
          <button
            onClick={handleResend}
            disabled={resending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium disabled:opacity-40"
          >
            {resending
              ? <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin block" />
              : <PaperAirplaneIcon className="w-4 h-4" />}
            {fb.submittedAt ? "Re-send request" : "Send request"}
          </button>
        </div>
      )}
    </div>
  );
}

function FeedbackRow({ fb, onResend }: { fb: FeedbackEntry; onResend: (loanId: string) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleResend(e: React.MouseEvent) {
    e.stopPropagation();
    setResending(true);
    await onResend(fb.loanId);
    setResending(false);
  }

  return (
    <>
      <tr
        className="hover:bg-purple-50 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3">
          <p className="font-medium text-gray-800 max-w-[200px] truncate">{fb.loan.book.title}</p>
          <p className="text-xs text-gray-400">{fb.loan.book.author}</p>
        </td>
        <td className="px-4 py-3">
          <p className="font-medium text-gray-700">{fb.loan.member.name}</p>
          <p className="text-xs text-gray-400 font-mono">{fb.loan.member.memberCode}</p>
        </td>
        <td className="px-4 py-3">
          <StarDisplay rating={fb.rating} />
        </td>
        <td className="px-4 py-3">
          {fb.submittedAt ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Submitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              Pending
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
          {fb.submittedAt
            ? format(new Date(fb.submittedAt), "dd MMM yyyy")
            : <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3">
          {fb.wouldRecommend === true && <span className="text-green-600 text-sm">👍 Yes</span>}
          {fb.wouldRecommend === false && <span className="text-red-500 text-sm">👎 No</span>}
          {fb.wouldRecommend === null && <span className="text-gray-300 text-xs">—</span>}
        </td>
        <td className="px-4 py-3 text-gray-400" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={resending}
              title={fb.submittedAt ? "Re-send feedback request" : "Send feedback request"}
              className="p-1.5 rounded hover:bg-purple-100 text-purple-600 disabled:opacity-40 transition"
            >
              {resending
                ? <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin block" />
                : <PaperAirplaneIcon className="w-4 h-4" />}
            </button>
            {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-purple-50">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fb.review ? (
                <div>
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">What they thought</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-purple-100">{fb.review}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">What they thought</p>
                  <p className="text-sm text-gray-400 italic">No review provided</p>
                </div>
              )}
              {fb.learnings ? (
                <div>
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">What they learned</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg p-3 border border-purple-100">{fb.learnings}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">What they learned</p>
                  <p className="text-sm text-gray-400 italic">No learnings provided</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
              <span>Borrowed: {format(new Date(fb.loan.borrowedAt), "dd MMM yyyy")}</span>
              {fb.loan.returnedAt && <span>Returned: {format(new Date(fb.loan.returnedAt), "dd MMM yyyy")}</span>}
              {fb.loan.member.email && <span>Email: {fb.loan.member.email}</span>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "submitted" | "pending">("all");
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((d) => { setFeedback(d); setLoading(false); });
  }, []);

  async function resendFeedback(loanId: string) {
    const res = await fetch("/api/feedback/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId }),
    });
    const d = await res.json();
    if (!res.ok) { toast(d.error ?? "Something went wrong", "error"); return; }
    const channels: { channel: string; success: boolean; error?: string }[] = d.results ?? [];
    if (d.noContactInfo) {
      toast("Member has no email or phone saved — edit the member to add contact info.", "warning");
    } else {
      channels.forEach((r) => {
        if (r.success) toast(`Feedback request sent via ${r.channel.toLowerCase()}`, "success");
        else toast(`${r.channel}: ${r.error ?? "failed to send"}`, "error");
      });
    }
  }

  const filtered = feedback.filter((f) => {
    if (filter === "submitted") return !!f.submittedAt;
    if (filter === "pending") return !f.submittedAt;
    return true;
  });

  const submittedCount = feedback.filter((f) => !!f.submittedAt).length;
  const avgRating = feedback
    .filter((f) => f.rating !== null)
    .reduce((acc, f, _, arr) => acc + (f.rating ?? 0) / arr.length, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Book Feedback</h1>
        <p className="text-sm text-gray-500">Member responses on borrowed books</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Requests</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{feedback.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Submitted</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{submittedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{feedback.length - submittedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Rating</p>
          <div className="flex items-center gap-1 mt-1">
            <p className="text-2xl font-bold text-yellow-500">{submittedCount > 0 && avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
            {avgRating > 0 && <StarIcon className="w-5 h-5 text-yellow-400" />}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "submitted", "pending"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              filter === f
                ? "bg-purple-700 text-white border-purple-700"
                : "bg-white text-gray-600 border-gray-300 hover:border-purple-400"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Mobile card list (< md) ──────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm text-center">
              {feedback.length === 0
                ? "No feedback requests yet. Use the Loans page to request feedback from members."
                : "No feedback entries match this filter."}
            </p>
          </div>
        ) : filtered.map((fb) => (
          <FeedbackCard key={fb.id} fb={fb} onResend={resendFeedback} />
        ))}
      </div>

      {/* ── Desktop table (md+) ──────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              {feedback.length === 0
                ? "No feedback requests yet. Use the Loans page to request feedback from members."
                : "No feedback entries match this filter."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Book", "Member", "Rating", "Status", "Submitted", "Recommend", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((fb) => <FeedbackRow key={fb.id} fb={fb} onResend={resendFeedback} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
