# Adhoc-FeatureCollection-Wizard

Wizard, der Schritt für Schritt eine ad-hoc GeoJSON-`FeatureCollection` (Projektbereich) für Wuppertal erzeugt und daraus **vier Styles** für das Geoportal des Digital Twin Wuppertal veröffentlicht.

> **Planungsphase 0** (ein einziger Style `published/style.json`) ist als Git-Tag **`planungsphase-0`** gesichert und in [docs/planungsphase-0.md](docs/planungsphase-0.md) dokumentiert:
> `git checkout planungsphase-0`. Ihr Style bleibt unter
> [style.json @ planungsphase-0](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/planungsphase-0/published/style.json) abrufbar.
> **Planungsphase 1** (vier Styles: Planungsphase 0: Planungsrecht und Fachkonzepte, Planungsphase 1: Ready2Use und Ready2hack) ist als Git-Tag **`planungsphase-1`** gesichert und in [docs/planungsphase-1.md](docs/planungsphase-1.md) dokumentiert.
> Dieses README beschreibt den Stand **nach** Planungsphase 0 (inklusive Planungsphase 1). Die beiden Planungsphase-0-Styles heißen jetzt „Planungsphase 0: Planungsrecht/Fachkonzepte“.

## Die vier Styles
Aus **einer** FeatureCollection entstehen bei jedem Publishen alle vier, in **einem Git-Commit**. Ein neuer Bereich ersetzt alle vier gemeinsam, sie können nicht auseinanderlaufen.
Sie tragen dieselbe Projektbereich-ID (`pb-…`) und verweisen in `layerInfo.links` aufeinander.

| Style (Titel im Geoportal) | Datei | Inhalt |
|---|---|---|
| **Planungsphase 0: Planungsrecht** | `published/planungsphase-0-planungsrecht.json` | roter gestrichelter Umriss + Dropdown: FNP Hauptnutzungen, WMS Regionalplan NRW, WMS Landesentwicklungsplan NRW, B-Plan-Verfahren (rechtsverbindlich), Landschafts- und Naturschutz |
| **Planungsphase 0: Fachkonzepte** | `published/planungsphase-0-fachkonzepte.json` | roter gestrichelter Umriss + Dropdown: Gesamtbewertung der Bodenfunktionen, Eignung dezentrale Wärmeversorgung, Stadtbaumkonzept |
| **Planungsphase 1: Ready2Use** | `published/planungsphase-1-ready2use.json` | Geltungsbereich (gleiche Geometrie wie der Projektbereich, **schwarz** gestrichelt) und der daraus berechnete **Entwurf**; Dropdown am Layer-Button: **„Geltungsbereich“** / **„Geltungsbereich und Entwurf“** |
| **Planungsphase 1: Ready2hack** | `published/planungsphase-1-ready2hack.json` | sechs Punkte **TwinFlow 101 bis 106** (je Ressort einer), per **Filter-Button** im Layer-Chip einzeln schaltbar, mit **Datenblatt** |
| (Datenblatt) | `published/twinflow-datenblatt.html`, `published/twinflow-ressorts.json` | Datenblatt zu den TwinFlows (HTML, per GitHub Pages) und seine Daten |
| (Quelle) | `published/projektbereich.geojson`, `published/entwurf.geojson` | die gemeinsame Geometrie und die Geometrie des Entwurfs |

Alle haben eine Lupe (`zoomToExtent`) im Layer-Chip. Ready2Use liegt auf demselben Umriss wie der Projektbereich: zum Vergleich einen der Chips ausblenden.

### Planungsphase 1: Ready2Use – Infobox
Die Infobox zeigt immer den festen Satz „Der TwinFlow Umlauf wurde am 24. November 2026 von Benjamin Bleske gestartet.“ (Konstante `READY2USE_TEXT` in `js/publish.js`), darunter Gemarkung, Flur, Flurstück(e), Größe.

