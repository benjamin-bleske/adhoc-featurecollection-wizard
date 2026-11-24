# Vorschlag: Die vier Styles zu einem übergeordneten Layer zusammenfassen

Stand 2026-11-24. Analyse des carma-Repos (`raw/carma`, Commit 320851e3d). Das ist ein Vorschlag, umgesetzt ist er nicht.

## Ausgangslage

Der Wizard liefert vier Styles aus einem Projektbereich:

| Style | Inhalt | Eigenheiten |
|---|---|---|
| Planungsphase 0: Planungsrecht | WMS/Vektor-Auszüge FNP, Regionalplan, LEP, B-Plan, Landschaft | `dynamicStyling` (Liste), Infobox |
| Planungsphase 0: Fachkonzepte | Boden, Kleinwindkraft/Solar, Stadtbaum | `dynamicStyling`, Infobox |
| Planungsphase 1: Ready2Use | Geltungsbereich + Entwurf | Dropdown "Geltungsbereich" / "… und Entwurf" |
| Planungsphase 1: Ready2hack | TwinFlow-Punkte 101–106 | `filterConfig`, Datenblatt-Link |

## Was carma kann

1. **Ein Style hat genau eine Konfiguration.** `metadata.carmaConf` gilt pro Style: eine Sprite- und Glyph-Quelle, ein `infoBoxMapping`, ein `dynamicStyling` (nur die erste Liste wird als Dropdown am Chip gezeigt), ein `filterConfig`. Mehrere fachlich getrennte Dropdowns in einem Style sind deshalb nicht möglich.
2. **Layer-Gruppen existieren im Layer-Stack** (`LayerGroup` in `libraries/mapping/layers/src/lib/contracts/carma-layers.d.ts`, `isLayerGroup`). Eine Gruppe hat Titel, `groupInfo` (Legende, Metatext, Links), `tools` und `layers: Layer[]`. Sie entsteht in carma bisher über Workflow-Karten (`workflowLayers` → `applyWorkflowLayerGroup` in `apps/geoportal/src/app/components/nav-items/resource-layer-updater.ts`) und über gespeicherte Kollektionen (`applyCollectionLayer`), nicht über eine Style-URL.
3. **Fachzwilling-Routen** (`apps/geoportal/src/app/constants/fachzwillinge/*.ts`) können über `additionalLayers` Gruppen mit mehreren `styleUrl`-Einträgen vorgeben (Beispiel `projectionMapping.ts`: Gruppe "Projection Mapping" mit mehreren Style-URLs). Das ist Code im carma-Repo und braucht ein Deployment.
4. **Per URL-Drag** (unser heutiger Weg) kommt genau ein Style pro Drag in den Stack. Eine Gruppe lässt sich so nicht erzeugen.

## Optionen

**A. Ein einziger Style mit allen Layern (Master-Style).**
Alle Quellen und Layer der vier Styles in einer `style.json`, ein Dropdown "Planungsphase" (`dynamicStyling`: 0 Planungsrecht / 0 Fachkonzepte / 1 Ready2Use / 1 Ready2hack) schaltet über Sichtbarkeit um.
Vorteil: ein Link, nur Wizard-Änderungen, sofort nutzbar.
Nachteile: nur ein Dropdown pro Style, die bisherigen inneren Dropdowns (Fachdaten-Auswahl, Geltungsbereich/Entwurf) würden verschachtelt und müssten zu einer Liste von Kombinationen werden. Ein `infoBoxMapping` für alles (Dispatch über `carmaInfo.sourceLayer`, das machen wir in Ready2Use schon). Ein `filterConfig` gilt für alle Layer, `layerPattern` (`r2h-`) trennt das sauber. Die vier Chips würden zu einem Chip verschmelzen, die getrennte Ein/Aus-Schaltung geht verloren.

**B. Vier Styles bleiben, ein Index-Link bündelt sie (empfohlen, ohne carma-Änderung).**
Der Wizard erzeugt zusätzlich `published/planungsphase.html` (GitHub Pages) mit den vier Drag-Links in der Reihenfolge der Phasen, einem Button "Alle vier öffnen" und einer Kurzbeschreibung. Die Styles behalten ihre Chips, Filter und Dropdowns.
Nachteil: kein echter Aggregat-Layer im Stack.

**C. Layer-Gruppe über Fachzwilling-Route oder Workflow-Karte (empfohlen als Ziel).**
In carma wird eine Gruppe "Planungsphasen" angelegt, die die vier Style-URLs (als Commit-SHA-URLs oder stabile Pages-URLs) als `layers` enthält. Zwei Wege:
  1. Fachzwilling-Route `additionalLayers: [{ Title: 'Planungsphasen', layers: [{styleUrl: …}, …] }]` nach dem Muster von `projectionMapping.ts`.
  2. Workflow-Karte mit `layers: [...]` (`WorkflowDefinition.layers` → `workflowLayers`), die per Klick die Gruppe in den Stack legt und per zweitem Klick entfernt. Die Karte kann `legend`, `metaDataText` und `links` (Datenblatt, Wiki) tragen.
Vorteil: eine Gruppe mit Titel und Unterlayern, ein gemeinsames Ein/Aus. Nachteil: Änderung und Deployment im carma-Repo; die Styles müssen unter fester URL erreichbar sein (der Projektbereich wechselt dann nur durch Ersetzen der Dateien).

**D. Generischer Gruppen-Eintrag im Style (Erweiterung von carma).**
Ein neuer Schlüssel `carmaConf.layerGroup = { title, members: [styleUrl, …] }`, den carma beim Laden auflöst und als `LayerGroup` in den Stack legt. So würde ein einziger Drag-Link die ganze Gruppe liefern. Nachteil: nicht vorhanden, nur mit Änderung im carma-Layer-Parser.

## Empfehlung (Weg)

1. **Jetzt:** Option B im Wizard (Index-Seite mit den vier Links) und die Dateinamen stabil lassen. Aufwand klein, kein carma-Eingriff.
2. **Als Ziel mit dem carma-Team:** Option C.2 (Workflow-Karte "Planungsphasen" mit den vier Style-URLs), weil sie genau den Mechanismus nutzt, der für Gruppen schon existiert, inklusive Entfernen der ganzen Gruppe. Voraussetzung sind stabile Style-URLs; Commit-SHA-URLs ändern sich bei jedem Publish, daher stabile Pages-URLs (`published/…json` über GitHub Pages) verwenden.
3. **Optional später:** Option D, damit ein einziger Drag-Link genügt. Das ist eine Produktentscheidung im carma-Repo.

Option A empfehlen wir nicht, solange die Teil-Styles eigene Dropdowns und Filter brauchen: Das ist in carma pro Style nur einmal vorgesehen.

## Offene Punkte

- Ob Style-URLs in `additionalLayers`/Workflow-Karten von GitHub Pages (CORS) geladen werden dürfen, ist nicht getestet. Die raw.githubusercontent.com-URLs funktionieren per Drag.
- Wie das Geoportal die Reihenfolge der Gruppenmitglieder im Stack setzt, wurde im Code nicht verifiziert.
