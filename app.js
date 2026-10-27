/**
 * GE Vernova Sustainability Interactive Board
 * Main application JavaScript
 */

(function () {
    'use strict';

    // ===== LED SYNC CHANNEL =====
    const ledChannel = new BroadcastChannel('ge-sustainability-sync');

    function broadcastPageChange(pageId, subpage) {
        ledChannel.postMessage({ type: 'page-change', pageId: pageId, subpage: subpage });
    }

    // ===== STATE =====
    const state = {
        currentPage: 'intro',
        currentSubpage: {},
        inactivityTimer: null,
        inactivityTimeout: 120000, // 2 minutes
        isTransitioning: false,
        pillarOrder: ['electrify', 'decarbonize', 'conserve', 'thrive'],
        gifLoopTimer: null,
        gifLoopInterval: 5000 // 5 seconds between GIF pages
    };

    // Initialize subpage indexes
    state.pillarOrder.forEach(p => { state.currentSubpage[p] = 0; });

    // ===== DOM REFERENCES =====
    const pages = {
        intro: document.getElementById('page-intro'),
        'wheel-intro': document.getElementById('page-wheel-intro'),
        findout: document.getElementById('page-findout'),
        home: document.getElementById('page-home'),
        electrify: document.getElementById('page-electrify'),
        decarbonize: document.getElementById('page-decarbonize'),
        conserve: document.getElementById('page-conserve'),
        thrive: document.getElementById('page-thrive')
    };

    // ===== NAVIGATION =====
    function navigateTo(pageId) {
        if (pageId === state.currentPage || state.isTransitioning) return;

        const currentEl = pages[state.currentPage];
        const nextEl = pages[pageId];
        if (!nextEl) return;

        state.isTransitioning = true;

        // Immediately hide all non-current, non-target pages
        Object.keys(pages).forEach(key => {
            if (key !== state.currentPage && key !== pageId) {
                if (pages[key]) {
                    pages[key].classList.remove('active', 'transitioning-out', 'transitioning-in');
                    pages[key].style.opacity = '0';
                    pages[key].style.visibility = 'hidden';
                    pages[key].style.zIndex = '1';
                }
            }
        });

        // Show new page on top
        nextEl.style.opacity = '0';
        nextEl.style.visibility = 'visible';
        nextEl.style.zIndex = '20';
        nextEl.classList.add('active');

        // Force reflow then animate in
        void nextEl.offsetWidth;
        nextEl.style.opacity = '1';

        // Hide old page
        if (currentEl) {
            currentEl.style.zIndex = '10';
            currentEl.style.opacity = '0';
        }

        // Cleanup after transition
        setTimeout(() => {
            // Remove active from old page
            if (currentEl) {
                currentEl.classList.remove('active', 'transitioning-out');
                currentEl.style.visibility = 'hidden';
                currentEl.style.zIndex = '1';
            }

            // Normalize z-index on new page
            nextEl.style.zIndex = '10';
            nextEl.classList.remove('transitioning-in');

            state.currentPage = pageId;
            state.isTransitioning = false;

            // Reset subpage to 0 when entering a pillar
            if (state.pillarOrder.includes(pageId)) {
                showSubpage(pageId, 0);
            }

            // Broadcast to LED display
            broadcastPageChange(pageId, 0);

            // Start/stop GIF loop based on current page
            if (pageId === 'intro' || pageId === 'wheel-intro') {
                startGifLoop();
            } else {
                stopGifLoop();
            }
        }, 600);

        resetInactivityTimer();
    }

    // ===== SUBPAGE NAVIGATION =====
    function showSubpage(pillarId, index) {
        const contentArea = document.getElementById(pillarId + '-content');
        if (!contentArea) return;

        const subpages = contentArea.querySelectorAll('.pillar-subpage');
        const maxIdx = subpages.length - 1;
        if (index < 0 || index > maxIdx) return;

        // Hide all then show target
        subpages.forEach(sp => {
            sp.classList.remove('active');
        });

        subpages[index].classList.add('active');
        state.currentSubpage[pillarId] = index;
        updatePageIndicator(pillarId);

        // Broadcast subpage change to LED display
        broadcastPageChange(pillarId, index);
    }

    function nextSubpage(pillarId) {
        const current = state.currentSubpage[pillarId] || 0;
        const max = getMaxSubpages(pillarId);

        if (current < max - 1) {
            showSubpage(pillarId, current + 1);
        } else {
            // On last page: go back to Home (as per slide 50 design)
            navigateTo('home');
        }
    }

    function prevSubpage(pillarId) {
        const current = state.currentSubpage[pillarId] || 0;

        if (current > 0) {
            showSubpage(pillarId, current - 1);
        } else {
            // On first page: go back to Home (as per slide 50 design)
            navigateTo('home');
        }
    }

    function getMaxSubpages(pillarId) {
        const contentArea = document.getElementById(pillarId + '-content');
        if (!contentArea) return 1;
        return contentArea.querySelectorAll('.pillar-subpage').length;
    }

    // ===== PAGE INDICATORS =====
    function createPageIndicators() {
        state.pillarOrder.forEach(pillarId => {
            const page = pages[pillarId];
            if (!page) return;

            const max = getMaxSubpages(pillarId);
            if (max <= 1) return;

            // Find the pillar-layout container
            const layout = page.querySelector('.pillar-layout') || page;

            const indicator = document.createElement('div');
            indicator.classList.add('page-indicator');
            indicator.id = pillarId + '-indicator';

            for (let i = 0; i < max; i++) {
                const dot = document.createElement('div');
                dot.classList.add('page-dot');
                if (i === 0) dot.classList.add('active');
                dot.dataset.index = i;
                dot.addEventListener('click', () => {
                    showSubpage(pillarId, i);
                });
                indicator.appendChild(dot);
            }

            // Insert before bottom bar
            const bottomBar = layout.querySelector('.pillar-bottom-bar');
            if (bottomBar) {
                layout.insertBefore(indicator, bottomBar);
            } else {
                layout.appendChild(indicator);
            }
        });
    }

    function updatePageIndicator(pillarId) {
        const indicator = document.getElementById(pillarId + '-indicator');
        if (!indicator) return;

        const dots = indicator.querySelectorAll('.page-dot');
        const current = state.currentSubpage[pillarId] || 0;

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === current);
        });
    }

    // ===== INACTIVITY TIMER =====
    function resetInactivityTimer() {
        if (state.inactivityTimer) {
            clearTimeout(state.inactivityTimer);
        }
        state.inactivityTimer = setTimeout(() => {
            if (state.currentPage !== 'intro') {
                navigateTo('intro');
            }
        }, state.inactivityTimeout);
    }

    function setupInactivityListeners() {
        ['click', 'touchstart', 'mousemove', 'keydown'].forEach(evt => {
            document.addEventListener(evt, resetInactivityTimer, { passive: true });
        });
    }

    // ===== GIF LOOP (Auto-cycle intro pages) =====
    function startGifLoop() {
        stopGifLoop();
        state.gifLoopTimer = setInterval(() => {
            if (state.currentPage === 'intro') {
                navigateTo('wheel-intro');
            } else if (state.currentPage === 'wheel-intro') {
                navigateTo('intro');
            }
        }, state.gifLoopInterval);
    }

    function stopGifLoop() {
        if (state.gifLoopTimer) {
            clearInterval(state.gifLoopTimer);
            state.gifLoopTimer = null;
        }
    }

    // ===== EVENT BINDING =====
    function bindEvents() {
        // GIF pages: touch -> go directly to homepage ("Trang chủ" = findout)
        pages.intro.addEventListener('click', () => {
            stopGifLoop();
            navigateTo('findout');
        });

        pages['wheel-intro'].addEventListener('click', () => {
            stopGifLoop();
            navigateTo('findout');
        });

        // Page 3 -> 4
        pages.findout.addEventListener('click', () => {
            navigateTo('home');
        });

        // Dashboard Wheel Quadrants -> Individual Pillar Pages
        document.querySelectorAll('.home-arc').forEach(arc => {
            arc.addEventListener('click', (e) => {
                e.stopPropagation();
                const pillar = e.currentTarget.dataset.pillar;
                if (pillar && pages[pillar]) {
                    showSubpage(pillar, 0);
                    navigateTo(pillar);
                }
            });
        });

        // Global Nav Bar buttons (attached directly to page buttons)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // very important so we don't trigger the page click above
                const action = e.currentTarget.dataset.action;
                const pageId = state.currentPage;

                if (action === 'home') {
                    // If on a pillar detail page, go back to the wheel/pillar selection page
                    if (state.pillarOrder.includes(pageId)) {
                        navigateTo('home');
                    } else {
                        navigateTo('findout');
                    }
                    return;
                }

                // Sequence-based back/forward
                const sequence = ['intro', 'wheel-intro', 'findout', 'home'];
                const currentIndex = sequence.indexOf(pageId);

                if (currentIndex !== -1) {
                    if (action === 'back' && currentIndex > 0) {
                        navigateTo(sequence[currentIndex - 1]);
                    } else if (action === 'forward' && currentIndex < sequence.length - 1) {
                        navigateTo(sequence[currentIndex + 1]);
                    }
                } else {
                    // We are inside a pillar detail page
                    const pillar = pageId;
                    if (action === 'back') {
                        prevSubpage(pillar);
                    } else if (action === 'forward') {
                        nextSubpage(pillar);
                    }
                }
            });
        });
    }

    // Touch/swipe support
    state.pillarOrder.forEach(pillarId => {
        const contentArea = document.getElementById(pillarId + '-content');
        if (!contentArea) return;

        let startX = 0;
        let startY = 0;

        contentArea.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        contentArea.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = endX - startX;
            const diffY = endY - startY;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX < 0) {
                    nextSubpage(pillarId);
                } else {
                    prevSubpage(pillarId);
                }
            }
        }, { passive: true });
    });

    // ===== INIT =====
    function init() {
        // Ensure all pages except intro are hidden
        Object.keys(pages).forEach(key => {
            if (key !== 'intro' && pages[key]) {
                pages[key].style.opacity = '0';
                pages[key].style.visibility = 'hidden';
                pages[key].style.zIndex = '1';
                pages[key].classList.remove('active');
            }
        });

        // Set intro page as active
        if (pages.intro) {
            pages.intro.style.opacity = '1';
            pages.intro.style.visibility = 'visible';
            pages.intro.style.zIndex = '10';
            pages.intro.classList.add('active');
        }

        createPageIndicators();
        bindEvents();
        setupInactivityListeners();
        resetInactivityTimer();
        startGifLoop(); // Start auto-cycling intro pages

        console.log('GE Vernova Sustainability Interactive Board initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
