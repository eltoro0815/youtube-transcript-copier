// ==UserScript==
// @name         YouTube Transcript Copier v3.8
// @namespace    http://tampermonkey.net/
// @version      3.8
// @description  Copy YouTube transcripts reliably (works with/without chapters)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v3.8 loaded');

    // Find the common "In diesem Video" header
    function findVideoHeader() {
        return document.querySelector('h2#title[aria-label="In diesem Video"]');
    }

    async function insertCopyButton() {
        let headerEl = null;
        for (let i = 0; i < 50; i++) { // max 10s wait
            headerEl = findVideoHeader();
            if (headerEl && headerEl.offsetParent !== null) break;
            await new Promise(r => setTimeout(r, 200));
        }
        if (!headerEl) return;

        // Prevent duplicate
        if (document.getElementById('copy-transcript-button')) return;

        const btn = document.createElement('button');
        btn.id = 'copy-transcript-button';
        btn.textContent = '⭳ Download';
        btn.title = 'Transkript kopieren';
        btn.style = `
            margin-left: 10px;
            cursor: pointer;
            font-size: 14px;
            background: transparent;
            border: none;
            color: var(--yt-spec-text-primary);
        `;
        headerEl.appendChild(btn);
        console.log('✅ Copy button inserted under "In diesem Video"');

        btn.addEventListener('click', () => {
            // Find the transcript panel under the video container
            const transcriptPanel =
                headerEl.closest('ytd-watch-flexy')
                        .querySelector('ytd-transcript-renderer') ||
                document.querySelector(
                    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
                );

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
