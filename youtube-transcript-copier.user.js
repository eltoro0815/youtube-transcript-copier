// ==UserScript==
// @name         YouTube Transcript Copier
// @namespace    http://tampermonkey.net/
// @version      5.6
// @description  Copy YouTube transcripts (button inline right of header)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log('YouTube Transcript Copier v5.6 loaded');

    // Finde den Transkript-Header über direkte Suche nach bekannten Labels
    function findTranscriptHeader() {
        // Priorität: Zuerst nach "In diesem Video" suchen (Kapitel + Transkript)
        // Dann nach "Transkript" (nur Transkript)
        const headerSelectors = [
            'h2#title[aria-label="In diesem Video"]',  // DE: Kapitel + Transkript (höchste Priorität)
            'h2#title[aria-label="In this video"]',    // EN: Chapters + Transcript
            'h2#title[aria-label="Transkript"]',      // DE: Nur Transkript
            'h2#title[aria-label="Transcript"]',       // EN: Only Transcript
        ];

        for (const selector of headerSelectors) {
            const header = document.querySelector(selector);
            if (header) {
                // WICHTIG: Nur sichtbare Header verwenden
                // Prüfe sowohl offsetParent als auch ob das Element im Viewport ist
                const isVisible = header.offsetParent !== null;
                
                if (isVisible) {
                    return header;
                }
            }
        }

        return null;
    }

    function insertCopyButton() {
        const header = findTranscriptHeader();
        
        if (!header) {
            return false;
        }

        // Prevent duplicate
        if (document.getElementById('copy-transcript-button')) {
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
    // Der Observer läuft dauerhaft, um auch auf späte Panel-Öffnungen zu reagieren
    let globalObserver = null;

    function waitAndInsertButton() {
        if (insertCopyButton()) {
            return;
        }

        // Wenn bereits ein Observer läuft, nicht erneut starten
        if (globalObserver) {
            return;
        }

        globalObserver = new MutationObserver(() => {
            insertCopyButton();
            // Observer NICHT disconnecten, damit er auch auf spätere Öffnungen reagiert
        });

        globalObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-label', 'hidden', 'style'] // Beobachte relevante Attribute
        });
    }

    // Initial load
    window.addEventListener('load', () => {
        setTimeout(waitAndInsertButton, 500);
    });

    // SPA navigation - bei Navigation den Button erneut versuchen
    window.addEventListener('yt-navigate-finish', () => {
        // Entferne existierenden Button, falls vorhanden (für neues Video)
        const existingButton = document.getElementById('copy-transcript-button');
        if (existingButton) {
            existingButton.remove();
        }
        setTimeout(waitAndInsertButton, 500);
    });

})();
