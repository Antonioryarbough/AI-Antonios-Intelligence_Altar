import { showMessage } from './ui.js';
import { updatePublicProfile } from './firebase.js';

let localStream, peer, currentCall;

async function startCamera(elements) {
    try {
        console.log('🎥 Requesting camera and microphone access...');
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1920 }, 
                height: { ideal: 1080 },
                aspectRatio: { ideal: 16/9 }
            }, 
            audio: true 
        });
        console.log('✅ Got media stream:', localStream);
        
        const videoEl = elements.localVideo;
        videoEl.srcObject = localStream;
        
        const placeholder = document.getElementById('video-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        
        videoEl.onloadedmetadata = () => {
            videoEl.play().catch(e => console.error('❌ Video play failed:', e));
        };
        
        elements.callStatus.textContent = '✅ Camera and Mic Ready';
        elements.enableCameraBtn.textContent = '✅ Camera Enabled';
        elements.enableCameraBtn.disabled = true;
        elements.enableCameraBtn.style.opacity = '0.5';
        console.log('✅ Camera started successfully');
    } catch (err) {
        console.error("❌ Camera access error:", err);
        elements.callStatus.textContent = '⚠️ Camera/Mic not enabled';
        elements.enableCameraBtn.disabled = false;
        
        let errorMsg = 'Please allow camera and microphone access.\n\n';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMsg += '🔒 Permission was blocked. You may need to reset permissions in your browser settings.';
        } else if (err.name === 'NotFoundError') {
            errorMsg += '📷 No camera/mic found.';
        } else if (err.name === 'NotReadableError') {
            errorMsg += '⚠️ Camera is in use by another app.';
        } else {
            errorMsg += `Error: ${err.name}`;
        }
        showMessage(errorMsg);
    }
}

function initializePeer(userId, elements) {
    peer = new Peer(peerJsConfig);
    
    peer.on('open', (id) => {
        console.log('My peer ID is:', id);
        elements.myPeerId.textContent = id;
        elements.callStatus.textContent = 'Ready to call!';
        updatePublicProfile(userId, { peerId: id });
    });

    peer.on('disconnected', () => {
        console.warn('PeerJS disconnected; attempting reconnect');
        elements.callStatus.textContent = 'Disconnected; retrying...';
        try { peer.reconnect(); } catch (e) { console.error('PeerJS reconnect failed', e); }
    });

    peer.on('call', (call) => {
        console.log('Incoming call from:', call.peer);
        call.answer(localStream);
        handleCall(call, elements);
    });

    peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        showMessage('Connection error: ' + err.type);
    });
}

function handleCall(call, elements) {
    currentCall = call;
    
    call.on('stream', (remoteStream) => {
        elements.remoteVideo.srcObject = remoteStream;
        elements.remoteVideo.style.display = 'block';
        elements.hangupCallBtn.classList.remove('hidden');
        elements.startCallBtn.classList.add('hidden');
        elements.callStatus.textContent = 'Connected!';
    });

    call.on('close', () => {
        hangupCall(elements);
    });
}

function hangupCall(elements) {
    if (currentCall) {
        currentCall.close();
    }
    elements.remoteVideo.srcObject = null;
    elements.remoteVideo.style.display = 'none';
    elements.hangupCallBtn.classList.add('hidden');
    elements.startCallBtn.classList.remove('hidden');
    elements.callStatus.textContent = 'Call ended';
}

function setupVideo(userId, elements) {
    elements.enableCameraBtn.addEventListener('click', async () => {
        elements.enableCameraBtn.textContent = '⏳ Starting camera...';
        elements.enableCameraBtn.disabled = true;
        await startCamera(elements);
        setTimeout(() => {
            if (!localStream) {
                elements.enableCameraBtn.disabled = false;
                elements.enableCameraBtn.textContent = '📹 Try Again';
            }
        }, 1000);
    });

    elements.startCallBtn.addEventListener('click', () => {
        const remotePeerId = elements.remotePeerIdInput.value.trim();
        if (!remotePeerId) {
            showMessage('Please enter a Peer ID to call');
            return;
        }
        
        elements.callStatus.textContent = 'Calling...';
        const call = peer.call(remotePeerId, localStream);
        handleCall(call, elements);
    });

    elements.hangupCallBtn.addEventListener('click', () => hangupCall(elements));

    initializePeer(userId, elements);
}

export { setupVideo, localStream };