### Planungsphase 1: Ready2Use – Entwurf
Im Style „Planungsphase 1: Ready2Use“ steckt auch der Bebauungsentwurf (zweite Ebene im Dropdown, „Geltungsbereich und Entwurf“). Ein Bebauungsentwurf im Stil eines Reihenhaus-Lageplans (grüne Flächen mit dunkler Hecke, weiße Reihenhaus-Zeilen mit Teilung der Einheiten, graue Privatstraße, Stellplatzreihen, braun gepflasterte Stellplätze, Bäume, Beschriftungen).
Er wird in `js/entwurf.js` **rein rechnerisch** (im Browser beim Publishen, nicht auf einem Server; siehe [docs/architektur.md](docs/architektur.md)) (ohne Zufall, ohne Bildmodell) aus der Geometrie von Ready2Use erzeugt und deshalb bei jedem Publishen im selben Commit mit angepasst:
- Hauptachse per Hauptkomponentenanalyse der Eckpunkte; das Layout liegt auf dem orientierten Rechteck der Fläche.
- Maßstab des Entwurfs (Modul) folgt der Breite, die Zahl der Hausblöcke der Länge; alles wird auf den Geltungsbereich zugeschnitten.
- Häuser nur, wo ein Block (5 bis 1 Einheiten) vollständig in die Fläche passt, sonst keine.
- Ergebnis als Vektor: Stellplätze, Straße, Grünflächen, Häuser (Polygone), Teilungslinien, Bäume, Beschriftungen; Kennzahlen in `metadata.adhoc.entwurf`.
- Bei sehr kleinen (< 6 m) oder stark zerschnittenen Flächen bleibt der Entwurf sparsam oder leer.

### Planungsphase 1: Ready2hack – TwinFlows
Sechs TwinFlows, je Ressort einer (**Annahme: TwinFlow NNN gehört zum Ressort NNN**), nach festen Abstandsregeln relativ zur Ausdehnung des Geltungsbereichs (umschließendes Rechteck, Web-Mercator-Meter; Schritt = 20 %). Die Geometrie folgt Ready2Use (gleiche FeatureCollection, gleicher Commit):

| TwinFlow | Ressort | Lage |
|---|---|---|
| 101 | Stadtentwicklung und Städtebau | Mitte |
| 102 | Vermessung, Katasteramt und Geodaten | 20 % der Ost-West-Breite westlich |
| 103 | Grünflächen und Forsten | 20 % der Ost-West-Breite östlich |
| 104 | Straßen und Verkehr | 20 % der Nord-Süd-Höhe nördlich |
| 105 | Bauen und Wohnen | 20 % der Nord-Süd-Höhe südlich |
| 106 | Umweltschutz | 40 % der Ost-West-Breite östlich |

Die Regeln stehen als `dx`/`dy` in `js/ressorts.js`. Der **Filter-Button** (`carmaConf.filterConfig`, Typ `button`, Modus `or`) schaltet jeden TwinFlow einzeln.

### Datenblatt zu den TwinFlows
Die Infobox jedes TwinFlows zeigt Lage, Beitrag und ein **Info-Symbol (i)**, das das Datenblatt in einem neuen Tab öffnet (`genericLinks`):
`https://benjamin-bleske.github.io/adhoc-featurecollection-wizard/published/twinflow-datenblatt.html#twinflow-104`.
Es entsteht bei jedem Publishen neu (`js/datenblatt.js`) und enthält je Ressort zuständige Stellen, Beitrag zum Planungsprozess und das Datenangebot (Links ins Open-Data-Portal NRW).
- **Wie Datenblätter in carma grundsätzlich angelegt werden** und warum ein neues Datenblatt im Geoportal-Fenster Code in carma braucht: [docs/datenblaetter.md](docs/datenblaetter.md).
- **Entwurf der carma-Komponente** `twinFlowSIM`: [docs/carma-datenblatt/](docs/carma-datenblatt/) (nicht gebaut; `USE_SIM` in `js/publish.js`).
- **Datenangebot und Beitrag der Ressorts 102, 104, 105, 106** (und 101, 103): [docs/ressorts-datenangebot.md](docs/ressorts-datenangebot.md).

