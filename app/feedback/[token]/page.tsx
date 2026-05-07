"use client";
import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

interface FeedbackData {
  memberName: string;
  bookTitle: string;
  alreadySubmitted: boolean;
  rating?: number;
  review?: string;
  learnings?: string;
  wouldRecommend?: boolean;
}

export default function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("");
  const [data, setData] = useState<FeedbackData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [learnings, setLearnings] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetch(`/api/feedback/${t}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) { setError(d.error); }
          else { setData(d); }
          setLoading(false);
        })
        .catch(() => { setError("Failed to load feedback form."); setLoading(false); });
    });
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`/api/feedback/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: rating || undefined, review, learnings, wouldRecommend }),
    });
    const d = await res.json();
    setSubmitting(false);
    if (!res.ok) { alert(d.error ?? "Something went wrong"); return; }
    setSubmitted(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid Link</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (data?.alreadySubmitted || submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            {submitted
              ? `Your feedback on "${data?.bookTitle}" has been submitted.`
              : `You've already submitted feedback for "${data?.bookTitle}".`}
          </p>
          <p className="text-sm text-gray-400">God bless you — HOPFAN Library</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-600 rounded-full mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-500 mb-1">HOPFAN Library</p>
          <h1 className="text-2xl font-bold text-gray-800">Book Feedback</h1>
          <p className="text-gray-500 text-sm mt-1">Hi <strong>{data?.memberName}</strong>, share your thoughts on</p>
          <p className="text-purple-700 font-semibold text-lg mt-1">"{data?.bookTitle}"</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Star rating */}
          <div className="p-6 border-b border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              How would you rate this book?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  {(hoverRating || rating) >= star ? (
                    <StarIcon className="w-9 h-9 text-yellow-400" />
                  ) : (
                    <StarOutlineIcon className="w-9 h-9 text-gray-300" />
                  )}
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 self-center text-sm text-gray-500">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Review */}
          <div className="p-6 border-b border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What did you think of the book?
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              placeholder="Share your general thoughts, what stood out, what you liked or disliked…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Learnings */}
          <div className="p-6 border-b border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What did you learn or take away from this book?
            </label>
            <textarea
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              rows={4}
              placeholder="Key lessons, scriptures, insights, or things that changed your perspective…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Would recommend */}
          <div className="p-6 border-b border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Would you recommend this book to others?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition ${
                  wouldRecommend === true
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-500 hover:border-green-300"
                }`}
              >
                👍 Yes, definitely!
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition ${
                  wouldRecommend === false
                    ? "border-red-400 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-500 hover:border-red-200"
                }`}
              >
                👎 Not really
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="p-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-60 transition"
            >
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">All fields are optional — share as much or as little as you like.</p>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">© House of Prayer for all Nations · Library System</p>
      </div>
    </div>
  );
}
