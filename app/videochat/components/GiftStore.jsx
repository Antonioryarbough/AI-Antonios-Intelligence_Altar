'use client';

import { useEffect, useState } from 'react';

export default function GiftStore({ isOpen, onClose, onSendGift }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/gifts')
      .then(res => res.json())
      .then(data => setGifts(data))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="text-sm uppercase tracking-[0.3em] text-zinc-400">Choose a Gift</div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xs">Close</button>
        </div>

        <div className="p-4 overflow-y-auto">
          {loading && <div className="text-zinc-500 text-sm">Loading gifts…</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gifts.map(gift => (
              <button
                key={gift.id}
                onClick={() => onSendGift(gift)}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-500 transition"
              >
                <div className="aspect-video bg-black">
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                    {gift.title}
                  </div>
                </div>
                <div className="p-3 text-left">
                  <div className="text-sm text-white font-medium truncate">{gift.title}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    {gift.tier} • {gift.price} credits
                  </div>
                </div>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}