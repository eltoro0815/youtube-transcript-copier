// ==UserScript==
// @name         YouTube Transcript Copier v4.3
// @namespace    http://tampermonkey.net/
// @version      4.3
// @description  Copy YouTube transcripts reliably (single container logic)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v4.3 loaded');

    // Find the container to insert the button
    function findButtonContainer() {
        // Case 1: Chapters + Transcript
        const videoHeader = document.querySelector('h2#title[aria-label="In diesem Video"]');
        if (videoHeader) return videoHeader;

        // Case 2: Only Transcript
        const transcriptHeader = document.querySelector('h2#title[aria-label="Transkript"]');
        if (transcriptHeader) return transcriptHeader;

        return null;
    }

    async function insertCopyButton() {
        let container = null;
        for (let i = 0; i < 50; i++) { // wait max 10s
            container = findButtonContainer();
            if (container && container.offsetParent !== null) break;
            await new Promise(r => setTimeout(r, 200));
        }
        if (!container) return;

        // Prevent duplicate
        if (document.getElementById('copy-transcript-button')) return;

        const button = document.createElement('button');
        button.id = 'copy-transcript-button';
        button.textContent = '⭳ Download';
        button.title = 'Transkript kopieren';
        button.style = `
            margin-left: 10px;
            cursor: pointer;
            font-size: 14px;
            background: transparent;
            border: none;
            color: var(--yt-spec-text-primary);
        `;

        container.appendChild(button);
        console.log('✅ Copy button inserted');

        button.addEventListener('click', () => {
            const transcriptText = container.closest('ytd-watch-flexy')
                .querySelector('ytd-transcript-renderer, ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]')
                ?.innerText.trim();

            if (!transcriptText) {
                alert('Transkript ist noch nicht geladen.');
                return;
            }

            GM_setClipboard(transcriptText, 'text');
            alert('Transkript kopiert!');
        });
    }

    // Initial load
    window.addEventListener('load', () => setTimeout(insertCopyButton, 500));

    // SPA navigation
    window.addEventListener('yt-navigate-finish', () => setTimeout(insertCopyButton, 500));

})();
