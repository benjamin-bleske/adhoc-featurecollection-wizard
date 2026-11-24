# Adhoc-FeatureCollection-Wizard

Wizard, der Schritt für Schritt eine ad-hoc GeoJSON-`FeatureCollection` (Projektbereich) für Wuppertal erzeugt und daraus **drei Styles** für das Geoportal des Digital Twin Wuppertal veröffentlicht.

> **Planungsphase 0** (ein einziger Style `published/style.json`) ist als Git-Tag **`planungsphase-0`** gesichert und in [docs/planungsphase-0.md](docs/planungsphase-0.md) dokumentiert:
> `git checkout planungsphase-0`. Ihr Style bleibt unter
> [style.json @ planungsphase-0](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/planungsphase-0/published/style.json) abrufbar.
> Dieses README beschreibt den Stand **nach** Planungsphase 0.

## Die drei Styles
Aus **einer** FeatureCollection entstehen bei jedem Publishen alle drei, in **einem Git-Commit**. Ein neuer Bereich ersetzt alle drei gemeinsam, sie können nicht auseinanderlaufen.
Sie tragen dieselbe Projektbereich-ID (`pb-…`), verweisen in `layerInfo.links` aufeinander und teilen Geometrie, Lupe und Abrufbereich.

| Style | Datei | Inhalt |
|---|---|---|
| **Projektbereich: Planungsrecht** | `published/planungsrecht.json` | roter gestrichelter Umriss + Dropdown: FNP Hauptnutzungen, WMS Regionalplan NRW, WMS Landesentwicklungsplan NRW, B-Plan-Verfahren (rechtsverbindlich), Landschafts- und Naturschutz |
| **Projektbereich: Fachkonzepte** | `published/fachkonzepte.json` | roter gestrichelter Umriss + Dropdown: Gesamtbewertung der Bodenfunktionen, Eignung dezentrale Wärmeversorgung, Stadtbaumkonzept |
| **Geltungsbereich** | `published/geltungsbereich.json` | gleiche Geometrie wie der Projektbereich, **schwarz** gestrichelt, ohne Fachdaten |
| (Quelle) | `published/projektbereich.geojson` | die gemeinsame Geometrie |

Alle drei haben eine Lupe (`zoomToExtent`) im Layer-Chip. Der Geltungsbereich liegt auf demselben Umriss wie der Projektbereich: zum Vergleich einen der beiden Chips ausblenden.

## Frage 1 – Projektbereich
- **Zeichnen**: Polygon/Rechteck in die Karte zeichnen. Die Infobox zeigt Fläche sowie die berührten Flurstücke.
- **Flurstücke wählen**: ab Zoom 16 Klick auf ein Flurstück wählt/entfernt es (orange Hervorhebung).
- **Infobox**: Gemarkung, Flur, Flurstück(e), Größe („ca.“) und die Fachdaten im Projektbereich.

Datenquelle: ALKIS Flurstücke/Gebäude der Stadt Wuppertal als Vector-Tiles-Service (`https://tiles.cismet.de/alkis/flurstuecke.black.style.json`, Open Data dl-zero-de/2.0), gerendert mit MapLibre GL.
Attribute kommen aus den Tiles, der Gemarkungsname aus der Schlüsseltabelle (aus carma/lagis). Flurstücke an Kachelrändern werden wieder zusammengesetzt und gegen die `bounds`-Angabe geprüft (`geometrie_vollstaendig`).

## Frage 2 – Fachdaten (nach Gruppen)
**Projektbereich: Planungsrecht**
- FNP Hauptnutzungen (`https://tiles.cismet.de/hauptnutzungen/style.json`)
- WMS Regionalplan NRW (`https://www.wms.nrw.de/wms/wms_nw_regionalplan?REQUEST=GetCapabilities&SERVICE=WMS`)
- WMS Landesentwicklungsplan NRW (`https://www.wms.nrw.de/wms/wms_nw_landesentwicklungsplan?REQUEST=GetCapabilities&SERVICE=WMS`)
- B-Plan-Verfahren (rechtsverbindlich) (`https://tiles.cismet.de/bplanverfahren/rechtsverbindlich.style.json`)
- Landschafts- und Naturschutz (`https://tiles.cismet.de/landschaftsundnaturschutz/style.json`)

**Projektbereich: Fachkonzepte**
- Gesamtbewertung der Bodenfunktionen (`https://tiles.cismet.de/bodenfunktion/style.json`)
- Eignung dezentrale Wärmeversorgung (`https://tiles.cismet.de/kwp_dezentral/style.json`)
- Stadtbaumkonzept (`https://tiles.cismet.de/stadtbaumkonzept/style.json`)

Die Zuordnung steht in `js/fachdaten.js` (`group` je Eintrag, `GROUPS`) und ist dort leicht änderbar. Keine Luftbilder.

