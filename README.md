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

## Erweitern
Neue Fragen = neues Step-Objekt `{id, title, mount, isValid, toFeatures}` in `js/wizard.js` (`STEPS`, vor `ResultStep`).

## Publishen
Im Ergebnisschritt schreibt „Ins Repo publishen“ die FeatureCollection per GitHub Contents API als MapLibre-`style.json` (FeatureCollection inline + Fill/Line-Layer + `carmaConf` mit `zoomToExtent`-Lupe; bewusst ohne `instant`, sonst fehlt die Lupe) nach
`published/style.json`. Die Datei muss auf `.json` enden, damit das Geoportal sie per Drag&Drop als Style akzeptiert. Sie wird bei jeder neuen Veröffentlichung **überschrieben**
(abrufbar über die raw-URL im Ergebnisschritt). Nötig: ein fine-grained Token mit *Contents: Read and write*
für dieses Repo – wird nur im Browser-Tab gehalten, nie im Code gespeichert.
