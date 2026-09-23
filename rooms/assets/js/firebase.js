import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { initializeFirestore, doc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, getDocs, getDoc, where, limitToLast } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Global variables
let db, auth, storage, userId;
const appId = 'ai-enterprise-studio'; // This should probably be in a config file

// This function is called but not defined in the original code.
// I'm adding a basic implementation based on how it's used.
async function updatePublicProfile(userId, data) {
    if (!userId || !db) return;
    try {
        const profileRef = doc(db, 'artifacts', appId, 'public', 'users', userId);
        await setDoc(profileRef, data, { merge: true });
        console.log(`[Firestore] Public profile for ${userId} updated:`, data);
    } catch (error) {
        console.error('[Firestore] Error updating public profile:', error);
    }
}


function setupRealtimeListeners(userId, db, elements) {
    if (!userId || !db) return;

    // Listen for chat messages
    const messagesCollection = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const messagesQuery = query(messagesCollection, orderBy('timestamp', 'desc'), limitToLast(50));

    onSnapshot(messagesQuery, (snapshot) => {
        const messagesDisplay = document.getElementById('messages-display');
        messagesDisplay.innerHTML = ''; // Clear existing messages

        const newMessages = [];
        snapshot.docs.forEach(doc => {
            newMessages.push(doc.data());
        });

        newMessages.reverse(); // to display in correct order

        newMessages.forEach(message => {
            const msgDiv = document.createElement('div');
            
            let alignment = 'self-start';
            let bgColor = 'bg-gray-700';
            let senderNameText = message.userName || 'Anonymous';

            if (message.userId === userId) {
                alignment = 'self-end';
                bgColor = 'bg-purple-900';
                senderNameText = "You";
            }

            msgDiv.className = `chat-message ${bgColor} text-white p-2 rounded mb-2 ${alignment}`;
            msgDiv.style.maxWidth = '80%';

            const senderName = document.createElement('div');
            senderName.className = 'font-bold';
            senderName.textContent = senderNameText;
            
            const messageText = document.createElement('div');
            messageText.textContent = message.text;

            msgDiv.appendChild(senderName);
            msgDiv.appendChild(messageText);

            messagesDisplay.appendChild(msgDiv);
        });
        messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
    });
}


function initializeFirebase(elements) {
    return new Promise((resolve, reject) => {
        try {
            const app = initializeApp(firebaseConfig);
            db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
            auth = getAuth(app);
            storage = getStorage(app);

            onAuthStateChanged(auth, (user) => {
                console.log('[Auth] Auth state changed. User:', user);
                if (user) {
                    userId = user.uid;
                    console.log('[Auth] User is signed in:', userId);

                    elements.authContainer.classList.add('hidden');
                    elements.mainContent.classList.remove('hidden');
                    elements.mainChatArea.classList.remove('hidden');
                    elements.userNameDisplay.textContent = user.displayName || 'Anonymous User';

                    console.log('[Init] Setting up realtime listeners...');
                    setupRealtimeListeners(userId, db, elements);
                    console.log('[Init] Updating public profile to online...');
                    updatePublicProfile(userId, { online: true });
                    console.log('[Init] User setup complete.');
                    resolve({ auth, db, storage, userId });
                } else {
                    console.log('[Auth] User is signed out.');
                    const oldUserId = userId;
                    if (oldUserId) {
                         console.log('[Auth] Updating public profile to offline for:', oldUserId);
                         updatePublicProfile(oldUserId, { online: false });
                    }
                    userId = null;
                    elements.authContainer.classList.remove('hidden');
                    elements.mainContent.classList.add('hidden');
                    console.log('[Auth] Attempting anonymous sign-in...');
                    signInAnonymously(auth).catch(error => {
                        console.error("[Auth] Anonymous sign-in failed:", error);
                        elements.authContainer.innerHTML = '<p class="text-red-500">Could not connect to the service. Please try again later.</p>';
                        reject(error);
                    });
                }
            });
        } catch (error) {
            console.error("Firebase initialization error:", error);
            elements.authContainer.innerHTML = '<p class="text-red-500">Firebase configuration error. Please check your setup.</p>';
            reject(error);
        }
    });
}

export { initializeFirebase, db, auth, storage, userId, updatePublicProfile, setupRealtimeListeners };
