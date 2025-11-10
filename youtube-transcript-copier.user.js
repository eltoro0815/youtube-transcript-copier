// ==UserScript==
// @name         YouTube Transcript Copier
// @namespace    http://tampermonkey.net/
// @version      5.3
// @description  Copy YouTube transcripts (button inline right of header)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v5.3 loaded');

    // Finde den Transkript-Header über direkte Suche nach bekannten Labels
    function findTranscriptHeader() {
        const headerSelectors = [
            'h2#title[aria-label="Transkript"]',      // DE: Nur Transkript
            'h2#title[aria-label="Transcript"]',       // EN: Only Transcript
            'h2#title[aria-label="In diesem Video"]',  // DE: Kapitel + Transkript
            'h2#title[aria-label="In this video"]',    // EN: Chapters + Transcript
        ];

        for (const selector of headerSelectors) {
            const header = document.querySelector(selector);
            if (header) {
                // Wenn nicht sichtbar, aber aria-label passt, verwende es trotzdem
                // (kann später sichtbar werden oder ist in einem versteckten Panel)
                if (header.offsetParent !== null || header.getAttribute('aria-label')) {
                    return header;
                }
            }
        }

        return null;
    }

    function insertCopyButton() {
        const header = findTranscriptHeader();
        
        if (!header) {
            console.log('⏳ Transcript header not found yet');
            return false;
        }

        // Prevent duplicate
        if (document.getElementById('copy-transcript-button')) {
            console.log('✅ Button already exists');
            return true;
        }

        // Make header inline-flex to allow button right of text
        // Wichtig: Nur ändern, wenn noch nicht gesetzt, um Konflikte zu vermeiden
        if (!header.style.display || header.style.display === '') {
            header.style.display = 'inline-flex';
        }
        header.style.alignItems = 'center';
        header.style.gap = '8px';

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
            margin-left: 8px;
            padding: 0;
            line-height: 1;
        `;

        header.appendChild(button);
        console.log('✅ Copy button inserted inline right of header');
        console.log('Button element:', button);
        console.log('Button parent:', button.parentElement);
        console.log('Button offsetParent:', button.offsetParent);
        console.log('Button computed style:', window.getComputedStyle(button).display);
        console.log('Header computed style:', window.getComputedStyle(header).display);

        button.addEventListener('click', () => {
            // Suche nach dem Transkript-Panel (verschiedene mögliche Selektoren)
            const transcriptPanel = document.querySelector(
                'ytd-transcript-renderer, ' +
                'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
            );

            if (!transcriptPanel || transcriptPanel.innerText.trim() === '') {
                alert('Transkript ist noch nicht geladen.');
                return;
            }

            GM_setClipboard(transcriptPanel.innerText.trim(), 'text');
            alert('Transkript kopiert!');
        });

        return true;
    }

    // Warte auf Elemente mit MutationObserver für robuste Erkennung
    function waitAndInsertButton() {
        if (insertCopyButton()) {
            console.log('✅ Button inserted on first try');
            return;
        }

        console.log('⏳ Waiting for transcript header to appear...');

        const observer = new MutationObserver(() => {
            if (insertCopyButton()) {
                console.log('✅ Button inserted via MutationObserver');
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-label', 'hidden'] // Beobachte relevante Attribute
        });

        // Timeout nach 15 Sekunden
        setTimeout(() => {
            observer.disconnect();
            console.log('⏱️ Timeout: Stopped waiting for transcript header');
        }, 15000);
    }

    // Initial load
    window.addEventListener('load', () => {
        setTimeout(waitAndInsertButton, 500);
    });

    // SPA navigation
    window.addEventListener('yt-navigate-finish', () => {
        setTimeout(waitAndInsertButton, 500);
    });

})();
