// ==UserScript==
// @name         YouTube Transcript Copier
// @namespace    http://tampermonkey.net/
// @version      2.1.0
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
    function waitForElement(selector, timeout = 10000, root = document) {
        return new Promise((resolve, reject) => {
            const immediate = root.querySelector(selector);
            if (immediate) return resolve(immediate);

            const observer = new MutationObserver(() => {
                const el = root.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(root === document ? document.body : root, { childList: true, subtree: true });

            const timer = setTimeout(() => {
                observer.disconnect();
                reject(new Error('Element not found: ' + selector));
            }, timeout);
        });
    }

    // Versucht mehrere Selektoren nacheinander, gibt beim ersten Treffer zurück
    async function waitForAny(selectors, timeout = 15000, root = document) {
        let lastError;
        for (const selector of selectors) {
            try {
                return await waitForElement(selector, timeout, root);
            } catch (err) {
                lastError = err;
            }
        }
        throw lastError || new Error('None of the selectors matched');
    }

    // Selektoren für die Aktionsleiste (Share/Clip/Download), dort wird der Button robust eingehängt
    const ACTIONS_MOUNT_SELECTORS = [
        'ytd-watch-metadata #actions-inner #top-level-buttons-computed',
        '#actions-inner #top-level-buttons-computed',
        'ytd-watch-metadata #actions #top-level-buttons-computed',
        '#actions #top-level-buttons-computed'
    ];

    // Fallback-Selektoren, um den "Show transcript"-Button (falls vorhanden) anzuklicken
    const TRANSCRIPT_TOGGLE_SELECTORS = [
        '#primary-button ytd-button-renderer yt-button-shape button',
        'ytd-menu-popup-renderer tp-yt-paper-item', // später per Text gefiltert
        'tp-yt-paper-dialog tp-yt-paper-item'
    ];

    // Fügt den Copy-Button ein, sobald die Aktionsleiste verfügbar ist
    async function insertCopyButtonWhenReady() {
        try {
            const mount = await waitForAny(ACTIONS_MOUNT_SELECTORS, 20000);

            // Dedupe: Nur einen Button einfügen
            if (document.getElementById('copy-transcript-button')) return;

            const copyButton = document.createElement('button');
            copyButton.innerText = 'Copy Transcript';
            copyButton.id = 'copy-transcript-button';
            copyButton.style = 'margin-left: 8px;';
            console.log('Copy Transcript button created:', copyButton);

            // In die Aktionsleiste einfügen
            mount.appendChild(copyButton);
            console.log('Copy Transcript button inserted into the page.');

            // Click-Event: Versucht zunächst, das Transcript zu öffnen (falls nötig), dann kopieren
            copyButton.addEventListener('click', async function() {
                console.log('Copy Transcript button clicked.');

                // Falls das Transcript-Panel noch nicht sichtbar ist, versuchen wir es zu öffnen
                let transcriptPanel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
                const panelVisible = transcriptPanel && transcriptPanel.innerText.trim() !== '';
                if (!panelVisible) {
                    // 1) Versuche alten Button zu klicken
                    for (const s of TRANSCRIPT_TOGGLE_SELECTORS) {
                        const candidate = document.querySelector(s);
                        if (!candidate) continue;
                        // Für Menu-Einträge prüfen wir den Text
                        const text = (candidate.innerText || '').toLowerCase();
                        if (s.includes('paper-item') && !text.includes('transcript')) continue;
                        try {
                            candidate.click();
                            console.log('Tried to open transcript via selector:', s);
                            break;
                        } catch (e) {
                            // weiter versuchen
                        }
                    }
                }

                // Warte kurz auf das Laden des Panels und kopiere
                const checkTranscriptVisible = setInterval(function() {
                    const panel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
                    if (panel && panel.innerText.trim() !== '') {
                        clearInterval(checkTranscriptVisible);
                        console.log('Transcript panel found and loaded:', panel);
                        GM_setClipboard(panel.innerText, 'text');
                        console.log('Transcript copied to clipboard.');
                        alert('Transcript copied to clipboard!');
                    } else {
                        console.log('Waiting for transcript panel to load...');
                    }
                }, 500);
            });
        } catch (err) {
            console.log('Actions mount did not appear:', err);
        }
    }

    // Beim Laden und bei YouTube-SPA-Navigationen erneut versuchen
    window.addEventListener('load', function() {
        console.log('Page loaded. Attempting to insert Copy Transcript button...');
        insertCopyButtonWhenReady();
    });
    window.addEventListener('yt-navigate-finish', insertCopyButtonWhenReady, { passive: true });
    window.addEventListener('yt-page-data-updated', insertCopyButtonWhenReady, { passive: true });
})();
