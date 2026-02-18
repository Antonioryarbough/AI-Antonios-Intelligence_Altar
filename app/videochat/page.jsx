'use client';
import {
  setupGiftChannel,
  sendGiftEvent,
  attachGiftChannelListener
} from "./webrtc-gifts";
import { useState, useRef } from 'react';
import GiftButton from './components/GiftButton';
import GiftStore from './components/GiftStore';
import GiftPlayer from './components/GiftPlayer';

export default function VideoChatPage() {
  const [isGiftStoreOpen, setIsGiftStoreOpen] = useState(false);
  const [activeGift, setActiveGift] = useState(null);
  const [giftChannel, setGiftChannel] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  async function createPeerConnection() {
    console.log('Creating peer connection with config:', rtcConfig);
    const pc = new RTCPeerConnection(rtcConfig);
    setPeerConnection(pc);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const remoteMediaStream = new MediaStream();
    setRemoteStream(remoteMediaStream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteMediaStream;
    }
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteMediaStream.addTrack(track);
      });
    };

    const channel = setupGiftChannel(pc);
    setGiftChannel(channel);

    attachGiftChannelListener(pc, (gift) => {
      console.log("Received gift over DataChannel:", gift);
      setActiveGift(gift);
    });
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
      <div className="flex flex-row justify-center items-center h-3/4 gap-8">
        <div>
          <video ref={localVideoRef} autoPlay muted playsInline className="rounded-lg border border-yellow-400 w-80 h-60 bg-black" />
          <div className="text-center mt-2">You</div>
        </div>
        <div>
          <video ref={remoteVideoRef} autoPlay playsInline className="rounded-lg border border-blue-400 w-80 h-60 bg-black" />
          <div className="text-center mt-2">Remote</div>
        </div>
      </div>

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
