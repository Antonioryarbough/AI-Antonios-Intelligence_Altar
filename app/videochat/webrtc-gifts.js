// Sender side: create the DataChannel
export function setupGiftChannel(peerConnection) {
  const giftChannel = peerConnection.createDataChannel("gifts");
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
export function attachGiftChannelListener(peerConnection, onGiftReceived) {
  peerConnection.ondatachannel = (event) => {
    if (event.channel.label === "gifts") {
      event.channel.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === "GIFT") {
            onGiftReceived(data);
          }
        } catch (err) {
          console.error("Invalid gift message", err);
        }
      };
    }
  };
}