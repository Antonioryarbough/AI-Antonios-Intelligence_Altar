/* ===== BEAT MANAGEMENT SYSTEM (PIN: 4321) ===== */
const BEAT_MANAGER_DEFAULT_PIN = '4321';
const BEAT_MANAGER_PIN_KEY = 'beatManagerPin';
const BEATS_STORAGE_KEY = 'beatsAdded';

const CATEGORY_DEFAULTS = {
    black: { label: 'Black Label \u00b7 WAV', stripeLink: 'https://buy.stripe.com/14k0005e04vs1t614l', buyLabel: 'Buy $500', hasPreview: true },
    white: { label: 'White Label \u00b7 WAV', stripeLink: 'https://buy.stripe.com/dR65kk6i46DAfjW9AM', buyLabel: 'Buy $100', hasPreview: true },
    special: { label: 'Special \u00b7 WAV Instant Download', stripeLink: '#stripe-beat-drill', buyLabel: 'Inquire', hasPreview: false }
};

function loadAddedBeats() {
    try { return JSON.parse(localStorage.getItem(BEATS_STORAGE_KEY) || '[]'); }
    catch(e) { return []; }
}

function saveAddedBeats(beats) {
    localStorage.setItem(BEATS_STORAGE_KEY, JSON.stringify(beats));
}

function getPin() {
    return localStorage.getItem(BEAT_MANAGER_PIN_KEY) || BEAT_MANAGER_DEFAULT_PIN;
}

function renderAddedBeats() {
    const beats = loadAddedBeats();
    const section = document.getElementById('your-beats-section');
    const container = document.getElementById('your-beats-container');
    if (!section || !container) return;
    if (beats.length === 0) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');
    let html = '';
    beats.forEach(beat => {
        const d = CATEGORY_DEFAULTS[beat.category] || CATEGORY_DEFAULTS.black;
        const label = beat.label || d.label;
        const stripe = beat.stripeLink || d.stripeLink;
        const buyLabel = beat.buyLabel || d.buyLabel;
        const hp = (beat.hasPreview !== undefined) ? beat.hasPreview : d.hasPreview;
        let previewBtn = '';
        if (hp) {
            previewBtn = '<button data-src="' + beat.src + '" data-title="' + beat.name + '" class="dyn-preview text-[10px] text-[#ffd700] underline mr-2 hover:text-white transition">Preview</button>';
        }
        if (beat.category === 'special') {
            html += '<div class="beat-card flex items-center justify-between bg-black/60 border border-[#ffd700]/50 rounded-lg px-3 py-2"><div><p class="text-white text-xs font-bold">' + beat.name + '</p><p class="text-[#ffd700] text-[10px]">' + label + '</p></div><a href="' + stripe + '" target="_blank" rel="noopener noreferrer" class="beat-buy-btn bg-gradient-to-r from-[#ffd700] to-[#ff6b00] text-black text-[10px] font-black px-3 py-1 rounded-lg hover:opacity-90 transition">' + buyLabel + '</a></div>';
        } else if (beat.category === 'white') {
            html += '<div class="beat-card flex items-center justify-between bg-black/60 border border-white/10 rounded-lg px-3 py-2"><div><p class="text-white text-xs font-bold">' + beat.name + '</p><p class="text-[#bcaaa4] text-[10px]">' + label + '</p></div>' + previewBtn + '<a href="' + stripe + '" target="_blank" rel="noopener noreferrer" class="beat-buy-btn bg-white text-black text-[10px] font-black px-3 py-1 rounded-lg hover:bg-gray-200 transition">' + buyLabel + '</a></div>';
        } else {
            html += '<div class="beat-card flex items-center justify-between bg-black/60 border border-[#ffd700]/30 rounded-lg px-3 py-2"><div><p class="text-white text-xs font-bold">' + beat.name + '</p><p class="text-[#bcaaa4] text-[10px]">' + label + '</p></div>' + previewBtn + '<a href="' + stripe + '" target="_blank" rel="noopener noreferrer" class="beat-buy-btn bg-[#ffd700] text-black text-[10px] font-black px-3 py-1 rounded-lg hover:bg-[#ffca28] transition">' + buyLabel + '</a></div>';
        }
    });
    container.innerHTML = html;
    container.onclick = function(e) {
        const btn = e.target.closest('.dyn-preview');
        if (btn) { e.preventDefault(); window.openBeatPreview(btn.dataset.src, btn.dataset.title); }
    };
}

function renderAddedBeatOptions() {
    const beats = loadAddedBeats();
    const select = document.getElementById('st-beat-select');
    if (!select) return;
    select.querySelectorAll('.dynamic-beat-option').forEach(opt => opt.remove());
    if (beats.length === 0) return;
    beats.filter(b => b.category !== 'special').forEach(beat => {
        const opt = document.createElement('option');
        opt.value = beat.src;
        opt.textContent = beat.name;
        opt.className = 'dynamic-beat-option';
        select.appendChild(opt);
    });
}

