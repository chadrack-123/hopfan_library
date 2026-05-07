"use client";
import { useEffect, useState, useCallback } from "react";
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/app/dashboard/ToastProvider";

const BOOK_CATEGORIES = [
  "Bible",
  "Theology",
  "Doctrine",
  "Apologetics",
  "Church History",
  "Devotional",
  "Prayer",
  "Discipleship",
  "Evangelism",
  "Marriage & Family",
  "Youth",
  "Leadership",
  "Preaching & Homiletics",
  "Pastoral Ministry",
  "Missions",
  "Worship",
  "Biography / Autobiography",
  "Fiction",
  "Children",
  "Reference",
  "General",
];

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  totalCopies: number;
  available: number;
  description: string | null;
}

function BookModal({
  book,
  onClose,
  onSaved,
}: {
  book: Book | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: book?.title ?? "",
    author: book?.author ?? "",
    isbn: book?.isbn ?? "",
    category: book?.category ?? "",
    description: book?.description ?? "",
    totalCopies: String(book?.totalCopies ?? 1),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const method = book ? "PUT" : "POST";
    const url = book ? `/api/books/${book.id}` : "/api/books";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, totalCopies: Number(form.totalCopies) }),
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold mb-4">{book ? "Edit Book" : "Add New Book"}</h2>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {(["title", "author", "isbn"] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{field}</label>
              <input
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field === "title" || field === "author"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Select a category —</option>
              {BOOK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Number of Copies</label>
            <input
              type="number"
              min="1"
              value={form.totalCopies}
              onChange={(e) => setForm({ ...form, totalCopies: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-800 disabled:opacity-60">
              {loading ? "Saving…" : "Save Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookDetailPanel({
  book,
  onClose,
  onEdit,
}: {
  book: Book;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-blue-900">Book Details</h2>
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
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Title</p>
            <p className="text-base font-semibold text-gray-800">{book.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Author</p>
            <p className="text-gray-700">{book.author}</p>
          </div>
          {book.isbn && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">ISBN</p>
              <p className="text-gray-700 font-mono text-sm">{book.isbn}</p>
            </div>
          )}
          {book.category && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Category</p>
              <p className="text-gray-700">{book.category}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{book.totalCopies}</p>
              <p className="text-xs text-blue-600 mt-1">Total Copies</p>
            </div>
            <div className={`rounded-lg p-4 text-center ${book.available === 0 ? "bg-red-50" : "bg-green-50"}`}>
              <p className={`text-2xl font-bold ${book.available === 0 ? "text-red-600" : "text-green-600"}`}>
                {book.available}
              </p>
              <p className={`text-xs mt-1 ${book.available === 0 ? "text-red-500" : "text-green-600"}`}>Available</p>
            </div>
          </div>
          {book.description && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">{book.description}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; book: Book | null }>({ open: false, book: null });
  const [viewBook, setViewBook] = useState<Book | null>(null);
  const { toast } = useToast();

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/books?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setBooks(data);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(fetchBooks, 300);
    return () => clearTimeout(t);
  }, [fetchBooks]);

  async function deleteBook(id: string) {
    if (!confirm("Delete this book?")) return;
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      toast(d.error ?? "Could not delete book", "error");
      return;
    }
    fetchBooks();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Books</h1>
          <p className="text-sm text-gray-500">{books.length} book{books.length !== 1 ? "s" : ""} in catalogue</p>
        </div>
        <button
          onClick={() => setModal({ open: true, book: null })}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
        >
          <PlusIcon className="w-4 h-4" /> Add Book
        </button>
      </div>

      <div className="relative mb-5">
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or ISBN…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-700 border-t-transparent" />
          </div>
        ) : books.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No books found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Title", "Author", "ISBN", "Category", "Copies", "Available", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewBook(book)}>
                  <td className="px-4 py-3 font-medium text-gray-800">{book.title}</td>
                  <td className="px-4 py-3 text-gray-600">{book.author}</td>
                  <td className="px-4 py-3 text-gray-500">{book.isbn ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{book.category ?? "—"}</td>
                  <td className="px-4 py-3 text-center">{book.totalCopies}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${book.available === 0 ? "text-red-600" : "text-green-600"}`}>
                      {book.available}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setModal({ open: true, book })} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteBook(book.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
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

      {viewBook && (
        <BookDetailPanel
          book={viewBook}
          onClose={() => setViewBook(null)}
          onEdit={() => { setModal({ open: true, book: viewBook }); setViewBook(null); }}
        />
      )}
      {modal.open && (
        <BookModal book={modal.book} onClose={() => setModal({ open: false, book: null })} onSaved={fetchBooks} />
      )}
    </div>
  );
}
