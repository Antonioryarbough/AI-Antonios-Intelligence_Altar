import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1f1b0a] to-[#3a2c12] text-white">
      <div className="bg-[rgba(80,70,30,0.7)] backdrop-blur-lg rounded-2xl shadow-xl p-10 flex flex-col items-center max-w-xl w-full">
        <h1 className="text-4xl font-bold mb-4 text-gold-400 drop-shadow">Antonio's Intelligence Altar</h1>
        <p className="text-lg mb-8 text-zinc-200">Pisces-centered creative coaching, live videochat, and spiritual music gifts.</p>
        <Link href="/videochat">
          <button className="px-8 py-3 rounded-xl bg-gold-400 text-[#1f1b0a] font-semibold text-lg shadow hover:bg-gold-300 transition mb-2">
            Enter Videochat Experience
          </button>
        </Link>
        <span className="text-xs text-zinc-400">Requires camera & mic access</span>
      </div>
    </main>
  );
}
