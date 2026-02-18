'use client';

export default function GiftButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/40"
      title="Send a gift"
    >
      🎁
    </button>
  );
}