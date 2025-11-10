// ==UserScript==
// @name         YouTube Transcript Copier (Fix 2025)
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  Kopiert YouTube Transkripte (funktioniert mit/ohne Kapitel)
// @match        https://www.youtube.com/watch*
// @grant        GM_setClipboard
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    console.log("YouTube Transcript Copier 3.4 loaded");

    // Wartet auf ein DOM-Element
    function waitFor(selector, timeout = 15000) {
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
                reject("Timeout waiting for: " + selector);
            }, timeout);
        });
    }

    // Sucht den sichtbaren Transkript-Header (für alle UI-Versionen)
    function findVisibleTranscriptHeader() {
        // Neues Layout: Transkript unter #secondary-inner
        const newHeader = document.querySelector(
            '#secondary-inner ytd-transcript-renderer h2'
        );
        if (newHeader && newHeader.offsetParent !== null) return newHeader;

        // Altes Panel-Layout
        const oldHeader = document.querySelector(
            'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"] ytd-engagement-panel-title-header-renderer'
        );
        if (oldHeader && oldHeader.offsetParent !== null) return oldHeader;

        return null;
    }

    async function insertButton() {
        // Warten bis YouTube die Transkript-UI wirklich geladen hat
        let headerEl = null;
        for (let i = 0; i < 50; i++) {
            headerEl = findVisibleTranscriptHeader();
            if (headerEl) break;
            await new Promise(r => setTimeout(r, 200));
        }

        if (!headerEl) {
            console.log("Transcript header not found yet.");
            return;
        }

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

        headerEl.appendChild(btn);
        console.log("Transcript copy button inserted.");

        btn.addEventListener("click", () => {
            const panel =
                document.querySelector("#secondary-inner ytd-transcript-renderer") ||
                document.querySelector(
                    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
                );

            if (!panel) return alert("Transkript nicht gefunden.");

            const text = panel.innerText.trim();
            GM_setClipboard(text, "text");
            alert("Transkript kopiert!");
        });
    }

    // Auf Änderungen reagieren (SPA Navigation)
    window.addEventListener("yt-navigate-finish", () => {
        setTimeout(insertButton, 500); // kurzes Delay damit Panels existieren
    });

    // Bei initialem Laden
    window.addEventListener("load", () => {
        setTimeout(insertButton, 500);
    });

})();
