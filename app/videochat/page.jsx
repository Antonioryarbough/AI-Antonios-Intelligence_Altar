'use client';
import {
  setupGiftChannel,
  sendGiftEvent,
  attachGiftChannelListener
} from "./webrtc-gifts";
import { useState } from 'react';
import GiftButton from './components/GiftButton';
import GiftStore from './components/GiftStore';
import GiftPlayer from './components/GiftPlayer';

export default function VideoChatPage() {
  const [isGiftStoreOpen, setIsGiftStoreOpen] = useState(false);
  const [activeGift, setActiveGift] = useState(null);
  const [giftChannel, setGiftChannel] = useState(null);

  // Example: You may need to store peerConnection in state or ref as well, depending on your app structure
  // const [peerConnection, setPeerConnection] = useState(null);

  async function createPeerConnection() {
    console.log('Creating peer connection with config:', rtcConfig);
    const peerConnection = new RTCPeerConnection(rtcConfig);

    // Caller side: create the DataChannel
    const channel = setupGiftChannel(peerConnection);
    setGiftChannel(channel);

    // ...other WebRTC setup (remoteStream, remoteCallVideo, pendingICECandidates, etc.)

    // Receiver side: listen for incoming gifts
    attachGiftChannelListener(peerConnection, (gift) => {
      console.log("Received gift over DataChannel:", gift);
      setActiveGift(gift);
    });

    // ...your existing ontrack, ICE, etc...
    // return peerConnection if needed
  }

  const handleSendGift = async (gift) => {
    await fetch('/api/send-gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        giftId: gift.id,
        fromUserId: 'demo-sender',
        toUserId: 'demo-recipient'
      })
    });

    sendGiftEvent(giftChannel, gift);
    setActiveGift(gift);
    setIsGiftStoreOpen(false);
  };

  return (
    <div className="relative w-full h-screen bg-black text-white">
      {/* Your existing videochat UI will go here */}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <GiftButton onClick={() => setIsGiftStoreOpen(true)} />
      </div>

      <GiftStore
        isOpen={isGiftStoreOpen}
        onClose={() => setIsGiftStoreOpen(false)}
        onSendGift={handleSendGift}
      />

      <GiftPlayer
        activeGift={activeGift}
        onEnd={() => setActiveGift(null)}
      />
    </div>
  );
}