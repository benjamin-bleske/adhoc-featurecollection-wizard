# Adhoc-FeatureCollection-Wizard

Wizard, der Schritt für Schritt eine ad-hoc GeoJSON-`FeatureCollection` für Wuppertal erzeugt.

## Frage 1 – Projektbereich
- **Zeichnen**: Polygon/Rechteck in die Karte zeichnen. Die Infobox zeigt Fläche sowie die berührten Flurstücke.
- **Flurstücke wählen**: ab Zoom 16 Klick auf ein Flurstück wählt/entfernt es (orange Hervorhebung).
- **Infobox**: Gemarkung → Flur → Flurstücke (Nummer + Fläche) und Summen.

Datenquelle: ALKIS Flurstücke/Gebäude der Stadt Wuppertal als Mapbox-konformer Vector-Tiles-Service
(`https://tiles.cismet.de/alkis/flurstuecke.black.style.json`, Open Data dl-zero-de/2.0), gerendert mit MapLibre GL.
Attribute (Flur, Zähler, Fläche, Adresse) kommen aus den Tiles, der Gemarkungsname aus der Schlüsseltabelle (aus carma/lagis).
Flurstücke an Kachelrändern sind zerschnitten; der Wizard setzt sie wieder zusammen und prüft sie gegen die `bounds`-Angabe
(`geometrie_vollstaendig` im Ergebnis).

## Starten
Statische Seite, kein Build:

    python3 -m http.server 8080   # dann http://localhost:8080

## Darstellung des Projektbereichs
Dicke rote gestrichelte Umrisslinie wie die Begrenzung eines B-Plans, ohne sichtbare Füllung (die Fläche ist praktisch unsichtbar, damit ein Klick in den Bereich die Infobox öffnet).

## Frage 2 – Fachdaten
Optional als Kartenebenen im Style des Projektbereichs (keine Luftbilder), benannt nach dem Kartenwerk:
- **FNP Hauptnutzungen** (Vektor-Style `https://tiles.cismet.de/hauptnutzungen/style.json`)
- **WMS Regionalplan NRW** (`https://www.wms.nrw.de/wms/wms_nw_regionalplan?REQUEST=GetCapabilities&SERVICE=WMS`)
- **WMS Landesentwicklungsplan NRW** (`https://www.wms.nrw.de/wms/wms_nw_landesentwicklungsplan?REQUEST=GetCapabilities&SERVICE=WMS`)
- **B-Plan-Verfahren (rechtsverbindlich)** (`https://tiles.cismet.de/bplanverfahren/rechtsverbindlich.style.json`)
- **Landschafts- und Naturschutz** (`https://tiles.cismet.de/landschaftsundnaturschutz/style.json`)
- **Gesamtbewertung der Bodenfunktionen** (`https://tiles.cismet.de/bodenfunktion/style.json`)

Die Vektor-Styles werden beim Publishen live von `tiles.cismet.de` geladen und in den Style eingebaut (Beschriftungs-Layer mit Sprite entfallen).
Die WMS (Regionalplan, Landesentwicklungsplan) werden als **ein einziges Bild genau für den Abrufbereich** eingebunden (mind. 4 m pro Pixel).
Die Dienste zeichnen nur bis ca. 1:8000; als Kachelquelle wären sie bei Nahzoom leer geworden. Die Vektor-Ebenen kommen kachelweise und können nicht an das Rechteck beschnitten werden.
Der **Abrufbereich** (Rechteck um den Projektbereich) ist als blau gestrichelte Linie sichtbar, sobald ein Kartenwerk aktiv ist.
Im Geoportal gibt es **ein Dropdown** am Layer-Symbol im Chip: „Nur Projektbereich“ (Standard) oder jedes Kartenwerk einzeln.
Ein echter Filter-Button (wie beim Ölberg) ist nicht möglich, weil er nur Vektor-Features filtert, nicht Raster-WMS.

## Auswertung der WMS-Rasterdaten (Landesentwicklungsplan)
Der WMS Landesentwicklungsplan NRW ist nicht abfragbar (`queryable=0`). Der Wizard holt deshalb beim Publishen das Kartenbild für den Projektbereich
und zählt die Pixel je Legendenklasse (Siedlungsraum, Freiraum, Grünzüge, Gebiete für den Schutz der Natur, Oberflächengewässer; die Kartenfarben stimmen exakt mit der Legende überein).
Das Ergebnis ist eine **Näherung** und steht in der Infobox. Der Dienst zeichnet erst ab ca. 3 m/Pixel, der Wizard rechnet mit mindestens 5 m/Pixel.
Beim **Regionalplan NRW** gibt es bewusst keine Auswertung: die gerenderten Farben weichen von der Legende ab, darunter liegt eine Topographie-Karte, und der Dienst zeichnet nur ab 1:8000.
Die Infobox verweist dort auf Capabilities und Legende.

## Infobox im Geoportal
Klick in den Projektbereich: Gemarkung, Flur, Flurstück(e), Größe, dazu je gewähltem Kartenwerk die **Fachdaten im Projektbereich** mit Flächenanteil
(FNP-Hauptnutzungen, rechtsverbindliche B-Pläne, Landschafts-/Naturschutz, Bodenfunktion aus den Vector-Tiles; Landesentwicklungsplan aus dem Kartenbild; Regionalplan ohne Auswertung) und Links zu Legende und Capabilities der WMS.
Klick auf einen Fachdaten-Layer zeigt dessen eigene Infobox (B-Plan, Schutzgebiet, Bodenfunktion, FNP-Nutzung).

## Erweitern
Neue Fragen = neues Step-Objekt `{id, title, mount, isValid, toFeatures}` in `js/wizard.js` (`STEPS`, vor `ResultStep`).

## Style-Link zum Reinziehen ins Geoportal
Nach jedem Publishen zeigt der Wizard eine **Link mit Commit-SHA** (`…/raw.githubusercontent.com/…/<sha>/published/style.json`).
Diesen Link ins Geoportal ziehen: er ist unveränderlich und sofort aktuell, danach über das „+“ in „Externe Dienste“ zur Karte hinzufügen.

Der Link auf den jeweils neuesten Stand: [Adhoc-Projektbereich-Style](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/main/published/style.json).
Achtung: GitHub cached diesen `main`-Link bis zu 5 Minuten (ein `?v=…` hilft **nicht**), er kann also kurz den vorherigen Stand liefern.

## Publishen
Im Ergebnisschritt schreibt „Ins Repo publishen“ die FeatureCollection per GitHub Contents API als MapLibre-`style.json` (FeatureCollection inline + Fill/Line-Layer + `carmaConf` mit `zoomToExtent`-Lupe; bewusst ohne `instant`, sonst fehlt die Lupe) nach
`published/style.json`. Die Datei muss auf `.json` enden, damit das Geoportal sie per Drag&Drop als Style akzeptiert. Sie wird bei jeder neuen Veröffentlichung **überschrieben**
(abrufbar über die raw-URL im Ergebnisschritt). Nötig: ein fine-grained Token mit *Contents: Read and write*
für dieses Repo – wird nur im Browser-Tab gehalten, nie im Code gespeichert.
