import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0Y2l5fHvzoUkSJFWrd4ADb-6rRAT47Sw",
  authDomain: "studio-2fb13.firebaseapp.com",
  projectId: "studio-2fb13",
  storageBucket: "studio-2fb13.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
const auth = getAuth(app);


const allGifts = [
  'rose-bouquet',
  'golden-heart',
  'diamond-star',
  'midnight-flame',
  'raydiant-orb'
];

// Store previous unlock state in localStorage to detect new unlocks
function getPrevUnlocked() {
  try {
    return JSON.parse(localStorage.getItem('giftShelfUnlocked') || '{}');
  } catch {
    return {};
  }
}
function setPrevUnlocked(unlocked) {
  localStorage.setItem('giftShelfUnlocked', JSON.stringify(unlocked));
}


function playUnlockAnimation(div) {
  // Play sound effect
  try {
    const audio = new Audio('gold-burst.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch {}
  div.classList.add('unlock-animate');
  setTimeout(() => div.classList.remove('unlock-animate'), 1200);
}

function renderShelf(unlocked) {
  const shelf = document.getElementById('gift-shelf');
  shelf.innerHTML = '';
  const prevUnlocked = getPrevUnlocked();
  allGifts.forEach(gift => {
    const div = document.createElement('div');
    div.className = unlocked[gift] ? 'gift unlocked' : 'gift locked';
    div.innerText = gift.replace('-', ' ');
    shelf.appendChild(div);
    // If this gift was just unlocked, play animation
    if (unlocked[gift] && !prevUnlocked[gift]) {
      setTimeout(() => playUnlockAnimation(div), 200); // slight delay for effect
    }
  });
  setPrevUnlocked(unlocked);
}

function loadGiftShelf() {
  auth.onAuthStateChanged(async user => {
    if (!user) return;
    const uid = user.uid;
    const ref = doc(db, `artifacts/ai-enterprise-studio/users/${uid}/gifts/unlocked`);
    const snap = await getDoc(ref);
    const unlocked = snap.exists() ? snap.data() : {};
    renderShelf(unlocked);
  });
}

loadGiftShelf();
