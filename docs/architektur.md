# Wo wird gerechnet? Statisch oder dynamisch?

## Kurzantwort
Der Entwurf (und alles andere) wird **einmalig beim Publishen im Browser der Person berechnet, die den Wizard bedient**, und als **statische Datei** ins Git-Repository geschrieben.
Es läuft **kein eigener Server und keine Server-Funktion**. Ein Geoportal-Nutzer sieht immer nur diese fertige Datei: Der Entwurf ändert sich nicht, wenn man in der Karte zoomt oder schaltet,
sondern erst, wenn jemand mit dem Wizard einen **neuen Bereich publisht**.

## Ablauf
| Schritt | Wo läuft das? |
|---|---|
| Wizard (Flurstücke wählen/zeichnen, Fachdaten, Ergebnis) | statische Seite (`index.html` + `js/*.js`), im Browser; hostbar auf GitHub Pages oder lokal (`python3 -m http.server`) |
| Flurstückdaten und Karten | Fremddienste, die der Browser direkt abfragt: `tiles.cismet.de` (ALKIS Vector Tiles, Fachdaten), `wms.nrw.de` (Regionalplan, Landesentwicklungsplan), OpenStreetMap-Kacheln |
| **Entwurf berechnen** (`js/entwurf.js`) | **im Browser**, in Millisekunden (Hauptachse, Raster von Straße/Stellplätzen/Häusern, Zuschnitt mit der Bibliothek `polygon-clipping`) |
| TwinFlows, Datenblatt, Styles bauen (`js/publish.js`, `js/datenblatt.js`) | im Browser |
| Speichern | GitHub-API (`api.github.com`) schreibt alle Dateien in **einem Commit** in `published/` |
| Ausliefern an das Geoportal | `raw.githubusercontent.com` (Styles, GeoJSON) und GitHub Pages (Datenblatt-HTML): reine Dateiauslieferung |
| Anzeigen | das Geoportal lädt den Style und zeichnet ihn mit MapLibre im Browser des Nutzers |

## Ist der Entwurf „dynamisch“?
- **Er richtet sich nach der Ausdehnung:** ja, aber **zum Zeitpunkt des Publishens**. Jede neue FeatureCollection erzeugt einen neuen, zu ihr passenden Entwurf (deterministisch, ohne Zufall: gleiche Geometrie ergibt gleichen Entwurf).
- **Er rechnet sich im Betrieb neu:** nein. Ein Style (`style.json`) kann nichts berechnen; er beschreibt nur Daten und Darstellung. Eine Neuberechnung beim Betrachten bräuchte Code, der zur Laufzeit läuft.

## Geht das mit statischen Seiten?
**Ja, und so ist es gebaut.** Alles, was bei einem Publish gerechnet wird, läuft im Browser; alles, was ausgeliefert wird, sind Dateien. Es braucht nur GitHub (Repository, API, Pages).
Das funktioniert, solange die Berechnung leicht ist (hier Millisekunden bis wenige Sekunden) und der Publish von einer Person ausgelöst wird.

## Wann bräuchte man einen Server?
- Wenn der Entwurf **ohne Wizard** auf Zuruf entstehen soll (z. B. beim Anlegen eines Bereichs in einem anderen System): dann eine kleine Server-Funktion (Cloud Function, GitHub Action) mit demselben Code (`js/entwurf.js` läuft auch unter Node).
- Wenn die Berechnung **aufwendig** wird (echtes Optimierungs- oder Bildmodell): dann Rechenleistung auf einem Server.
- Wenn der Entwurf **live im Geoportal** auf die angezeigte Ausdehnung reagieren soll: dann Code in carma (wie bei den Datenblatt-Komponenten, siehe `docs/datenblaetter.md`).
