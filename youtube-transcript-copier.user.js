// ==UserScript==
// @name         YouTube Transcript Copier v4.8
// @namespace    http://tampermonkey.net/
// @version      4.8
// @description  Copy YouTube transcripts (button inline right of header)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v4.8 loaded');

    // Find the header to attach the button
    function findButtonContainer() {
        // Case 1: Chapters + Transcript → "In diesem Video"
        const videoHeader = document.querySelector('h2#title[aria-label="In diesem Video"]');
        if (videoHeader) return videoHeader;

        // Case 2: Only Transcript → "Transkript"
        const transcriptHeader = document.querySelector('h2#title[aria-label="Transkript"]');
        if (transcriptHeader) return transcriptHeader;

        return null;
    }

    async function insertCopyButton() {
        let header = null;
        for (let i = 0; i < 50; i++) { // wait max 10s
            header = findButtonContainer();
            if (header && header.offsetParent !== null) break;
            await new Promise(r => setTimeout(r, 200));
        }
        if (!header) return;

        // Prevent duplicate
        if (document.getElementById('copy-transcript-button')) return;

        // Make header inline-flex to allow button right of text
        header.style.display = 'inline-flex';
        header.style.alignItems = 'center';
        header.style.gap = '8px'; // optional spacing

        const button = document.createElement('button');
        button.id = 'copy-transcript-button';
        button.textContent = '⭳ Download';
        button.title = 'Transkript kopieren';
        button.style.cssText = `
            font-size: 14px;
            cursor: pointer;
            background: transparent;
            border: none;
            color: var(--yt-spec-text-primary);
            display: inline-flex;
            align-items: center;
        `;

        header.appendChild(button);
        console.log('✅ Copy button inserted inline right of header');

        button.addEventListener('click', () => {
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
