# Adhoc-FeatureCollection-Wizard

Wizard, der Schritt für Schritt eine ad-hoc GeoJSON-`FeatureCollection` für Wuppertal erzeugt.

## Frage 1 – Projektbereich
- **Zeichnen**: Polygon/Rechteck in die Karte zeichnen. Die Infobox zeigt Fläche sowie die berührten Flurstücke.
- **Flurstücke wählen**: ab Zoom 17 werden Flurstücke geladen; Klick wählt/entfernt sie.
- **Infobox**: Gemarkung → Flur → Flurstücke (Nummer + Fläche) und Summen.

Datenquelle: NRW-ALKIS-WFS (vereinfacht), `https://www.wfs.nrw.de/geobasis/wfs_nw_alkis_vereinfacht`, Layer `ave:Flurstueck`.
Flächen sind die amtlichen Flächen aus dem Liegenschaftskataster.

## Starten
Statische Seite, kein Build:

    python3 -m http.server 8080   # dann http://localhost:8080

## Erweitern
Neue Fragen = neues Step-Objekt `{id, title, mount, isValid, toFeatures}` in `js/wizard.js` (`STEPS`, vor `ResultStep`).
