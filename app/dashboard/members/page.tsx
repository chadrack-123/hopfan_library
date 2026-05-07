"use client";
import { useEffect, useState, useCallback } from "react";
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/app/dashboard/ToastProvider";
import { format } from "date-fns";

interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  nextOfKin: string | null;
  nextOfKinPhone: string | null;
  memberCode: string;
  active: boolean;
  createdAt: string;
  _count: { loans: number };
}

// ─── Country codes ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { flag: "🇿🇦", name: "South Africa", dial: "+27" },
  { flag: "🇿🇼", name: "Zimbabwe", dial: "+263" },
  { flag: "🇿🇲", name: "Zambia", dial: "+260" },
  { flag: "🇲🇿", name: "Mozambique", dial: "+258" },
  { flag: "🇧🇼", name: "Botswana", dial: "+267" },
  { flag: "🇳🇦", name: "Namibia", dial: "+264" },
  { flag: "🇲🇼", name: "Malawi", dial: "+265" },
  { flag: "🇹🇿", name: "Tanzania", dial: "+255" },
  { flag: "🇰🇪", name: "Kenya", dial: "+254" },
  { flag: "🇺🇬", name: "Uganda", dial: "+256" },
  { flag: "🇬🇧", name: "United Kingdom", dial: "+44" },
  { flag: "🇺🇸", name: "United States", dial: "+1" },
  { flag: "🇨🇦", name: "Canada", dial: "+1" },
  { flag: "🇦🇺", name: "Australia", dial: "+61" },
  { flag: "🇩🇪", name: "Germany", dial: "+49" },
  { flag: "🇳🇱", name: "Netherlands", dial: "+31" },
  { flag: "🇵🇹", name: "Portugal", dial: "+351" },
  { flag: "🇨🇳", name: "China", dial: "+86" },
  { flag: "🇮🇳", name: "India", dial: "+91" },
];

// ─── Parse stored E.164 number into {dialCode, local} ─────────────────────────
function parsePhone(full: string | null | undefined): { dialCode: string; local: string } {
  if (!full) return { dialCode: "+27", local: "" };
  const match = COUNTRIES.find((c) => full.startsWith(c.dial));
  if (match) return { dialCode: match.dial, local: full.slice(match.dial.length).trim() };
  return { dialCode: "+27", local: full };
}