Die Vektor-Styles werden beim Publishen live von `tiles.cismet.de` geladen und eingebaut. Ein Style kann nur ein Sprite haben: der erste Quell-Style mit Sprite behält seine Symbol-/Beschriftungs-Layer (Planungsrecht: B-Plan-Verfahrensnummern, Fachkonzepte: Baumsymbole), bei weiteren entfallen sie.

### Abrufbereich
Die Fachdaten werden in einem **Quadrat mit gleich langen Seiten** geladen, **mittig um den Projektbereich**, Kantenlänge **3 × längste Seite des Projektbereichs** (`ABRUF_FAKTOR` in `js/fachdaten.js`).
Es ist als blau gestrichelte Linie sichtbar, sobald ein Kartenwerk aktiv ist. Die WMS (Regionalplan, Landesentwicklungsplan) liegen exakt in diesem Quadrat, die Vektor-Ebenen kommen kachelweise und können nicht beschnitten werden.

### Dropdown im Geoportal
Je Style ein Dropdown am Layer-Symbol im Chip: „Nur Projektbereich“ (Standard) oder jedes Kartenwerk einzeln. Ein echter Filter-Button (wie beim Ölberg) ist nicht möglich, weil er nur Vektor-Features filtert, nicht Raster-WMS.

### WMS als ein einziges Bild
Regionalplan und Landesentwicklungsplan zeichnen nur bis ca. 1:8000. Als Kachelquelle würden sie bei Nahzoom leer. Deshalb: **ein einziges GetMap-Bild** für den Abrufbereich (mindestens 4 m pro Pixel).

## Infobox im Geoportal
Klick in den Projektbereich zeigt Gemarkung, Flur, Flurstück(e), Größe und je Style die Fachdaten mit Flächenanteil (bzw. Anzahl):
- **Planungsrecht:** FNP-Hauptnutzungen, rechtsverbindliche B-Pläne, Landschafts-/Naturschutz (aus den Vector-Tiles), Landesentwicklungsplan (aus dem Kartenbild), Regionalplan (ohne Auswertung), dazu Links zu Legende und Capabilities.
- **Fachkonzepte:** Bodenfunktion (Flächenanteil), Eignung dezentrale Wärmeversorgung (Flächenanteil), Stadtbaumkonzept (Anzahl Bäume im Bereich).
- **Geltungsbereich:** Gemarkung, Flur, Flurstück(e), Größe.

Klick auf einen Fachdaten-Layer zeigt dessen eigene Infobox.

### Auswertung der WMS-Rasterdaten
Der WMS Landesentwicklungsplan ist nicht abfragbar (`queryable=0`). Der Wizard holt deshalb das Kartenbild für den Projektbereich und zählt die Pixel je Legendenklasse (Siedlungsraum, Freiraum, Grünzüge, Gebiete für den Schutz der Natur, Oberflächengewässer; die Kartenfarben stimmen exakt mit der Legende überein). Das ist eine **Näherung** (≥ 5 m pro Pixel).
Beim **Regionalplan NRW** gibt es bewusst keine Auswertung: die gerenderten Farben weichen von der Legende ab, darunter liegt eine Topographie-Karte, und der Dienst zeichnet nur ab 1:8000.

## Starten
Statische Seite, kein Build:

    python3 -m http.server 8080   # dann http://localhost:8080

## Publishen und Links ins Geoportal
Im Ergebnisschritt veröffentlicht „Ins Repo publishen“ per GitHub-Token (fine-grained, nur dieses Repo, *Contents: Read and write*, nur im Browser-Tab) **alle Styles in einem Commit** (Git Data API, `js/publish.js`). Die alte `published/style.json` (Planungsphase 0) wird dabei entfernt.
Danach zeigt der Wizard drei **Links mit Commit-SHA** (`raw.githubusercontent.com/…/<sha>/published/<datei>.json`). Diese ins Geoportal ziehen: sie sind unveränderlich und sofort aktuell; danach über das „+“ in „Externe Dienste“ zur Karte hinzufügen.

Links auf den jeweils neuesten Stand (GitHub cached diese `main`-Links bis zu 5 Minuten, ein `?v=…` hilft **nicht**):
- [Projektbereich: Planungsrecht](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/main/published/planungsrecht.json)
- [Projektbereich: Fachkonzepte](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/main/published/fachkonzepte.json)
- [Geltungsbereich](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/main/published/geltungsbereich.json)

Das Geoportal merkt sich Layer aus früheren Sitzungen; beim Testen alte Chips entfernen.

## Erweitern
Neue Fragen = neues Step-Objekt `{id, title, mount, isValid, toFeatures}` in `js/wizard.js` (`STEPS`, vor `ResultStep`). Neue Fachdaten = Eintrag in `CATALOG` in `js/fachdaten.js` (mit `group`) und ggf. in `VEC` in `js/alkis.js` (Auswertung für die Infobox).
