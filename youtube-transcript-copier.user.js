// ==UserScript==
// @name         YouTube Transcript Copier
// @namespace    http://tampermonkey.net/
// @version      3.0.0
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

    // Angepasste Funktion, die den Copy-Button erst einfügt, wenn der Show transcript-Button da ist
    function insertCopyButtonWhenReady() {
        const transcriptButtonSelector = '#primary-button > ytd-button-renderer > yt-button-shape > button';
        waitForElement(transcriptButtonSelector, 20000)
            .then((showTranscriptButton) => {
                // Prüfen, ob der Button schon existiert (Doppelte Buttons vermeiden)
                if (document.getElementById('copy-transcript-button')) return;

                // Copy-Button erstellen
                const copyButton = document.createElement('button');
                copyButton.innerText = 'Copy Transcript';
                copyButton.id = 'copy-transcript-button';
                copyButton.style = 'margin-left: 8px;';
                console.log('Copy Transcript button created:', copyButton);

                // Copy-Button einfügen
                showTranscriptButton.parentNode.insertBefore(copyButton, showTranscriptButton.nextSibling);
                console.log('Copy Transcript button inserted into the page.');

                // Click-Event für Copy-Button
                copyButton.addEventListener('click', function() {
                    console.log('Copy Transcript button clicked.');
                    showTranscriptButton.click();
                    console.log('Show transcript button clicked programmatically.');
                    const checkTranscriptVisible = setInterval(function() {
                        const transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
                        if (transcriptPanel && transcriptPanel.innerText.trim() !== '') {
                            clearInterval(checkTranscriptVisible);
                            console.log('Transcript panel found and loaded:', transcriptPanel);
                            GM_setClipboard(transcriptPanel.innerText, 'text');
                            console.log('Transcript copied to clipboard.');
                            alert('Transcript copied to clipboard!');
                        } else {
                            console.log('Waiting for transcript panel to load...');
                        }
                    }, 500);
                });
            })
            .catch((err) => {
                console.log('Show transcript button did not appear:', err);
            });
    }

    // Beim Laden der Seite die neue Funktion aufrufen
    window.addEventListener('load', function() {
        console.log('Page loaded. Attempting to insert Copy Transcript button...');
        insertCopyButtonWhenReady();
    });
})();
