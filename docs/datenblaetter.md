# Wie Datenblätter im Geoportal angelegt werden

Untersucht am Beispiel `https://tiles.cismet.de/fluggs_clustering/style.json` und am carma-Quelltext (Commit 320851e3d) sowie am live laufenden Geoportal-Bundle (`digital-twin-wuppertal-live.github.io/geoportal/assets/index-*.js`).

## Der Weg vom Klick zum Datenblatt
1. **Style**: `metadata.carmaConf.layerInfo.keywords` enthält `carmaconf://infoBoxMapping:function createInfoBoxInfo(p) { … }`.
   Die Funktion bekommt die Eigenschaften des angeklickten Features (`p`) und liefert das Infobox-Objekt (`title`, `subtitle`, `additionalInfo`, `header`, `headerColor`, `genericLinks`, …).
2. **`modal`**: Gibt die Funktion `modal: "<schlüssel>"` zurück (bei `fluggs_clustering`: `modal: "fluggsSensorenSIM"`), zeigt die Infobox ein **Info-Symbol (i)**
   (`displaySecondaryInfoAction: !!selectedFeature.properties.modal` in `apps/geoportal/src/app/components/feature-info/LibreFeatureInfoBox.tsx`).
3. **Auflösung**: `additionalInfoFactory(modal)` (`@carma-collab/wuppertal/geoportal`, `sachdatenabfrage-modals/helper/factory.ts`) schlägt den Schlüssel in `SIMComponentDictionary` nach.
4. **Registrierung**: Das Dictionary entsteht in `libraries/collaboration/carma-wuppertal-collab/wuppertal-collab-submodule/src/secondary-info-modals/index.ts`
   per `import.meta.glob("./*.{tsx,jsx,js}")`. Der **Schlüssel ist der Dateiname in camelCase**: `FluggsSensorenSIM.tsx` → `fluggsSensorenSIM`.
5. **Komponente**: Eine React-Komponente (Default-Export) mit den Props `feature`, `setOpen`, optional `Footer`. Sie rendert ein `react-bootstrap`-`Modal`
   mit Titel „Datenblatt: …“, Akkordeon-Panels (`react-cismap/commons/Panel`) und dem Standard-Footer `genericSecondaryInfoFooterFactory(...)`.
   Beispiele: `PotenzialflaechenSIM.tsx`, `VorhabenkarteSIM.tsx`.

## Konsequenz
Ein neues Datenblatt ist **Code**, kein Style: eine neue Datei `…/secondary-info-modals/<Name>SIM.tsx` im carma-Repository, die mit dem Geoportal neu gebaut und deployt werden muss.
Im live laufenden Geoportal sind genau diese 13 Datenblätter einkompiliert: `AlkisSIM`, `BaudenkmaleSIM`, `BodenfeuchteSIM`, `EbikesSIM`, `EMobSIM`, `FahrradzaehlerSIM`,
`FluggsSensorenSIM`, `KlimastationSIM`, `LuftmessstationenSIM`, `PotenzialflaechenSIM`, `UvmSensorenSIM`, `VorhabenkarteSIM`, `XandRideSIM`. **Keines ist generisch** (kein Datenblatt, das beliebige Eigenschaften oder HTML anzeigt).
Ein Style allein kann also kein neues Datenblatt im selben Fenster öffnen.

Zusätzlich gibt es im MapLibre-Engine-Pfad (`libraries/mapping/engines/maplibre/src/utils/featureUtils.ts`) die Eigenschaft `datasheet`: Ist sie gesetzt und ein `DatasheetContext` aktiv,
hängt die Engine einen Link `iconname: "info"`, `tooltip: "Datenblatt"` an die Infobox, der die Datenblatt-Ansicht öffnet. Das ist eine andere (Vollbild-)Variante und nicht der Weg, den `fluggs_clustering` nutzt.

## Was dieses Projekt daraus macht
- **Sofort nutzbar (ohne carma-Änderung):** Der TwinFlow-Punkt liefert in `genericLinks` einen Eintrag `{ iconname: 'info', tooltip: 'Datenblatt', url }`. Die URL zeigt auf eine
  vom Wizard bei jedem Publishen erzeugte HTML-Seite (`published/twinflow-datenblatt.html`, ausgeliefert über GitHub Pages; `raw.githubusercontent.com` würde HTML nur als Text liefern).
  Sie öffnet sich in einem neuen Tab.
- **Eigentliche carma-Variante (vorbereitet, nicht aktiv):** [`docs/carma-datenblatt/TwinFlowSIM.tsx`](carma-datenblatt/TwinFlowSIM.tsx) ist ein Entwurf der Komponente `twinFlowSIM`.
  Sie lädt `published/twinflow-ressorts.json`. Zum Einschalten die Datei nach `…/secondary-info-modals/` kopieren, carma bauen und deployen und in `js/publish.js`
  `USE_SIM = true` setzen (die Infobox liefert dann zusätzlich `modal: 'twinFlowSIM'`). Siehe `docs/carma-datenblatt/README.md`.
