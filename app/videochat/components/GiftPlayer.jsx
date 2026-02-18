'use client';

import { useEffect, useState } from 'react';

const backgroundClasses = {
  roses: 'bg-rose-500',
  explosion: 'bg-black',
  car: 'bg-slate-900'
};

export default function GiftPlayer({ activeGift, onEnd }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (activeGift) {
      setVisible(true);
    }
  }, [activeGift]);

  if (!activeGift || !visible) return null;

  const bgClass = backgroundClasses[activeGift.background] || 'bg-black';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${bgClass} bg-opacity-90`}>
      <div className="absolute inset-0 pointer-events-none">
        {activeGift.background === 'roses' && (
          <div className="w-full h-full animate-pulse opacity-60" />
        )}
        {activeGift.background === 'explosion' && (
          <div className="w-full h-full animate-[ping_1.5s_ease-out_infinite] bg-gradient-to-br from-orange-500 via-yellow-400 to-red-700 opacity-60" />
        )}
        {activeGift.background === 'car' && (
          <div className="w-full h-full bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 opacity-70" />
        )}
      </div>

      <video
        src={activeGift.videoUrl}
        autoPlay
        playsInline
        className="relative z-10 max-w-[80vw] max-h-[80vh] rounded-2xl shadow-2xl border border-white/20"
        onEnded={() => {
          setVisible(false);
          onEnd && onEnd();
        }}
        onError={() => {
          setVisible(false);
          onEnd && onEnd();
        }}
      />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-center text-white">
        <div className="text-xs uppercase tracking-[0.3em] opacity-70">Gift Received</div>
        <div className="text-2xl font-semibold mt-1">{activeGift.title}</div>
      </div>
    </div>
  );
}