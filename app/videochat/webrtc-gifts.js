// Sender side: create the DataChannel
export function setupGiftChannel(peerConnection, onChannelReady) {
  const giftChannel = peerConnection.createDataChannel("gifts");
  if (onChannelReady) {
    giftChannel.onopen = () => onChannelReady(giftChannel);
  }
  return giftChannel;
}

// Sender side: send a gift event
export function sendGiftEvent(giftChannel, gift) {
  if (!giftChannel || giftChannel.readyState !== "open") return;

  giftChannel.send(
    JSON.stringify({
      type: "GIFT",
      videoUrl: gift.videoUrl,
      background: gift.background,
      title: gift.title
    })
  );
}

// Receiver side: listen for gift events
export function attachGiftChannelListener(peerConnection, { onGiftReceived, onChannelReady }) {
  peerConnection.ondatachannel = (event) => {
    if (event.channel.label === "gifts") {
      const channel = event.channel;
      if (onChannelReady) onChannelReady(channel);

      channel.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === "GIFT") {
            onGiftReceived?.(data);
          }
        } catch (err) {
          console.error("Invalid gift message", err);
        }
      };
    }
  };
}
