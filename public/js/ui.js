function showMessage(message) {
    document.getElementById('message-text').textContent = message;
    document.getElementById('message-box').style.display = 'block';
}

function setupTour() {
    const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
            classes: 'shepherd-theme-arrows',
            scrollTo: true,
            cancelIcon: {
                enabled: true
            },
        }
    });

    tour.addStep({
        id: 'step-welcome',
        text: 'Welcome to the Studio! Let'\''s take a quick tour of the new layout.',
        attachTo: { element: '.sidebar', on: 'left' },
        buttons: [{ text: 'Next', action: tour.next }]
    });

    tour.addStep({
        id: 'step-studio-tab',
        text: 'This is the <strong>Studio</strong> tab. Here you can make video calls, record your vocals, and work with beats.',
        attachTo: { element: '[data-tab="studio"]', on: 'bottom' },
        buttons: [{ text: 'Next', action: tour.next }]
    });
    
    tour.addStep({
        id: 'step-community-tab',
        text: 'The <strong>Community</strong> tab shows you other creators in the Studio Directory and the AI Zodiac Council.',
        attachTo: { element: '[data-tab="community"]', on: 'bottom' },
        beforeShow: () => document.querySelector('[data-tab="community"]').click(),
        buttons: [{ text: 'Next', action: tour.next }]
    });

    tour.addStep({
        id: 'step-marketplace-tab',
        text: 'In the <strong>Gift/Shop</strong>, you can buy and send virtual gifts, purchase beats, or get the final master of your track.',
        attachTo: { element: '[data-tab="marketplace"]', on: 'bottom' },
        beforeShow: () => document.querySelector('[data-tab="marketplace"]').click(),
        buttons: [{ text: 'Next', action: tour.next }]
    });

    tour.addStep({
        id: 'step-profile-tab',
        text: 'Finally, the <strong>Profile</strong> tab is where you can edit your profile, find your Zodiac sign, and get help.',
        attachTo: { element: '[data-tab="profile"]', on: 'bottom' },
        beforeShow: () => document.querySelector('[data-tab="profile"]').click(),
        buttons: [{ text: 'Next', action: tour.next }]
    });

    tour.addStep({
        id: 'step-finish',
        text: 'That'\''s it! You'\''re ready to start creating. Enjoy the studio!',
        attachTo: { element: '.sidebar', on: 'left' },
        beforeShow: () => document.querySelector('[data-tab="studio"]').click(),
        buttons: [{ text: 'Finish', action: tour.complete }]
    });

    document.getElementById('start-tour-btn').addEventListener('click', () => {
        tour.start();
    });
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tabId = button.dataset.tab;
            const tabDisplayContent = document.getElementById('tab-display-content');
            const tabContentArea = document.getElementById('tab-content-area');
            
            if (tabId === 'studio') {
                // Show studio tab content (includes chat)
                tabContents.forEach(content => content.classList.remove('hidden'));
                tabDisplayContent.classList.add('hidden');
                document.getElementById('studio-tab').classList.remove('hidden');
                tabContents.forEach(content => {
                    if (content.id !== 'studio-tab') {
                        content.classList.add('hidden');
                    }
                });
            } else {
                // Hide all original tab content, show in tab display area
                tabContents.forEach(content => content.classList.add('hidden'));
                const activeTabContent = document.getElementById(`${tabId}-tab`);
                
                if (activeTabContent) {
                    tabDisplayContent.innerHTML = activeTabContent.innerHTML;
                    tabDisplayContent.classList.remove('hidden');
                    tabContentArea.scrollTop = 0;

                    if (typeof window.wireRapGuide === 'function') {
                        window.wireRapGuide(tabDisplayContent);
                    }
                    if (typeof window.wireGiftButtons === 'function') {
                        window.wireGiftButtons(tabDisplayContent);
                    }
                    if (typeof window.wireDirectoryParticipants === 'function') {
                        window.wireDirectoryParticipants(tabDisplayContent);
                    }
                }
            }
        });
    });
}

function setupModals(elements) {
    elements.findSignBtn.addEventListener('click', () => {
        elements.birthdayModal.classList.remove('hidden');
    });

    elements.cancelBirthdayBtn.addEventListener('click', () => {
        elements.birthdayModal.classList.add('hidden');
    });

    elements.cancelEditBtn.addEventListener('click', () => {
        elements.editModal.classList.add('hidden');
    });

    document.getElementById('close-message').addEventListener('click', () => {
        document.getElementById('message-box').style.display = 'none';
    });

    elements.closeGiftAnimation.addEventListener('click', () => {
        elements.giftAnimationOverlay.classList.add('hidden');
        if (elements.giftAnimationVideo) {
            elements.giftAnimationVideo.pause();
            elements.giftAnimationVideo.src = '';
        }
    });
}

export { showMessage, setupTour, setupTabs, setupModals };
