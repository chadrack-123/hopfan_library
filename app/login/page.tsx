"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const verses = [
  { text: "Your word is a lamp to my feet and a light to my path.", ref: "Psalm 119:105" },
  { text: "The fear of the LORD is the beginning of wisdom.", ref: "Proverbs 9:10" },
  { text: "Let the word of Christ dwell in you richly in all wisdom.", ref: "Colossians 3:16" },
  { text: "Study to show yourself approved to God, a worker who does not need to be ashamed.", ref: "2 Timothy 2:15" },
  { text: "My people are destroyed for lack of knowledge.", ref: "Hosea 4:6" },
  { text: "The entrance of your words gives light; it gives understanding to the simple.", ref: "Psalm 119:130" },
  { text: "My house shall be called a house of prayer for all nations.", ref: "Isaiah 56:7" },
  { text: "It is written, My house shall be called the house of prayer.", ref: "Matthew 21:13" },
  { text: "For my house shall be called a house of prayer for all peoples.", ref: "Isaiah 56:7 (ESV)" },
  { text: "Blessed is the man who finds wisdom, and the man who gains understanding.", ref: "Proverbs 3:13" },
  { text: "As iron sharpens iron, so one person sharpens another.", ref: "Proverbs 27:17" },
  { text: "For wisdom is better than rubies; and all the things that may be desired are not to be compared to it.", ref: "Proverbs 8:11" },
  { text: "The reading of all good books is like a conversation with the finest minds of past centuries.", ref: "Proverbs 2:6" },
  { text: "Buy the truth and do not sell it — wisdom, instruction and insight as well.", ref: "Proverbs 23:23" },
  { text: "A wise man will hear and increase in learning, and a man of understanding will acquire wise counsel.", ref: "Proverbs 1:5" },
  { text: "Open my eyes that I may see wonderful things in your law.", ref: "Psalm 119:18" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verseIndex, setVerseIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setVerseIndex((i) => (i + 1) % verses.length);
        setFade(true);
      }, 500);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 px-4">
      <div className="flex items-center gap-16 w-full max-w-4xl">

        {/* Bible verse — left side, hidden on small screens */}
        <div
          className="hidden lg:flex flex-col flex-1 text-center transition-opacity duration-500"
          style={{ opacity: fade ? 1 : 0 }}
        >
          <div className="text-5xl text-white/20 font-serif leading-none mb-3">&ldquo;</div>
          <p className="text-white/85 text-lg italic leading-relaxed font-light">
            {verses[verseIndex].text}
          </p>
          <p className="text-blue-300 text-sm mt-4 font-semibold tracking-wide">— {verses[verseIndex].ref}</p>
        </div>

        {/* Login card — right side */}
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7 flex-shrink-0 mx-auto lg:mx-0">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 flex items-center justify-center mb-3">
            <Image
              src="/hopfan-logo.PNG"
              alt="HOPFAN Logo"
              width={64}
              height={64}
              className="object-contain w-full h-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <h1 className="text-xl font-bold text-blue-900 text-center leading-tight">
            House of Prayer for all Nations
          </h1>
          <p className="text-gray-500 text-xs mt-1">Library Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@hopfan.church"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          HOPFAN Library © {new Date().getFullYear()}
        </p>
        </div>
      </div>
    </div>
  );
}
