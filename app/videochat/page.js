'use client';

import { useEffect, useRef, useState } from 'react';
import GiftStore from './components/GiftStore';
import GiftButton from './components/GiftButton';
import GiftPlayer from './components/GiftPlayer';

export default function VideoChatPage() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [pc, setPc] = useState(null);
  const [dataChannel, setDataChannel] = useState(null);
  const [giftToPlay, setGiftToPlay] = useState(null);
  const [storeOpen, setStoreOpen] = useState(false);

  // Initialize WebRTC
  useEffect(() => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
    });

    setPc(peer);

    // Create DataChannel for gifts
    const channel = peer.createDataChannel('gifts');
    setDataChannel(channel);

    channel.onmessage = (event) => {
      try {
        const gift = JSON.parse(event.data);
        setGiftToPlay(gift);
      } catch (err) {
        console.error('Invalid gift data:', err);
      }
    };

    // Remote stream
    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Local stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      });

    return () => peer.close();
  }, []);

  // Send gift through DataChannel
  const handleSendGift = (gift) => {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(gift));
      setGiftToPlay(gift);
    }
    setStoreOpen(false);
  };

  return (
    <main className="relative min-h-screen bg-black text-white flex items-center justify-center">
      {/* Local + Remote Video */}
      <div className="relative w-full max-w-5xl flex items-center justify-center">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full rounded-xl shadow-lg"
        />

        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute bottom-4 right-4 w-40 rounded-lg border border-white/20 shadow-lg"
        />
      </div>

      {/* Gift Button */}
      <GiftButton onClick={() => setStoreOpen(true)} />

      {/* Gift Store Drawer */}
      <GiftStore
        isOpen={storeOpen}
        onClose={() => setStoreOpen(false)}
        onSendGift={handleSendGift}
      />

      {/* Gift Player Overlay */}
      {giftToPlay && (
        <GiftPlayer gift={giftToPlay} onFinish={() => setGiftToPlay(null)} />
      )}
    </main>
  );
}
