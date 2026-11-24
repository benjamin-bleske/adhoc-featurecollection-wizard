# Ressorts der Stadt Wuppertal: Datenangebot und Beitrag zum Planungsprozess

Stand der Auswertung: 2026-11-24.

## Methode
- Die Seiten der Stadt (`wuppertal.de`) sind durch eine Bot-Abfrage (Cloudflare „Just a moment…“) geschützt; sie wurden **nicht umgangen** und nicht gescannt.
- Ausgewertet wurde stattdessen das **Open-Data-Portal NRW** (CKAN-API `https://ckan.open.nrw.de/api/3/action/package_search?q=wuppertal`, 764 Treffer, davon 125 der Organisation „Wuppertal“).
  Je Datensatz tragen die Felder `author`, `maintainer` und `publisher` die zuständige Stelle mit Ressort-Kennzahl, z. B. „Stadt Wuppertal, Nahmobilität (104.54)“.
  **`author` ist die fachlich zuständige Stelle**, `maintainer` ist meist Ressort 102 (Raumbezogene Informationsverarbeitung, Bereitstellung als Geodaten).
- Ergänzt um Produktnamen der Stadt für Ressort 102 (Suchergebnisse auf `wuppertal.de`: Amtlicher Lageplan, Fortführungsvermessungen, Grenzniederschrift, Auszüge Planungsrecht, Baulasten und Dienstbarkeiten, Verkauf Geodatenzentrum).
- Die Ressortnamen stammen aus den Metadaten (Feld `publisher`): 101 Stadtentwicklung und Städtebau, 102 Vermessung, Katasteramt und Geodaten, 103 Grünflächen und Forsten, 104 Straßen und Verkehr, 105 Bauen und Wohnen, 106 Umweltschutz.

Die Beitragstexte fassen zusammen, was die Datensätze und Leistungen der Stellen für einen Planungsprozess hergeben. Sie sind **keine amtliche Aufgabenbeschreibung**.
Die Daten stehen in `js/ressorts.js` und werden im Datenblatt (`published/twinflow-datenblatt.html`) angezeigt.

## Ergebnis nach Ressort (Zahl der ausgewählten Datensätze)
| Ressort | Zuständige Stellen (laut Metadaten) | Beitrag zum Planungsprozess | Datensätze |
|---|---|---|---|
| **101** Stadtentwicklung und Städtebau | Integrierte Stadtentwicklung und regionale Kooperation; Statistik und Wahlen | Einordnung in Stadtentwicklung und Zentrale Versorgungsbereiche; Gebäude- und Wohnungsbestand | 2 |
| **102** Vermessung, Katasteramt und Geodaten | Liegenschaftskataster; Planungsrechtskataster/-karten; Stadtkartographie; Raumbezogene Informationsverarbeitung; Gutachterausschuss; Geodatenzentrum | Amtliche Grundlagen (ALKIS), Planungsrecht (B-Pläne, FNP, Satzungen, Schutzgebiete), Vermessung, Baulasten, Grundstücksmarkt | 17 (von 50 mit Autor 102) |
| **103** Grünflächen und Forsten | Freiraumentwicklung und Stadtökologie; Stadtbaummanagement | Kleingärten, Baumbestand | 3 |
| **104** Straßen und Verkehr | Straßen- und Verkehrsplanung; Nahmobilität; Öffentliche Beleuchtung; Gesamtverkehrsplanung/ÖPNV; Nahverkehrsplanung; Parkausweise | Tempo-30-Zonen, Parken, P+R/B+R, Radabstellanlagen, Straßenbeleuchtung, Nahverkehrsplan | 11 (alle) |
| **105** Bauen und Wohnen | Denkmalschutz und Denkmalpflege; Bauordnungsbehörde | Baudenkmäler, Denkmalbereichssatzungen; Baugenehmigung | 3 (alle) |
| **106** Umweltschutz | Untere Immissionsschutz- und Abfallwirtschaftsbehörde; Landschaftsplanung/Untere Naturschutzbehörde | Luft (NO2, Umweltzonen), Landschaftspläne; thematisch nah: Hochwasser, Starkregen, Gründach, Solar (andere Herausgeber) | 9 (6 eigene, 3+ thematisch nahe) |

Die Einzelliste je Datensatz (Titel, Link, Herausgeber, Formate, Lizenz) steht im Datenblatt.

## Grenzen
- Nicht jeder Datensatz eines Ressorts ist aufgenommen, sondern die für Planungsprozesse naheliegenden. Die vollständige Liste liefert die CKAN-Suche.
- Ressorts, die im Open-Data-Portal wenig oder nichts veröffentlichen (z. B. 105 mit nur Denkmaldaten), tragen im Datenblatt entsprechend wenig Daten bei, auch wenn sie fachlich mehr beitragen (Baugenehmigungen, Baulasten).
- Die Zuordnung „TwinFlow NNN = Ressort NNN“ ist eine Annahme aus der Reihe TwinFlow 101 / 103.
