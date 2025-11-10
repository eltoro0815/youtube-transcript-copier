// ==UserScript==
// @name         YouTube Transcript Copier (Stable v3.7)
// @namespace    http://tampermonkey.net/
// @version      3.7
// @description  Copy YouTube transcripts with timestamps
// @author       You
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v3.7 loaded');

    // Wait for any selector
    function waitForElement(selector, timeout = 20000) {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector(selector);
            if (existing) return resolve(existing);

            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error('Element not found: ' + selector));
            }, timeout);
        });
    }

    // Find TRUE transcript header (works in all layouts)
    function findTranscriptHeader() {
        return document.querySelector('h2#title[aria-label="Transkript"]');
    }

    function insertCopyButton() {
        const header = findTranscriptHeader();
        if (!header) return;

        // dedupe
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

        header.appendChild(button);
        console.log("✅ Copy button inserted at transcript header");

        button.addEventListener('click', () => {
            const transcriptPanel = document.querySelector(
                'ytd-transcript-renderer, ' +
                'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
            );

            if (!transcriptPanel || transcriptPanel.innerText.trim() === '') {
                alert('Transkript ist noch nicht geladen.');
                return;
            }

            GM_setClipboard(transcriptPanel.innerText, 'text');
            alert('Transkript kopiert!');
        });
    }

    // Try inserting after page load & SPA navigation
    function tryInsert() {
        waitForElement('h2#title[aria-label="Transkript"]', 15000)
            .then(() => insertCopyButton())
            .catch(() => console.log("Transcript header not found yet"));
    }

    window.addEventListener('load', tryInsert);
    window.addEventListener('yt-navigate-finish', tryInsert, { passive: true });
})();