// ─── Phone input with flag + dial-code selector ────────────────────────────────
function PhoneInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (full: string) => void;
  error?: string;
}) {
  const parsed = parsePhone(value);
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [local, setLocal] = useState(parsed.local);

  const current = COUNTRIES.find((c) => c.dial === dialCode) ?? COUNTRIES[0];

  function handleDialChange(d: string) {
    setDialCode(d);
    onChange(d + local);
  }
  function handleLocalChange(l: string) {
    // strip non-digit, spaces, hyphens
    const clean = l.replace(/[^\d\s\-]/g, "");
    setLocal(clean);
    onChange(dialCode + clean);
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className={`flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${error ? "border-red-400" : "border-gray-300"}`}>
        <select
          value={dialCode}
          onChange={(e) => handleDialChange(e.target.value)}
          className="bg-gray-50 border-r border-gray-300 px-2 py-2 text-sm focus:outline-none"
        >
          {COUNTRIES.map((c) => (
            <option key={c.name} value={c.dial}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={local}
          onChange={(e) => handleLocalChange(e.target.value)}
          placeholder="number without country code"
          className="flex-1 px-3 py-2 text-sm focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── Validation helpers ────────────────────────────────────────────────────────
function validateEmail(v: string) {
  if (!v) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address";
}
function validatePhone(full: string) {
  if (!full || full.replace(/\D/g, "").length === 0) return "";
  const digits = full.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? "" : "Phone number must be 7–15 digits";
}

// ─── Member Modal ──────────────────────────────────────────────────────────────
function MemberModal({
  member,
  onClose,
  onSaved,
}: {
  member: Member | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: member?.name ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    address: member?.address ?? "",
    nextOfKin: member?.nextOfKin ?? "",
    nextOfKinPhone: member?.nextOfKinPhone ?? "",
    active: member?.active ?? true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    const nokPhoneErr = validatePhone(form.nextOfKinPhone);
    if (nokPhoneErr) errs.nextOfKinPhone = nokPhoneErr;
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    setError("");

    const method = member ? "PUT" : "POST";
    const url = member ? `/api/members/${member.id}` : "/api/members";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

  const inputCls = (field: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      fieldErrors[field] ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">{member ? "Edit Member" : "Add New Member"}</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls("name")}
            />
            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="text"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => {
                const err = validateEmail(form.email);
                setFieldErrors((fe) => ({ ...fe, email: err }));
              }}
              placeholder="member@example.com"
              className={inputCls("email")}
            />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          {/* Phone */}
          <PhoneInput
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            error={fieldErrors.phone}
          />

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputCls("address")}
            />
          </div>

          {/* Next of Kin */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Next of Kin</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  value={form.nextOfKin}
                  onChange={(e) => setForm({ ...form, nextOfKin: e.target.value })}
                  className={inputCls("nextOfKin")}
                />
              </div>
              <PhoneInput
                label="Contact Number"
                value={form.nextOfKinPhone}
                onChange={(v) => setForm({ ...form, nextOfKinPhone: v })}
                error={fieldErrors.nextOfKinPhone}
              />
            </div>
          </div>

          {/* Active toggle — only on edit */}
          {member && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded"
              />
              Active member
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
              {loading ? "Saving…" : "Save Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberDetailPanel({
  member,
  onClose,
  onEdit,
}: {
  member: Member;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-blue-900">Member Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800"
            >
              <PencilSquareIcon className="w-4 h-4" /> Edit
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100">
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{member.name}</p>
              <p className="text-xs font-mono text-gray-400 mb-1">{member.memberCode}</p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  member.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {member.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{member._count.loans}</p>
            <p className="text-xs text-blue-600 mt-1">Total Loans</p>
          </div>
          <div className="space-y-4 border-t border-gray-100 pt-4">
            {member.email && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Email</p>
                <p className="text-gray-700">{member.email}</p>
              </div>
            )}
            {member.phone && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Phone</p>
                <p className="text-gray-700">{member.phone}</p>
              </div>
            )}
            {member.address && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Address</p>
                <p className="text-gray-700">{member.address}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Joined</p>
              <p className="text-gray-700">{format(new Date(member.createdAt), "dd MMMM yyyy")}</p>
            </div>
          </div>
          {(member.nextOfKin || member.nextOfKinPhone) && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Next of Kin</p>
              <div className="space-y-2">
                {member.nextOfKin && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Full Name</p>
                    <p className="text-gray-700">{member.nextOfKin}</p>
                  </div>
                )}
                {member.nextOfKinPhone && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                    <p className="text-gray-700">{member.nextOfKinPhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; member: Member | null }>({ open: false, member: null });
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/members?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setMembers(data);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(fetchMembers, 300);
    return () => clearTimeout(t);
  }, [fetchMembers]);

  async function deleteMember(id: string) {
    if (!confirm("Delete this member?")) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      toast(d.error ?? "Could not delete member", "error");
      return;
    }
    fetchMembers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Members</h1>
          <p className="text-sm text-gray-500">{members.length} registered member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setModal({ open: true, member: null })}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
        >
          <PlusIcon className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="relative mb-5">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, or member code…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-700 border-t-transparent" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No members found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Member", "Code", "Email", "Phone", "Joined", "Loans", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewMember(m)}>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{m.memberCode}</td>
                  <td className="px-4 py-3 text-gray-600">{m.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(m.createdAt), "dd MMM yyyy")}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{m._count.loans}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {m.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setModal({ open: true, member: m })} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteMember(m.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewMember && (
        <MemberDetailPanel
          member={viewMember}
          onClose={() => setViewMember(null)}
          onEdit={() => { setModal({ open: true, member: viewMember }); setViewMember(null); }}
        />
      )}
      {modal.open && (
        <MemberModal member={modal.member} onClose={() => setModal({ open: false, member: null })} onSaved={fetchMembers} />
      )}
    </div>
  );
}
