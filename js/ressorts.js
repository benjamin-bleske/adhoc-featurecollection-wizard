// Ressorts der Stadt Wuppertal und ihr Beitrag zum Planungsprozess: Grundlage der TwinFlows und des Datenblatts.
// Zuordnung: TwinFlow NNN gehört zum Ressort NNN (Annahme aus der Reihe TwinFlow 101 / 103).
// Quellen (Stand 2026-11-24): Open-Data-Portal NRW (CKAN, Organisation "Wuppertal": Felder author/maintainer/publisher je Datensatz)
// sowie die Produktnamen der Stadt auf wuppertal.de (Ressort 102). Die Datensatzlinks führen zum Open-Data-Portal.
// Die Texte unter "beitraege" fassen zusammen, was die Datensätze und Leistungen der genannten Stellen für einen Planungsprozess hergeben;
// sie sind keine amtliche Aufgabenbeschreibung.
const Ressorts = (() => {
  const STAND = '2026-11-24';
  const ckan = slug => `https://ckan.open.nrw.de/dataset/${slug}`;
  const LISTE = [
 {
  "id": "101",
  "name": "Stadtentwicklung und Städtebau",
  "farbe": "#e8590c",
  "dx": 0,
  "dy": 0,
  "regel": "Mitte der Ausdehnung des Geltungsbereichs",
  "stellen": [
   "Integrierte Stadtentwicklung und regionale Kooperation",
   "Statistik und Wahlen (101.32)"
  ],
  "beitraege": [
   "Einordnung des Vorhabens in die gesamtstädtische Stadtentwicklung und die Zentralen Versorgungsbereiche (Einzelhandel, Nahversorgung)",
   "Bestandsstatistik zu Gebäuden und Wohnungen als Planungsgrundlage"
  ],
  "daten": [
   {
    "titel": "Zentrale Versorgungsbereiche Wuppertal (2020)",
    "slug": "zentrale-versorgungsbereiche-wuppertal-2020-w",
    "herausgeber": "Integrierte Stadtentwicklung und regionale Kooperation",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Gebäude- und Wohnungsbestand Wuppertal am Jahresende",
    "slug": "gebaude-und-wohnungsbestand-wuppertal-am-jahresende-w",
    "herausgeber": "Statistik und Wahlen",
    "lizenz": "CC BY 4.0",
    "formate": [
     "CSV",
     "HTML"
    ]
   }
  ],
  "twinflow": "TwinFlow 101"
 },
 {
  "id": "102",
  "name": "Vermessung, Katasteramt und Geodaten",
  "farbe": "#7b3fa0",
  "dx": -0.2,
  "dy": 0,
  "regel": "20 % der Ost-West-Ausdehnung westlich der Mitte",
  "stellen": [
   "Liegenschaftskataster (102.2101)",
   "Auszüge Planungsrechtskataster / Planungsrechtskarten (102.13)",
   "Stadtkartographie (102.3201)",
   "Raumbezogene Informationsverarbeitung",
   "Geschäftsstelle Gutachterausschuss (102.01)",
   "Geodatenzentrum"
  ],
  "beitraege": [
   "Amtliche Grundlagen: Flurstücke, Gebäude und tatsächliche Nutzung (ALKIS), Adressen, Straßenverzeichnis, Stadtkarten",
   "Planungsrecht: Bebauungspläne (rechtsverbindlich und laufend), Flächennutzungsplan, Satzungen, Schutzgebiete; Auszüge Planungsrecht",
   "Vermessung: Amtlicher Lageplan, Fortführungsvermessungen, Grenzniederschrift (Leistungen laut wuppertal.de)",
   "Baulasten und Dienstbarkeiten (Auszüge Baulastenverzeichnis)",
   "Grundstücksmarkt: Grundstücksmarktberichte der Geschäftsstelle Gutachterausschuss",
   "Geodatenzentrum als Anlaufstelle für Abgabe und Verkauf von Geodaten"
  ],
  "daten": [
   {
    "titel": "ALKIS-Flurstücke Wuppertal",
    "slug": "alkis-flurstucke-wuppertal-w",
    "herausgeber": "Liegenschaftskataster",
    "lizenz": "dl-de/zero",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "ALKIS-Gebäude Wuppertal",
    "slug": "alkis-gebaude-wuppertal-w",
    "herausgeber": "Liegenschaftskataster",
    "lizenz": "dl-de/zero",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "ALKIS Tatsächliche Nutzung Wuppertal",
    "slug": "alkis-tatsachliche-nutzung-wuppertal-w",
    "herausgeber": "Stadttopografie, Grundlagenkarten",
    "lizenz": "dl-de/zero",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "PDF",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Rechtsverbindliche Bebauungspläne Wuppertal",
    "slug": "rechtsverbindliche-bebauungsplane-wuppertal-w",
    "herausgeber": "Auszüge Planungsrechtskataster",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Laufende Bebauungsplanverfahren Wuppertal",
    "slug": "laufende-bebauungsplanverfahren-wuppertal-w",
    "herausgeber": "Auszüge Planungsrechtskataster",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "XPlanung FNP Wuppertal fortlaufend aktualisiert",
    "slug": "xplanung-fnp-wuppertal-fortlaufend-aktualisiert-w",
    "herausgeber": "Planungsrechtskarten",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GML",
     "XML"
    ]
   },
   {
    "titel": "FNP-Hauptnutzungen Wuppertal",
    "slug": "fnp-hauptnutzungen-wuppertal-w",
    "herausgeber": "Planungsrechtskarten",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Rechtsverbindliche Erhaltungs- und Gestaltungssatzungen Wuppertal",
    "slug": "a0547842-2897-4f32-bdbc-2af4051c748b",
    "herausgeber": "",
    "lizenz": "http://inspire.ec.europa.eu/me",
    "formate": [
     "JSON",
     "KML",
     "ZIP"
    ]
   },
   {
    "titel": "Rechtsverbindliche Innenbereichssatzungen Wuppertal",
    "slug": "rechtsverbindliche-innenbereichssatzungen-wuppertal-w",
    "herausgeber": "Planungsrechtskarten",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Landschaftsschutzgebiete Wuppertal",
    "slug": "landschaftsschutzgebiete-wuppertal-w",
    "herausgeber": "Planungsrechtskarten",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Naturschutzgebiete Wuppertal",
    "slug": "naturschutzgebiete-wuppertal-w",
    "herausgeber": "Planungsrechtskarten",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Georeferenzierte Bestandsadressen Wuppertal",
    "slug": "0c5cbdb0-4884-4e03-8553-8907ce06c6c2",
    "herausgeber": "",
    "lizenz": "dl-de/zero",
    "formate": [
     "JSON",
     "ZIP"
    ]
   },
   {
    "titel": "Straßenverzeichnis Wuppertal",
    "slug": "strassenverzeichnis-wuppertal-w",
    "herausgeber": "Raumbezogene Informationsverarbeitung",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ZIP"
    ]
   },
   {
    "titel": "Grundstücksmarktberichte Wuppertal",
    "slug": "grundstucksmarktberichte-wuppertal-w",
    "herausgeber": "Geschäftsstelle Gutachterausschuss",
    "lizenz": "dl-de/zero",
    "formate": [
     "ATOM",
     "HTML",
     "PDF",
     "XML"
    ]
   },
   {
    "titel": "Wohngebäude-Baujahre Wuppertal",
    "slug": "wohngebaude-baujahre-wuppertal-w",
    "herausgeber": "Raumbezogene Informationsverarbeitung",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "CSV",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Nichtwohngebäude-Baujahre Wuppertal",
    "slug": "nichtwohngebaude-baujahre-wuppertal-w",
    "herausgeber": "Raumbezogene Informationsverarbeitung",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "CSV",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Höhenlinien Wuppertal 2020",
    "slug": "hohenlinien-wuppertal-2020-w",
    "herausgeber": "Geobasis NRW",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML",
     "ZIP"
    ],
    "hinweis": "Herausgeber Geobasis NRW"
   }
  ],
  "twinflow": "TwinFlow 102"
 },
 {
  "id": "103",
  "name": "Grünflächen und Forsten",
  "farbe": "#0b6bcb",
  "dx": 0.2,
  "dy": 0,
  "regel": "20 % der Ost-West-Ausdehnung östlich der Mitte",
  "stellen": [
   "Freiraumentwicklung und Stadtökologie (103.12)",
   "Stadtbaummanagement"
  ],
  "beitraege": [
   "Freiraum im Umfeld: Kleingartenanlagen und Grünflächen",
   "Baumbestand (Standorte und Kronen) für Baumschutz und Pflanzkonzepte"
  ],
  "daten": [
   {
    "titel": "Kleingartenanlagen Wuppertal",
    "slug": "kleingartenanlagen-wuppertal-w",
    "herausgeber": "Freiraumentwicklung und Stadtökologie",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Manuell erfasste Einzelbaum Stammpositionen in einigen Wuppertaler Parkanlagen",
    "slug": "f7e70ca1-6b44-43e7-9aa3-e5f24122c8c9",
    "herausgeber": "",
    "lizenz": "https://creativecommons.org/li",
    "formate": [
     "ZIP"
    ]
   },
   {
    "titel": "Einzelbaum Kronenumringe aus Luftbildern (2021) Wuppertal",
    "slug": "einzelbaum-kronenumringe-aus-luftbildern-2021-wuppertal-w",
    "herausgeber": "EFTAS Fernerkundung Technologietransfer GmbH aus Münster",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GPKG",
     "HTML",
     "XML"
    ],
    "hinweis": "Herausgeber EFTAS, über Geodaten bereitgestellt"
   }
  ],
  "twinflow": "TwinFlow 103"
 },
 {
  "id": "104",
  "name": "Straßen und Verkehr",
  "farbe": "#d4a000",
  "dx": 0,
  "dy": 0.2,
  "regel": "20 % der Nord-Süd-Ausdehnung nördlich der Mitte",
  "stellen": [
   "Straßen und Verkehrsplanung (104.5)",
   "Nahmobilität (104.54)",
   "Öffentliche Beleuchtung (104.25)",
   "Gesamtverkehrsplanung und ÖPNV-Aufgabenträger",
   "Nahverkehrsplanung",
   "Parkausweise und Ausnahmegenehmigung Fahrverbote"
  ],
  "beitraege": [
   "Erschließung und Verkehrsberuhigung: Tempo-30-Zonen",
   "Parken: Bewohnerparkzonen und -bereiche, City-Parkflächen und -zonen für das Stellplatzkonzept",
   "ÖPNV und Multimodalität: Park and Ride, Bike and Ride, Nahverkehrsplan mit Bürgerbeteiligung",
   "Radverkehr: Radabstellanlagen",
   "Öffentliche Beleuchtung: Bestand der Straßenbeleuchtung"
  ],
  "daten": [
   {
    "titel": "Bewohnerparkzonen Wuppertal",
    "slug": "bewohnerparkzonen-wuppertal-w",
    "herausgeber": "Parkausweise und Ausnahmegenehmigung Fahrverbote",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Bewohnerparkbereiche Wuppertal",
    "slug": "bewohnerparkbereiche-wuppertal-w",
    "herausgeber": "Parkausweise und Ausnahmegenehmigung Fahrverbote",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "City-Parkflächen Wuppertal",
    "slug": "city-parkflachen-wuppertal-w",
    "herausgeber": "Parkausweise und Ausnahmegenehmigung Fahrverbote",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "City-Parkzonen Wuppertal",
    "slug": "62d58a38-d3cd-4d43-8624-cf61c0519c9a",
    "herausgeber": "",
    "lizenz": "https://creativecommons.org/li",
    "formate": [
     "JSON",
     "ZIP"
    ]
   },
   {
    "titel": "Park and Ride Anlagen Wuppertal",
    "slug": "park-and-ride-anlagen-wuppertal-w",
    "herausgeber": "Gesamtverkehrsplanung und ÖPNV-Aufgabenträgerschaft",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Bike and Ride Anlagen Wuppertal",
    "slug": "2202a8e0-69c8-40a7-a7f3-310bb87f3b96",
    "herausgeber": "",
    "lizenz": "https://creativecommons.org/li",
    "formate": [
     "JSON",
     "ZIP"
    ]
   },
   {
    "titel": "Radabstellanlagen Wuppertal",
    "slug": "radabstellanlagen-wuppertal-w",
    "herausgeber": "Nahmobilität",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Straßenbeleuchtung 2021",
    "slug": "strassenbeleuchtung-2021-w",
    "herausgeber": "Öffentliche Beleuchtung",
    "lizenz": "CC BY 4.0",
    "formate": [
     "XLSX"
    ]
   },
   {
    "titel": "Tempo-30-Zonen Wuppertal (Flächen)",
    "slug": "tempo-30-zonen-wuppertal-flachen-w",
    "herausgeber": "Straßen und Verkehrsplanung",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Tempo-30-Zonen Wuppertal (Beschilderung)",
    "slug": "tempo-30-zonen-wuppertal-beschilderung-w",
    "herausgeber": "Straßen und Verkehrsplanung",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Bürgerbeteiligung zur Fortschreibung des Wuppertaler Nahverkehrsplans",
    "slug": "burgerbeteiligung-zur-fortschreibung-des-wuppertaler-nahverkehrsplans-w",
    "herausgeber": "Nahverkehrsplanung und ÖPNV-Aufgabenträgerschaft",
    "lizenz": "CC BY 4.0",
    "formate": [
     "XLS"
    ]
   }
  ],
  "twinflow": "TwinFlow 104"
 },
 {
  "id": "105",
  "name": "Bauen und Wohnen",
  "farbe": "#c2255c",
  "dx": 0,
  "dy": -0.2,
  "regel": "20 % der Nord-Süd-Ausdehnung südlich der Mitte",
  "stellen": [
   "Denkmalschutz und Denkmalpflege (105.03)",
   "Bauordnungsbehörde"
  ],
  "beitraege": [
   "Denkmalschutz: Baudenkmäler und Denkmalbereichssatzungen (rechtsverbindlich und nicht rechtsverbindlich) im Umfeld",
   "Bauordnung: Baugenehmigungsverfahren; nach Fertigstellung meldet die Bauordnungsbehörde die Gebäudedaten an Ressort 102 (Gebäudeeinmessung)"
  ],
  "daten": [
   {
    "titel": "Baudenkmäler Wuppertal",
    "slug": "baudenkmaler-wuppertal-w",
    "herausgeber": "Denkmalschutz und Denkmalpflege",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Rechtsverbindliche Denkmalbereichssatzungen Wuppertal",
    "slug": "rechtsverbindliche-denkmalbereichssatzungen-wuppertal-w",
    "herausgeber": "Denkmalschutz und Denkmalpflege",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Nicht rechtsverbindliche Denkmalbereichssatzungen Wuppertal",
    "slug": "nicht-rechtsverbindliche-denkmalbereichssatzungen-wuppertal-w",
    "herausgeber": "Denkmalschutz und Denkmalpflege",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   }
  ],
  "twinflow": "TwinFlow 105"
 },
 {
  "id": "106",
  "name": "Umweltschutz",
  "farbe": "#2b8a3e",
  "dx": 0.4,
  "dy": 0,
  "regel": "40 % der Ost-West-Ausdehnung östlich der Mitte (zwei Schritte von 20 %)",
  "stellen": [
   "Untere Immissionsschutz- und Abfallwirtschaftsbehörde",
   "Landschaftsplanung und -pflege, Untere Naturschutzbehörde"
  ],
  "beitraege": [
   "Immissionsschutz: Luftqualität (NO2-Passivsammler, Luftmessstationen) und Umweltzonen",
   "Landschaft und Naturschutz: rechtsverbindliche Landschaftspläne, Landschafts- und Naturschutzgebiete",
   "Klima und Wasser (thematisch nah, andere Herausgeber): Hochwassergefahrenkarte, Starkregensimulation, Gründach- und Solarkataster"
  ],
  "daten": [
   {
    "titel": "Luftmessstationen Wuppertal (Passivsammler)",
    "slug": "luftmessstationen-wuppertal-passivsammler-w",
    "herausgeber": "Untere Immissionsschutz- und Abfallwirtschaftsbehörde",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "NO2-Jahresmittelwerte Wuppertal (Passivsammler) ab 2008",
    "slug": "no2-jahresmittelwerte-wuppertal-passivsammler-ab-2008-w",
    "herausgeber": "Untere Immissionsschutz- und Abfallwirtschaftsbehörde",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "CSV",
     "HTML",
     "XML"
    ]
   },
   {
    "titel": "NO2-Messdaten Wuppertal (Passivsammler) ab 2008",
    "slug": "no2-messdaten-wuppertal-passivsammler-ab-2008-w",
    "herausgeber": "Untere Immissionsschutz- und Abfallwirtschaftsbehörde",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "CSV",
     "HTML",
     "XML"
    ]
   },
   {
    "titel": "Umweltzonen Wuppertal",
    "slug": "umweltzonen-wuppertal-w",
    "herausgeber": "Untere Immissionsschutz- und Abfallwirtschaftsbehörde",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "HTML",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Rechtsverbindliche Landschaftspläne Wuppertal",
    "slug": "rechtsverbindliche-landschaftsplane-wuppertal-w",
    "herausgeber": "Landschaftsplanung und -pflege, Untere Naturschutzbehörde",
    "lizenz": "CC BY-ND 4.0",
    "formate": [
     "ATOM",
     "GEOJSON",
     "KML",
     "SHP",
     "XML"
    ]
   },
   {
    "titel": "Hochwassergefahrenkarte Wuppertal",
    "slug": "hochwassergefahrenkarte-wuppertal-w",
    "herausgeber": "cismet GmbH",
    "lizenz": "Andere Open Source Lizenz",
    "formate": [
     "ATOM",
     "HTML"
    ],
    "hinweis": "thematisch nah, anderer Herausgeber"
   },
   {
    "titel": "Starkregensimulation Wuppertal SRI 7 (Version 2.1 | 10/2022)",
    "slug": "starkregensimulation-wuppertal-sri-7-version-2-1-10-2022-w",
    "herausgeber": "Dr. Pecher AG",
    "lizenz": "CC BY 4.0",
    "formate": [
     "ATOM",
     "HTML",
     "XML"
    ],
    "hinweis": "thematisch nah, anderer Herausgeber"
   },
   {
    "titel": "Gründachpotenzialkataster Wuppertal 2022",
    "slug": "grundachpotenzialkataster-wuppertal-2022-w",
    "herausgeber": "tetraeder.solar GmbH",
    "lizenz": "CC BY 4.0",
    "formate": [
     "CSV",
     "HTML",
     "PDF",
     "XLSX"
    ],
    "hinweis": "thematisch nah, anderer Herausgeber"
   },
   {
    "titel": "Solarstromkataster Wuppertal 2022",
    "slug": "solarstromkataster-wuppertal-2022-w",
    "herausgeber": "tetraeder.solar gmbh",
    "lizenz": "CC BY 4.0",
    "formate": [
     "CSV",
     "HTML",
     "PDF",
     "XLSX"
    ],
    "hinweis": "thematisch nah, anderer Herausgeber"
   }
  ],
  "twinflow": "TwinFlow 106"
 }
];
  // Lage der TwinFlows relativ zur Ausdehnung des Geltungsbereichs: dx = Anteil der Ost-West-Breite (+ östlich), dy = Anteil der Nord-Süd-Höhe (+ nördlich)
  const byTwinflow = name => LISTE.find(r => r.twinflow === name);
  return { STAND, LISTE, ckan, byTwinflow };
})();
