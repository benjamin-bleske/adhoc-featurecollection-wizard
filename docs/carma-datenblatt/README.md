# TwinFlowSIM: Datenblatt als carma-Komponente (Entwurf)

`TwinFlowSIM.tsx` ist der Entwurf der React-Komponente, die das Datenblatt der TwinFlows **im Geoportal-Fenster** öffnet (wie `FluggsSensorenSIM` bei `fluggs_clustering`).
**Status: nicht gebaut und nicht getestet**, weil die Komponente in das carma-Repository und in dessen Deployment gehört, auf die dieses Projekt keinen Zugriff hat (`raw/carma` ist schreibgeschützt).

## Einschalten
1. `TwinFlowSIM.tsx` nach `libraries/collaboration/carma-wuppertal-collab/wuppertal-collab-submodule/src/secondary-info-modals/` kopieren (die Datei wird per `import.meta.glob` automatisch registriert, Schlüssel `twinFlowSIM`).
2. Props und Footer gegen die aktuelle Fassung von `genericSecondaryInfoFooterFactory` prüfen (Aufruf `<Footer close=… version=… />` ist aus den Nachbarkomponenten abgeleitet).
3. carma bauen und deployen.
4. In `js/publish.js` `USE_SIM = true` setzen und neu publishen: Die Infobox der TwinFlows liefert dann zusätzlich `modal: 'twinFlowSIM'`, das Info-Symbol (i) öffnet das Datenblatt im Geoportal.
   Bis dahin bleibt es bei `false`, weil ein unbekannter `modal`-Schlüssel nur ein wirkungsloses Symbol erzeugen würde.

Die Komponente lädt ihre Daten aus `published/twinflow-ressorts.json` (vom Wizard bei jedem Publishen geschrieben).