function renderManagerBeatsList() {
    const beats = loadAddedBeats();
    const list = document.getElementById('bm-beats-list');
    if (!list) return;
    if (beats.length === 0) {
        list.innerHTML = '<p class="text-[9px] text-[#8d6e63]">No beats added yet.</p>';
        return;
    }
    let html = '';
    beats.forEach((beat, i) => {
        html += '<div class="flex items-center justify-between text-[10px] bg-black/30 border border-[#3e2723] rounded px-2 py-1"><span class="text-[#bcaaa4] truncate">' + beat.name + ' <span class="text-[#8d6e63]">(' + beat.category + ')</span></span><div class="flex gap-1"><button data-index="' + i + '" class="edit-btn text-[#ffd700] hover:text-white">Edit</button><button data-index="' + i + '" class="delete-btn text-[#ff6b00] hover:text-white">Del</button></div></div>';
    });
    list.innerHTML = html;
    list.onclick = function(e) {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) { e.preventDefault(); editAddedBeat(parseInt(editBtn.dataset.index)); }
        const delBtn = e.target.closest('.delete-btn');
        if (delBtn) { e.preventDefault(); deleteAddedBeat(parseInt(delBtn.dataset.index)); }
    };
}

function editAddedBeat(index) {
    const beats = loadAddedBeats();
    const beat = beats[index];
    if (!beat) return;
    document.getElementById('bm-beat-name').value = beat.name;
    document.getElementById('bm-beat-src').value = beat.src.replace(/^gifts\//, '');
    document.getElementById('bm-beat-stripe').value = beat.stripeLink || '';
    document.getElementById('bm-beat-category').value = beat.category;
    const btn = document.getElementById('bm-add-beat');
    btn.textContent = 'Update';
    btn.dataset.editIndex = index;
}

function deleteAddedBeat(index) {
    if (!confirm('Delete this beat?')) return;
    const beats = loadAddedBeats();
    beats.splice(index, 1);
    saveAddedBeats(beats);
    renderAddedBeats();
    renderAddedBeatOptions();
    renderManagerBeatsList();
    const btn = document.getElementById('bm-add-beat');
    btn.textContent = 'Add Beat';
    delete btn.dataset.editIndex;
    document.getElementById('bm-beat-name').value = '';
    document.getElementById('bm-beat-src').value = '';
    document.getElementById('bm-beat-stripe').value = '';
}

const bmToggle = document.getElementById('beat-manager-toggle');
const bmPanel = document.getElementById('beat-manager-panel');
const bmPinGate = document.getElementById('beat-manager-pin-gate');
const bmContent = document.getElementById('beat-manager-content');
const bmPin = document.getElementById('beat-manager-pin');
const bmUnlock = document.getElementById('beat-manager-unlock');
const bmAdd = document.getElementById('bm-add-beat');
const bmLock = document.getElementById('bm-lock');
const bmChangePin = document.getElementById('bm-change-pin');

if (bmToggle) bmToggle.addEventListener('click', () => {
    if (bmPanel) bmPanel.classList.toggle('hidden');
});

if (bmUnlock) bmUnlock.addEventListener('click', () => {
    if (bmPin.value === getPin()) {
        bmPinGate.classList.add('hidden');
        bmContent.classList.remove('hidden');
    } else {
        bmPin.value = '';
        alert('Wrong PIN!');
    }
});

if (bmAdd) bmAdd.addEventListener('click', function() {
    const name = document.getElementById('bm-beat-name').value.trim();
    const srcFile = document.getElementById('bm-beat-src').value.trim();
    const category = document.getElementById('bm-beat-category').value;
    if (!name || !srcFile) { alert('Please enter both beat name and file name.'); return; }
    const d = CATEGORY_DEFAULTS[category];
    const newBeat = {
        name: name,
        src: srcFile.indexOf('gifts/') === 0 ? srcFile : 'gifts/' + srcFile,
        label: d.label,
        stripeLink: d.stripeLink,
        buyLabel: d.buyLabel,
        category: category,
        hasPreview: d.hasPreview
    };
    const customStripe = document.getElementById('bm-beat-stripe').value.trim();
    if (customStripe) newBeat.stripeLink = customStripe;
    const beats = loadAddedBeats();
    const editIndex = this.dataset.editIndex;
    if (editIndex !== undefined) { beats[editIndex] = newBeat; delete this.dataset.editIndex; }
    else { beats.push(newBeat); }
    saveAddedBeats(beats);
    document.getElementById('bm-beat-name').value = '';
    document.getElementById('bm-beat-src').value = '';
    document.getElementById('bm-beat-stripe').value = '';
    this.textContent = 'Add Beat';
    renderAddedBeats();
    renderAddedBeatOptions();
    renderManagerBeatsList();
});

if (bmLock) bmLock.addEventListener('click', () => {
    if (bmPanel) bmPanel.classList.add('hidden');
    if (bmContent) bmContent.classList.add('hidden');
    if (bmPinGate) bmPinGate.classList.remove('hidden');
    if (bmPin) bmPin.value = '';
});

if (bmChangePin) bmChangePin.addEventListener('click', () => {
    const newPin = prompt('Enter new 4-digit PIN:');
    if (newPin && /^[0-9]{4}$/.test(newPin)) {
        localStorage.setItem(BEAT_MANAGER_PIN_KEY, newPin);
        alert('PIN updated!');
    } else if (newPin) {
        alert('PIN must be exactly 4 digits.');
    }
});

renderAddedBeats();
renderAddedBeatOptions();
renderManagerBeatsList();
