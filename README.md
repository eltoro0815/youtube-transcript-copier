# YouTube Transcript Copier

Dieses Tampermonkey-Userscript fügt einen Button hinzu, mit dem du das komplette YouTube-Transkript eines Videos mit einem Klick in die Zwischenablage kopieren kannst.

## Installation

1. Installiere die [Tampermonkey-Erweiterung](https://www.tampermonkey.net/) für deinen Browser
2. Klicke auf diesen direkten Installationslink: [YouTube Transcript Copier Script](https://raw.githubusercontent.com/eltoro0815/youtube-transcript-copier/main/youtube-transcript-copier.user.js)
3. Klicke im Tampermonkey-Installationsdialog auf "Installieren"

## Funktionsweise

- Fügt einen "⭳ Download"-Button in der Kopfzeile des Transkript-Panels ein (rechts neben der Überschrift "Transkript")
- Wartet automatisch, bis das Transkript-Panel vorhanden ist (funktioniert auch bei YouTube SPA-Navigation)
- Kopiert das gesamte Transkript mit Zeitstempeln in die Zwischenablage 