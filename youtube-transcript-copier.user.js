// ==UserScript==
// @name         YouTube Transcript Copier v4.0
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Copy YouTube transcripts reliably (supports chapters and plain transcript)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v4.0 loaded');

    // Find the container where the button should be inserted
    function findButtonContainer() {
        // Layout 1: only transcript → #secondary-inner exists
        const secondaryInner = document.querySelector('#secondary-inner');
        if (secondaryInner) return secondaryInner;

        // Layout 2: chapters + transcript → header "In diesem Video"
        const videoHeader = document.querySelector('h2#title[aria-label="In diesem Video"]');
        if (videoHeader) return videoHeader;

        return null;
    }

    // Find the actual transcript panel
    function findTranscriptPanel() {
        return (
            document.querySelector('#secondary-inner ytd-transcript-renderer') ||
            document.querySelector('ytd-transcript-renderer') ||
            document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]')
        );
    }

    async function insertCopyButton() {
        let container = null;
        for (let i = 0; i < 50; i++) { // wait max 10s
            container = findButtonContainer();
            if (container) break;
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
            const transcriptPanel = findTranscriptPanel();
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
