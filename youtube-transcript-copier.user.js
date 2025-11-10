// ==UserScript==
// @name         YouTube Transcript Copier (Fix 2025, v3.5)
// @namespace    http://tampermonkey.net/
// @version      3.5
// @description  Kopiert YouTube-Transkripte zuverlässig, egal ob Kapitel vorhanden sind oder nicht
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log("[YT-Transcript-Copier] Script loaded (v3.5)");

    // Findet den sichtbaren Transcript-Header in allen YouTube-Layouts
    function findTranscriptHeader() {
        // 1. Neues Layout: Kapitel + Transkript → Header liegt unter #secondary-inner
        const newHeader = document.querySelector(
            "#secondary-inner ytd-transcript-renderer h2"
        );
        if (newHeader && newHeader.offsetParent !== null) {
            return newHeader;
        }

        // 2. Klassisches Layout: nur Transkript → Header ist h2#title im Engagement-Panel
        const classicHeader = document.querySelector(
            'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] h2#title'
        );
        if (classicHeader && classicHeader.offsetParent !== null) {
            return classicHeader;
        }

        return null;
    }

    // Warten auf sichtbaren Header
    async function waitForHeader() {
        for (let i = 0; i < 50; i++) {  // 50 × 200 ms = 10 Sekunden
            const header = findTranscriptHeader();
            if (header) return header;
            await new Promise(r => setTimeout(r, 200));
        }
        return null;
    }

    async function insertButton() {
        const headerEl = await waitForHeader();
        if (!headerEl) {
            console.log("[YT-Transcript-Copier] Kein sichtbarer Transkript-Header gefunden.");
            return;
        }

        // Kein Duplicate
        if (document.getElementById("copy-transcript-button")) return;

        // Button bauen
        const btn = document.createElement("button");
        btn.id = "copy-transcript-button";
        btn.textContent = "⭳ Download";
        btn.title = "Transkript kopieren";
        btn.style = `
            margin-left: 8px;
            cursor: pointer;
            font-size: 16px;
            background: transparent;
            border: none;
            color: inherit;
        `;

        // Button einfügen
        headerEl.appendChild(btn);
        console.log("[YT-Transcript-Copier] Button eingefügt.");

        // Klick-Aktion
        btn.addEventListener("click", () => {
            const transcriptPanel =
                document.querySelector("#secondary-inner ytd-transcript-renderer") ||
                document.querySelector(
                    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
                );

            if (!transcriptPanel) {
                alert("Transkript nicht gefunden!");
                return;
            }

            const text = transcriptPanel.innerText.trim();
            GM_setClipboard(text, "text");
            alert("Transkript kopiert!");
        });
    }

    // Reagiert auf YouTube SPA Navigation
    window.addEventListener("yt-navigate-finish", () => {
        setTimeout(insertButton, 500);
    });

    // Initiales Laden
    window.addEventListener("load", () => {
        setTimeout(insertButton, 500);
    });

})();
