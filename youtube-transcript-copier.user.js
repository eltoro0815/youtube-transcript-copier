// ==UserScript==
// @name         YouTube Transcript Copier
// @namespace    http://tampermonkey.net/
// @version      4.9
// @description  Copy YouTube transcripts (button inline right of header)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v4.9 loaded');

    // Robuste Strategie: Finde das Transkript-Panel und dann den zugehörigen Header
    function findTranscriptHeader() {
        // Strategie 1: Suche nach dem Transkript-Panel und finde dann den Header
        const transcriptPanel = document.querySelector(
            'ytd-transcript-renderer, ' +
            'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
        );
        
        if (transcriptPanel) {
            // Finde den Header relativ zum Panel
            const headerRenderer = transcriptPanel.closest('ytd-engagement-panel-section-list-renderer')
                ?.querySelector('ytd-engagement-panel-title-header-renderer');
            
            if (headerRenderer) {
                // Suche nach h2#title im Header
                const h2 = headerRenderer.querySelector('h2#title');
                if (h2 && h2.offsetParent !== null) return h2;
            }
        }

        // Strategie 2: Direkte Suche nach bekannten Header-Labels (DE + EN)
        const headerSelectors = [
            'h2#title[aria-label="In diesem Video"]',  // DE: Kapitel + Transkript
            'h2#title[aria-label="Transkript"]',      // DE: Nur Transkript
            'h2#title[aria-label="In this video"]',    // EN: Chapters + Transcript
            'h2#title[aria-label="Transcript"]',       // EN: Only Transcript
        ];

        for (const selector of headerSelectors) {
            const header = document.querySelector(selector);
            if (header && header.offsetParent !== null) {
                return header;
            }
        }

        // Strategie 3: Suche nach allen h2#title in Header-Renderern und prüfe Text-Inhalt
        const allHeaders = document.querySelectorAll(
            'ytd-engagement-panel-title-header-renderer h2#title'
        );
        
        for (const header of allHeaders) {
            if (header.offsetParent === null) continue;
            
            const titleText = header.querySelector('yt-formatted-string#title-text')?.textContent?.toLowerCase() || '';
            const ariaLabel = header.getAttribute('aria-label')?.toLowerCase() || '';
            
            // Prüfe ob es ein Transkript-Header ist
            if (titleText.includes('transkript') || titleText.includes('transcript') ||
                ariaLabel.includes('transkript') || ariaLabel.includes('transcript') ||
                titleText.includes('in diesem video') || titleText.includes('in this video')) {
                return header;
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
        header.style.display = 'inline-flex';
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
        `;

        header.appendChild(button);
        console.log('✅ Copy button inserted inline right of header');

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
        if (insertCopyButton()) return;

        const observer = new MutationObserver(() => {
            if (insertCopyButton()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Timeout nach 15 Sekunden
        setTimeout(() => observer.disconnect(), 15000);
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
