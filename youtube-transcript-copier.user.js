// ==UserScript==
// @name         YouTube Transcript Copier v4.6
// @namespace    http://tampermonkey.net/
// @version      4.6
// @description  Copy YouTube transcripts reliably (button as sibling element)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v4.6 loaded');

    // Find the container to insert the button
    function findButtonContainer() {
        // Case 1: Chapters + Transcript → "In diesem Video" header
        const videoHeader = document.querySelector('h2#title[aria-label="In diesem Video"]');
        if (videoHeader) return videoHeader;

        // Case 2: Only Transcript → header "Transkript"
        const transcriptHeader = document.querySelector('h2#title[aria-label="Transkript"]');
        if (transcriptHeader) return transcriptHeader;

        return null;
    }

    async function insertCopyButton() {
        let header = null;
        for (let i = 0; i < 50; i++) { // max 10s wait
            header = findButtonContainer();
            if (header && header.offsetParent !== null) break;
            await new Promise(r => setTimeout(r, 200));
        }
        if (!header) return;

        // Prevent duplicate
        if (document.getElementById('copy-transcript-button')) return;

        const button = document.createElement('button');
        button.id = 'copy-transcript-button';
        button.textContent = '⭳ Download';
        button.title = 'Transkript kopieren';
        button.style = `
            margin-left: 8px;   /* Abstand rechts */
            font-size: 14px;
            cursor: pointer;
            background: transparent;
            border: none;
            color: var(--yt-spec-text-primary);
            display: inline-flex;
            align-items: center;
        `;

        // Insert as sibling right after the header
        header.insertAdjacentElement('afterend', button);

        console.log('✅ Copy button inserted as sibling');

        button.addEventListener('click', () => {
            // Find the transcript panel inside the closest container
            const transcriptPanel = header.closest('ytd-watch-flexy')
                .querySelector('ytd-transcript-renderer, ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');

            if (!transcriptPanel || transcriptPanel.innerText.trim() === '') {
                alert('Transkript ist noch nicht geladen.');
                return;
            }

            GM_setClipboard(transcriptPanel.innerText.trim(), 'text');
            alert('Transkript kopiert!');
        });
    }

    // Initial load
    window.addEventListener('load', () => setTimeout(insertCopyButton, 500));

    // SPA navigation
    window.addEventListener('yt-navigate-finish', () => setTimeout(insertCopyButton, 500));

})();
