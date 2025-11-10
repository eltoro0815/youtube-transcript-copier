// ==UserScript==
// @name         YouTube Transcript Copier
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Copy YouTube transcripts (button inline right of header)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v5.0 loaded');

    // Robuste Strategie: Finde das Transkript-Panel und dann den zugehörigen Header
    function findTranscriptHeader() {
        // Strategie 1: Suche nach dem Transkript-Panel und finde dann den Header
        const transcriptPanel = document.querySelector(
            'ytd-transcript-renderer, ' +
            'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
        );
        
        if (transcriptPanel) {
            // Fall 1: Panel ist selbst ein ytd-engagement-panel-section-list-renderer
            let headerRenderer = null;
            if (transcriptPanel.matches('ytd-engagement-panel-section-list-renderer')) {
                headerRenderer = transcriptPanel.querySelector('ytd-engagement-panel-title-header-renderer');
            } else {
                // Fall 2: Panel ist innerhalb eines ytd-engagement-panel-section-list-renderer
                headerRenderer = transcriptPanel.closest('ytd-engagement-panel-section-list-renderer')
                    ?.querySelector('ytd-engagement-panel-title-header-renderer');
            }
            
            if (headerRenderer) {
                // Suche nach h2#title im Header
                const h2 = headerRenderer.querySelector('h2#title');
                if (h2) {
                    // Prüfe Sichtbarkeit - wenn nicht sichtbar, versuche trotzdem (kann später sichtbar werden)
                    if (h2.offsetParent !== null || h2.getAttribute('aria-label')) {
                        return h2;
                    }
                }
            }
        }

        // Strategie 2: Direkte Suche nach bekannten Header-Labels (DE + EN)
        // Priorität: "Transkript" zuerst, da das der häufigste Fall ist
        const headerSelectors = [
            'h2#title[aria-label="Transkript"]',      // DE: Nur Transkript (häufigster Fall)
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

        // Strategie 3: Suche nach allen h2#title in Header-Renderern und prüfe Text-Inhalt
        const allHeaders = document.querySelectorAll(
            'ytd-engagement-panel-title-header-renderer h2#title'
        );
        
        for (const header of allHeaders) {
            const titleText = header.querySelector('yt-formatted-string#title-text')?.textContent?.toLowerCase() || '';
            const ariaLabel = header.getAttribute('aria-label')?.toLowerCase() || '';
            
            // Prüfe ob es ein Transkript-Header ist
            if (titleText.includes('transkript') || titleText.includes('transcript') ||
                ariaLabel.includes('transkript') || ariaLabel.includes('transcript') ||
                titleText.includes('in diesem video') || titleText.includes('in this video')) {
                // Wenn sichtbar oder aria-label passt, verwende es
                if (header.offsetParent !== null || ariaLabel) {
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
