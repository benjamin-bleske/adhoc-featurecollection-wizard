# Planungsphase 1

Stand der Konfiguration, auf den du jederzeit zurückkannst: Git-Tag **`planungsphase-1`**.

    git checkout planungsphase-1          # Stand ansehen / zurückkehren
    git checkout main                     # wieder zur aktuellen Entwicklung
    git checkout planungsphase-0          # der Stand davor (ein einziger Style)

Die damals veröffentlichten Styles liegen dauerhaft unter den Tag-URLs
`https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/planungsphase-1/published/<datei>.json`.

## Was Planungsphase 1 gegenüber Planungsphase 0 ändert
Aus dem einen Style von Planungsphase 0 sind **vier Styles** geworden. Sie entstehen bei jedem Publishen aus **derselben FeatureCollection** und werden in **einem Git-Commit** geschrieben (Git Data API), sind also immer synchron.

| Titel im Geoportal | Datei | Inhalt |
|---|---|---|
| **Planungsphase 0: Planungsrecht** | `published/planungsphase-0-planungsrecht.json` | roter gestrichelter Umriss + Dropdown: FNP Hauptnutzungen, WMS Regionalplan NRW, WMS Landesentwicklungsplan NRW, B-Plan-Verfahren (rechtsverbindlich), Landschafts- und Naturschutz |
| **Planungsphase 0: Fachkonzepte** | `published/planungsphase-0-fachkonzepte.json` | roter gestrichelter Umriss + Dropdown: Gesamtbewertung der Bodenfunktionen, Eignung dezentrale Wärmeversorgung, Stadtbaumkonzept |
| **Planungsphase 1: Ready2Use** | `published/planungsphase-1-ready2use.json` | Geltungsbereich: gleiche Geometrie wie der Projektbereich, **schwarz** gestrichelt |
| **Planungsphase 1: Ready2hack** | `published/planungsphase-1-ready2hack.json` | Punkte **TwinFlow 101** und **TwinFlow 103**, per **Filter-Button** schaltbar |
| (Quelle) | `published/projektbereich.geojson` | die gemeinsame Geometrie |

Alle Styles haben eine Lupe (`zoomToExtent`) im Layer-Chip und teilen die Projektbereich-ID (`pb-…`).

## Schritte seit Planungsphase 0 (chronologisch)
1. **Fachdaten erweitert:** Landesentwicklungsplan NRW (WMS), B-Plan-Verfahren (rechtsverbindlich), Landschafts- und Naturschutz, Gesamtbewertung der Bodenfunktionen; später Eignung dezentrale Wärmeversorgung und Stadtbaumkonzept. (Alle Quellen: `tiles.cismet.de` bzw. `wms.nrw.de`; Luftbilder bewusst nicht.)
2. **Aufteilung in zwei Fachdaten-Styles** (Planungsrecht / Fachkonzepte), in `js/fachdaten.js` über `group` je Katalogeintrag steuerbar.
3. **Abrufbereich:** Quadrat mit gleich langen Seiten, mittig um den Projektbereich, Kantenlänge 3 × längste Seite (`ABRUF_FAKTOR`). Die blaue Bounding-Box-Linie ist wieder entfernt, der Bereich wird nicht eingezeichnet.
4. **WMS (Regionalplan, Landesentwicklungsplan) als ein einziges Bild** für den Abrufbereich (mind. 4 m/Pixel), weil die Dienste nur bis ca. 1:8000 zeichnen.
5. **Infobox:** Fachdaten mit Flächenanteil (FNP, B-Plan, Schutzgebiete, Bodenfunktion, Wärmeeignung), Baumanzahl (Stadtbaumkonzept), Landesentwicklungsplan aus dem Kartenbild (Legendenfarben), Regionalplan ohne Auswertung.
6. **Dropdown** je Fachdaten-Style: „Nur Projektbereich“ (Standard) oder ein Kartenwerk einzeln.
7. **Publish in einem Commit** (`Publish.commitFiles`): schreibt alle Styles gemeinsam, entfernt die früheren Dateinamen.
8. **Umbenennungen:** „Planungsphase 0: …“ für die beiden Fachdaten-Styles, „Planungsphase 1: Ready2Use“ für den Geltungsbereich; Dateien entsprechend.
9. **Ready2hack:** zwei Punkte, siehe unten.

## Ready2hack
- **TwinFlow 101**: Mitte der Ausdehnung (umschließendes Rechteck, in Web-Mercator-Metern) des Geltungsbereichs.
- **TwinFlow 103**: gleiche Breite, **20 % der Ost-West-Ausdehnung** östlich davon.
- `carmaConf.filterConfig` (Typ `button`, Modus `or`, `layerPattern: 'r2h-'`): ein Klick auf eine Schaltfläche blendet den jeweiligen Punkt aus; beide starten sichtbar.
- Die Geometrie folgt Ready2Use, weil sie aus derselben FeatureCollection im selben Commit berechnet wird.
- Annahme: „Mitte“ = Mitte des Rechtecks, nicht der Flächenschwerpunkt (bei unregelmäßigen Formen kann der Punkt außerhalb der Fläche liegen).

## Wichtige Erkenntnisse
- Der Filter-Button des Geoportals filtert nur Vektor-Features nach Eigenschaften. Raster-WMS lassen sich damit nicht schalten, deshalb bei den Fachdaten ein Dropdown (`dynamicStyling`, Typ `list`), bei Ready2hack aber ein echter Filter-Button.
- Ein Style kann nur ein Sprite haben: der erste Quell-Style mit Sprite behält seine Symbol-/Beschriftungs-Layer (Planungsrecht: B-Plan-Verfahrensnummern, Fachkonzepte: Baumsymbole).
- `raw.githubusercontent.com` cached pro Pfad bis 5 Min und ignoriert `?v=`; nach dem Publishen die Commit-SHA-URL verwenden.
- Das Geoportal merkt sich Layer aus früheren Sitzungen; beim Testen alte Chips entfernen.
- Ein Klick in ein Loch der Projektfläche öffnet keine Infobox.

## Bekannte Grenzen (Stand Planungsphase 1)
- Getestet nur am Döppersberg (Elberfeld) mit kleinen Auswahlen; große Flurstücke, mehrere Gemarkungen und gezeichnete Flächen mit dem Zeichenwerkzeug nicht ausprobiert.
- Wärmeeignung und Stadtbaumkonzept lieferten im Testbereich keine Treffer; die Anzeige mit echten Werten ist nicht gesehen.
- Vektor-Fachdaten lassen sich nicht auf das Abrufbereich-Quadrat beschneiden; nur die WMS liegen exakt darin.
- Regionalplan: keine Auswertung der Festlegungen.
- Ready2hack: die Beschriftungen der beiden Punkte überlappen bei kleinen Bereichen und hohem Zoom.
- Der Wizard-Button „Ins Repo publishen“ (mit Token) wurde nicht benutzt; veröffentlicht wurde mit demselben Code (`Publish.commitFiles`) über die `gh`-Anmeldung.
