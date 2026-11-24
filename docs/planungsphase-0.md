# Planungsphase 0

Stand der Konfiguration, auf den du jederzeit zurückkannst: Git-Tag **`planungsphase-0`**.

    git checkout planungsphase-0          # Stand ansehen / zurückkehren
    git checkout main                     # wieder zur aktuellen Entwicklung

Der damals veröffentlichte Style liegt dauerhaft unter
`https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/planungsphase-0/published/style.json`
(Tag-URL, unveränderlich).

## Was Planungsphase 0 kann
Ein Wizard (statische Seite, kein Build) erzeugt eine **ein** MapLibre-Style-Datei `published/style.json`, die per Drag&Drop ins Geoportal des Digital Twin Wuppertal geht.

1. **Projektbereich** (Frage 1): Polygon/Rechteck zeichnen **oder** Flurstücke wählen.
   - Flurstücke aus den ALKIS-Vector-Tiles der Stadt Wuppertal (`tiles.cismet.de/alkis/flurstuecke.black.style.json`), gerendert mit MapLibre GL über OSM.
   - Infobox: Gemarkung, Flur, Flurstück(e), Größe („ca.“, auf 100 m² gerundet ab 1.000 m²).
   - Geometrie wird aus den Kachel-Stücken wieder zusammengesetzt und gegen die `bounds`-Angabe geprüft (`geometrie_vollstaendig`).
2. **Fachdaten** (Frage 2), je einzeln wählbar, benannt nach dem Kartenwerk:
   FNP Hauptnutzungen, WMS Regionalplan NRW, WMS Landesentwicklungsplan NRW, B-Plan-Verfahren (rechtsverbindlich),
   Landschafts- und Naturschutz, Gesamtbewertung der Bodenfunktionen. Keine Luftbilder.
3. **Ergebnis**: FeatureCollection anzeigen/kopieren/herunterladen und per GitHub-Token ins Repo **publishen** (überschreibt `published/style.json`).

## Der veröffentlichte Style
- Projektbereich als dicke **rote gestrichelte** Linie, ohne sichtbare Füllung (Fläche praktisch unsichtbar, damit Klicks die Infobox öffnen).
- **Lupe** (`zoomToExtent`) im Layer-Chip. Kein `instant`, sonst verliert das Geoportal die Lupe.
- **Ein Dropdown** im Chip: „Nur Projektbereich“ (Standard) oder je ein Kartenwerk einzeln; Abrufbereich-Rechteck (blau gestrichelt) nur bei aktivem Kartenwerk.
- Vektor-Fachdaten: Styles werden beim Publishen live von `tiles.cismet.de` geladen und eingebaut (Beschriftungs-Layer mit Sprite entfallen).
- WMS (Regionalplan, LEP): ein einziges GetMap-Bild genau für den Abrufbereich (mind. 4 m/Pixel), weil die Dienste nur bis ca. 1:8000 zeichnen.
- **Infobox** im Geoportal: Gemarkung/Flur/Flurstück/Größe + je Kartenwerk die Fachdaten mit Flächenanteil
  (FNP, B-Plan, Schutzgebiete, Bodenfunktion aus den Vector-Tiles; Landesentwicklungsplan aus dem Kartenbild per Legendenfarben; Regionalplan ohne Auswertung).

## Wichtige Entscheidungen und Erkenntnisse
- Gemarkungsname per Schlüsseltabelle aus carma (`lagis/generalConstant.js`), die Tiles liefern nur die Nummer.
- Der Landesentwicklungsplan lässt sich aus dem Kartenbild auswerten (Farben = Legende exakt); der Regionalplan nicht (Farben weichen ab, Topographie-Unterlage).
- WMS Regionalplan und LEP sind nicht abfragbar (`queryable=0`), es gibt keinen WFS.
- Ein Filter-Button (wie beim Ölberg) filtert nur Vektor-Features, nicht Raster-WMS; deshalb ein Dropdown.
- raw.githubusercontent.com cached pro Pfad bis 5 Min und ignoriert `?v=`; nach dem Publishen immer die Commit-SHA-URL verwenden.
- Das Geoportal merkt sich Layer aus früheren Sitzungen; beim Testen alte Chips entfernen.

## Veröffentlichung
- Token: fine-grained, nur dieses Repo, *Contents: Read and write*; nur im Browser-Tab (sessionStorage).
- Publish-Code: `js/publish.js` (GitHub Contents API, eine Datei).

## Bekannte Grenzen (Stand Planungsphase 0)
- Getestet nur am Döppersberg (Elberfeld) mit kleinen Auswahlen; große Flurstücke, mehrere Gemarkungen und gezeichnete Flächen mit dem Zeichenwerkzeug nicht ausprobiert.
- Vektor-Fachdaten lassen sich nicht auf das Abrufbereich-Rechteck beschneiden.
- Regionalplan: keine Auswertung der Festlegungen.