## Frage 1 – Projektbereich
- **Zeichnen**: Polygon/Rechteck in die Karte zeichnen. Die Infobox zeigt Fläche sowie die berührten Flurstücke.
- **Flurstücke wählen**: ab Zoom 16 Klick auf ein Flurstück wählt/entfernt es (orange Hervorhebung).
- **Infobox**: Gemarkung, Flur, Flurstück(e), Größe („ca.“) und die Fachdaten im Projektbereich.

Datenquelle: ALKIS Flurstücke/Gebäude der Stadt Wuppertal als Vector-Tiles-Service (`https://tiles.cismet.de/alkis/flurstuecke.black.style.json`, Open Data dl-zero-de/2.0), gerendert mit MapLibre GL.
Attribute kommen aus den Tiles, der Gemarkungsname aus der Schlüsseltabelle (aus carma/lagis). Flurstücke an Kachelrändern werden wieder zusammengesetzt und gegen die `bounds`-Angabe geprüft (`geometrie_vollstaendig`).

## Frage 2 – Fachdaten (nach Gruppen)
**Planungsphase 0: Planungsrecht**
- FNP Hauptnutzungen (`https://tiles.cismet.de/hauptnutzungen/style.json`)
- WMS Regionalplan NRW (`https://www.wms.nrw.de/wms/wms_nw_regionalplan?REQUEST=GetCapabilities&SERVICE=WMS`)
- WMS Landesentwicklungsplan NRW (`https://www.wms.nrw.de/wms/wms_nw_landesentwicklungsplan?REQUEST=GetCapabilities&SERVICE=WMS`)
- B-Plan-Verfahren (rechtsverbindlich) (`https://tiles.cismet.de/bplanverfahren/rechtsverbindlich.style.json`)
- Landschafts- und Naturschutz (`https://tiles.cismet.de/landschaftsundnaturschutz/style.json`)

**Planungsphase 0: Fachkonzepte**
- Gesamtbewertung der Bodenfunktionen (`https://tiles.cismet.de/bodenfunktion/style.json`)
- Eignung dezentrale Wärmeversorgung (`https://tiles.cismet.de/kwp_dezentral/style.json`)
- Stadtbaumkonzept (`https://tiles.cismet.de/stadtbaumkonzept/style.json`)

Die Zuordnung steht in `js/fachdaten.js` (`group` je Eintrag, `GROUPS`) und ist dort leicht änderbar. Keine Luftbilder.

Die Vektor-Styles werden beim Publishen live von `tiles.cismet.de` geladen und eingebaut. Ein Style kann nur ein Sprite haben: der erste Quell-Style mit Sprite behält seine Symbol-/Beschriftungs-Layer (Planungsrecht: B-Plan-Verfahrensnummern, Fachkonzepte: Baumsymbole), bei weiteren entfallen sie.

### Abrufbereich
Die Fachdaten werden in einem **Quadrat mit gleich langen Seiten** geladen, **mittig um den Projektbereich**, Kantenlänge **3 × längste Seite des Projektbereichs** (`ABRUF_FAKTOR` in `js/fachdaten.js`).
Es wird nicht eingezeichnet. Die WMS (Regionalplan, Landesentwicklungsplan) liegen exakt in diesem Quadrat, die Vektor-Ebenen kommen kachelweise und können nicht beschnitten werden.

### Dropdown im Geoportal
Je Style ein Dropdown am Layer-Symbol im Chip: „Nur Projektbereich“ (Standard) oder jedes Kartenwerk einzeln. Ein echter Filter-Button (wie beim Ölberg) ist nicht möglich, weil er nur Vektor-Features filtert, nicht Raster-WMS.

### WMS als ein einziges Bild
Regionalplan und Landesentwicklungsplan zeichnen nur bis ca. 1:8000. Als Kachelquelle würden sie bei Nahzoom leer. Deshalb: **ein einziges GetMap-Bild** für den Abrufbereich (mindestens 4 m pro Pixel).

