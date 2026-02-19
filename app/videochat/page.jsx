'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import {
  attachGiftChannelListener,
  sendGiftEvent,
  setupGiftChannel
} from './webrtc-gifts';
import { getAppId, getFirestoreDb } from './firebase';
import GiftButton from './components/GiftButton';
import GiftStore from './components/GiftStore';
import GiftPlayer from './components/GiftPlayer';

const rtcConfig = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'] },
    {
      urls: [
        'turn:turnserver.twilio.com:3478?transport=udp',
        'turn:turnserver.twilio.com:3479?transport=tcp'
      ],
      username: 'webrtc',
      credential: 'webrtcpassword'
    }
  ],
  iceCandidatePoolSize: 20
};

export default function VideoChatPage() {
  const [db, setDb] = useState(null);
  const [configError, setConfigError] = useState(null);
  const appId = useMemo(() => getAppId(), []);
  const callsPath = useMemo(
    () => (appId ? ['artifacts', appId, 'public', 'data', 'calls'] : ['calls']),
    [appId]
  );

  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState(null);
  const [callId, setCallId] = useState('');
  const [joinCallId, setJoinCallId] = useState('');
  const [isGiftStoreOpen, setIsGiftStoreOpen] = useState(false);
  const [activeGift, setActiveGift] = useState(null);
  const [giftChannelReady, setGiftChannelReady] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const giftChannelRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const callUnsubRef = useRef(null);
  const candidateUnsubRef = useRef(null);

  useEffect(() => {
    try {
      setDb(getFirestoreDb());
    } catch (err) {
      console.error(err);
      setConfigError(err.message);
    }
  }, []);

  const cleanupCallListeners = () => {
    if (callUnsubRef.current) {
      callUnsubRef.current();
      callUnsubRef.current = null;
    }
    if (candidateUnsubRef.current) {
      candidateUnsubRef.current();
      candidateUnsubRef.current = null;
    }
  };

  const cleanupMedia = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
  };

  const hangUp = () => {
    cleanupCallListeners();
    pendingCandidatesRef.current = [];
    setGiftChannelReady(false);
    giftChannelRef.current?.close?.();
    giftChannelRef.current = null;

    peerConnectionRef.current?.getSenders?.().forEach((sender) => sender.track?.stop?.());
    peerConnectionRef.current?.close?.();
    peerConnectionRef.current = null;

    cleanupMedia();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallId('');
    setJoinCallId('');
    setActiveGift(null);
    setStatus('Call ended');
  };

  useEffect(() => {
    return () => {
      hangUp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChannelReady = (channel) => {
    giftChannelRef.current = channel;
    setGiftChannelReady(channel.readyState === 'open');

    channel.onopen = () => setGiftChannelReady(true);
    channel.onclose = () => setGiftChannelReady(false);
  };

  const createPeerConnection = async () => {
    setError(null);
    setStatus('Requesting camera/microphone...');

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const remoteMediaStream = new MediaStream();
    setRemoteStream(remoteMediaStream);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteMediaStream;
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!remoteMediaStream.getTracks().find((t) => t.id === track.id)) {
            remoteMediaStream.addTrack(track);
          }
        });
      }
    };

    attachGiftChannelListener(pc, {
      onGiftReceived: (gift) => setActiveGift(gift),
      onChannelReady: handleChannelReady
    });

    pc.onconnectionstatechange = () => setStatus(`Connection state: ${pc.connectionState}`);
    pc.oniceconnectionstatechange = () =>
      console.log('ICE state ->', pc.iceConnectionState);
    pc.onicegatheringstatechange = () =>
      console.log('ICE gathering ->', pc.iceGatheringState);

    return pc;
  };

  const addRemoteCandidate = async (pc, candidateData) => {
    if (!candidateData) return;
    if (pc.currentRemoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      } catch (err) {
        console.error('Error adding remote ICE candidate', err);
      }
    } else {
      pendingCandidatesRef.current.push(candidateData);
    }
  };

  const flushPendingCandidates = async (pc) => {
    if (pendingCandidatesRef.current.length === 0) return;
    for (const candidateData of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      } catch (err) {
        console.error('Error flushing queued ICE candidate', err);
      }
    }
    pendingCandidatesRef.current = [];
  };

  const callsCollection = useMemo(
    () => (db ? collection(db, ...callsPath) : null),
    [db, callsPath]
  );

  const startCall = async () => {
    try {
      if (!callsCollection) {
        setError('Firebase is not ready. Check your config.');
        return;
      }

      hangUp();
      setStatus('Creating call...');
      const pc = await createPeerConnection();

      // DataChannel must exist before the offer so the remote peer sees it
      setupGiftChannel(pc, handleChannelReady);

      const callDoc = doc(callsCollection);
      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await addDoc(offerCandidates, event.candidate.toJSON());
        }
      };

      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      await setDoc(callDoc, {
        offer: {
          type: offerDescription.type,
          sdp: offerDescription.sdp
        },
        createdAt: serverTimestamp(),
        role: 'caller'
      });

      // Listen for the answer SDP
      callUnsubRef.current = onSnapshot(callDoc, async (snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(data.answer);
          await pc.setRemoteDescription(answerDescription);
          await flushPendingCandidates(pc);
          setStatus('Answer received. Connecting...');
        }
      });

      // Listen for remote ICE candidates
      candidateUnsubRef.current = onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            addRemoteCandidate(pc, change.doc.data());
          }
        });
      });

      setCallId(callDoc.id);
      setStatus(`Call created. Share this ID: ${callDoc.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus('Failed to start call');
      hangUp();
    }
  };

  const answerCall = async () => {
    try {
      if (!joinCallId.trim()) {
        setError('Enter a Call ID to answer.');
        return;
      }

      if (!db) {
        setError('Firebase is not ready. Check your config.');
        return;
      }

      hangUp();
      setStatus('Joining call...');
      const pc = await createPeerConnection();

      const callDoc = doc(db, ...callsPath, joinCallId.trim());
      const callData = (await getDoc(callDoc)).data();

      if (!callData?.offer) {
        throw new Error('Offer not found for this Call ID.');
      }

      const offerDescription = new RTCSessionDescription(callData.offer);
      await pc.setRemoteDescription(offerDescription);
      await flushPendingCandidates(pc);

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      const answerCandidates = collection(callDoc, 'answerCandidates');
      const offerCandidates = collection(callDoc, 'offerCandidates');

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await addDoc(answerCandidates, event.candidate.toJSON());
        }
      };

      await updateDoc(callDoc, {
        answer: {
          type: answerDescription.type,
          sdp: answerDescription.sdp
        },
        answeredAt: serverTimestamp(),
        role: 'answerer'
      });

      candidateUnsubRef.current = onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            addRemoteCandidate(pc, change.doc.data());
          }
        });
      });

      setCallId(joinCallId.trim());
      setStatus('Answer sent. Waiting for connection...');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus('Failed to answer call');
      hangUp();
    }
  };

  const handleSendGift = async (gift) => {
    if (!giftChannelRef.current || giftChannelRef.current.readyState !== 'open') {
      setStatus('Gift channel is not ready yet—wait for the call to connect.');
      return;
    }

    await fetch('/api/send-gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        giftId: gift.id,
        fromUserId: 'demo-sender',
        toUserId: 'demo-recipient'
      })
    });

    sendGiftEvent(giftChannelRef.current, gift);
    setActiveGift(gift);
    setIsGiftStoreOpen(false);
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold">Firebase config missing</div>
          <div className="text-sm text-zinc-400">{configError}</div>
          <div className="text-xs text-zinc-500">
            Provide NEXT_PUBLIC_FIREBASE_* env vars or window.__firebase_config.
          </div>
        </div>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm text-zinc-400">Loading Firebase…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Antonio Records • Live Gifting
          </p>
          <h1 className="text-3xl font-semibold">Peer-to-Peer Stage with Virtual Gifts</h1>
          <p className="text-sm text-zinc-400">
            Start a call, drop a Call ID to a friend, and let fans fire off cinematic gifts over the
            WebRTC data channel.
          </p>
        </div>

        <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-2xl shadow-pink-500/10">
            <div className="flex flex-row justify-center gap-6">
              <div>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="rounded-xl border border-pink-400/70 w-80 h-60 bg-black"
                />
                <div className="text-center text-xs mt-2 text-zinc-400">You</div>
              </div>
              <div>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="rounded-xl border border-cyan-400/70 w-80 h-60 bg-black"
                />
                <div className="text-center text-xs mt-2 text-zinc-400">Remote</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <GiftButton onClick={() => setIsGiftStoreOpen(true)} />
              <span className="text-xs text-zinc-400">
                {giftChannelReady ? 'Gift channel ready' : 'Gifts unlock once the call connects'}
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">Create a new call</div>
              <button
                onClick={startCall}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white py-2 px-3 rounded-lg text-sm font-semibold"
              >
                Start Call & Share ID
              </button>
              {callId && (
                <div className="mt-2 text-xs text-green-400 break-all">
                  Call ID: <span className="font-mono">{callId}</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-3">
              <div className="text-sm font-medium mb-1">Join existing call</div>
              <div className="flex gap-2">
                <input
                  value={joinCallId}
                  onChange={(e) => setJoinCallId(e.target.value)}
                  placeholder="Enter Call ID"
                  className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={answerCall}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                >
                  Answer
                </button>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 flex gap-2">
              <button
                onClick={hangUp}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm"
              >
                Hang Up
              </button>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-1">
              <div className="text-xs text-zinc-400">Status</div>
              <div className="text-sm text-white">{status}</div>
              {error && <div className="text-xs text-red-400">{error}</div>}
            </div>
          </div>
        </div>
      </div>

      <GiftStore
        isOpen={isGiftStoreOpen}
        onClose={() => setIsGiftStoreOpen(false)}
        onSendGift={handleSendGift}
      />

      <GiftPlayer activeGift={activeGift} onEnd={() => setActiveGift(null)} />
    </div>
  );
}
