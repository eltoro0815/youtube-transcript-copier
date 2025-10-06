// ==UserScript==
// @name         YouTube Transcript Copier
// @namespace    http://tampermonkey.net/
// @version      3.1.0
// @description  Copy YouTube video transcripts with timestamps
// @author       You
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('Tampermonkey script loaded: YouTube Transcript Copier'); // Log when the script is loaded

    // Utility-Funktion, die auf das Erscheinen eines Elements wartet
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

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

    // Fügt den Copy-Button in die Kopfzeile des Transkript-Panels ein
    function insertCopyButtonWhenReady() {
        const transcriptHeaderSelector = 'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] ytd-engagement-panel-title-header-renderer';
        waitForElement(transcriptHeaderSelector, 20000)
            .then((headerEl) => {
                // Dedupe
                if (document.getElementById('copy-transcript-button')) return;

                const copyButton = document.createElement('button');
                copyButton.id = 'copy-transcript-button';
                copyButton.textContent = '⭳';
                copyButton.title = 'Transcript kopieren';
                copyButton.style = 'margin-left: 8px; cursor: pointer; font-size: 16px; background: transparent; border: none;';

                // Neben die Überschrift setzen
                headerEl.appendChild(copyButton);
                console.log('Copy Transcript button inserted into transcript header.');

                copyButton.addEventListener('click', function() {
                    const transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
                    if (!transcriptPanel || transcriptPanel.innerText.trim() === '') {
                        console.log('Transcript panel not ready yet.');
                        return;
                    }
                    GM_setClipboard(transcriptPanel.innerText, 'text');
                    console.log('Transcript copied to clipboard.');
                    alert('Transcript copied to clipboard!');
                });
            })
            .catch((err) => {
                console.log('Transcript header did not appear:', err);
            });
    }

    // Beim Laden der Seite und bei SPA-Navigation die Einfügung versuchen
    window.addEventListener('load', function() {
        console.log('Page loaded. Attempting to insert Copy Transcript button...');
        insertCopyButtonWhenReady();
    });
    window.addEventListener('yt-navigate-finish', insertCopyButtonWhenReady, { passive: true });
})();