## Infobox im Geoportal
Klick in den Projektbereich zeigt Gemarkung, Flur, Flurstück(e), Größe und je Style die Fachdaten mit Flächenanteil (bzw. Anzahl):
- **Planungsrecht:** FNP-Hauptnutzungen, rechtsverbindliche B-Pläne, Landschafts-/Naturschutz (aus den Vector-Tiles), Landesentwicklungsplan (aus dem Kartenbild), Regionalplan (ohne Auswertung), dazu Links zu Legende und Capabilities.
- **Fachkonzepte:** Bodenfunktion (Flächenanteil), Eignung dezentrale Wärmeversorgung (Flächenanteil), Stadtbaumkonzept (Anzahl Bäume im Bereich).
- **Ready2Use (Geltungsbereich):** Gemarkung, Flur, Flurstück(e), Größe.
- **Ready2hack:** Name, Lage, Beitrag des Ressorts und Info-Symbol zum Datenblatt.

Klick auf einen Fachdaten-Layer zeigt dessen eigene Infobox.

### Auswertung der WMS-Rasterdaten
Der WMS Landesentwicklungsplan ist nicht abfragbar (`queryable=0`). Der Wizard holt deshalb das Kartenbild für den Projektbereich und zählt die Pixel je Legendenklasse (Siedlungsraum, Freiraum, Grünzüge, Gebiete für den Schutz der Natur, Oberflächengewässer; die Kartenfarben stimmen exakt mit der Legende überein). Das ist eine **Näherung** (≥ 5 m pro Pixel).
Beim **Regionalplan NRW** gibt es bewusst keine Auswertung: die gerenderten Farben weichen von der Legende ab, darunter liegt eine Topographie-Karte, und der Dienst zeichnet nur ab 1:8000.

## Starten
Statische Seite, kein Build:

    python3 -m http.server 8080   # dann http://localhost:8080

## Publishen und Links ins Geoportal
Im Ergebnisschritt veröffentlicht „Ins Repo publishen“ per GitHub-Token (fine-grained, nur dieses Repo, *Contents: Read and write*, nur im Browser-Tab) **alle Styles in einem Commit** (Git Data API, `js/publish.js`). Die alten Dateien (`published/style.json` aus Planungsphase 0 sowie die früheren Namen `planungsrecht.json`, `fachkonzepte.json`, `geltungsbereich.json`) werden dabei entfernt.
Danach zeigt der Wizard die **Links mit Commit-SHA** (`raw.githubusercontent.com/…/<sha>/published/<datei>.json`). Diese ins Geoportal ziehen: sie sind unveränderlich und sofort aktuell; danach über das „+“ in „Externe Dienste“ zur Karte hinzufügen.

Links auf den jeweils neuesten Stand (GitHub cached diese `main`-Links bis zu 5 Minuten, ein `?v=…` hilft **nicht**):
- [Planungsphase 0: Planungsrecht](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/main/published/planungsphase-0-planungsrecht.json)
- [Planungsphase 0: Fachkonzepte](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/main/published/planungsphase-0-fachkonzepte.json)
- [Planungsphase 1: Ready2Use](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/main/published/planungsphase-1-ready2use.json)
- [Planungsphase 1: Ready2hack](https://raw.githubusercontent.com/benjamin-bleske/adhoc-featurecollection-wizard/main/published/planungsphase-1-ready2hack.json)

Das Geoportal merkt sich Layer aus früheren Sitzungen; beim Testen alte Chips entfernen.

## Erweitern
Neue Fragen = neues Step-Objekt `{id, title, mount, isValid, toFeatures}` in `js/wizard.js` (`STEPS`, vor `ResultStep`). Neue Fachdaten = Eintrag in `CATALOG` in `js/fachdaten.js` (mit `group`) und ggf. in `VEC` in `js/alkis.js` (Auswertung für die Infobox).
