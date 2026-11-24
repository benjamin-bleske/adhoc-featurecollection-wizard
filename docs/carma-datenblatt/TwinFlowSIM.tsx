// ENTWURF (nicht gebaut, nicht in carma getestet): Datenblatt "twinFlowSIM" für das Geoportal.
//
// Einbau: Datei nach
//   libraries/collaboration/carma-wuppertal-collab/wuppertal-collab-submodule/src/secondary-info-modals/TwinFlowSIM.tsx
// kopieren. Der Dateiname bestimmt den Schlüssel: TwinFlowSIM.tsx -> "twinFlowSIM" (siehe secondary-info-modals/index.ts, import.meta.glob).
// Der Style (Planungsphase 1: Ready2hack) liefert dann in der Infobox-Funktion `modal: "twinFlowSIM"` -> das Info-Symbol (i) erscheint.
// Aufbau nach PotenzialflaechenSIM.tsx / VorhabenkarteSIM.tsx (react-bootstrap Modal, Panels, Standard-Footer).
//
// Die Daten (Ressorts, zuständige Stellen, Beiträge, Datenangebot) kommen aus published/twinflow-ressorts.json, die der Wizard bei jedem Publishen schreibt.
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Modal, Accordion } from "react-bootstrap";
import Panel from "react-cismap/commons/Panel";
import { genericSecondaryInfoFooterFactory } from "../commons";
import type { SecondaryInfoFooterProps } from "../commons/genericSecondaryInfoFooterFactory";

const DATA_URL =
  "https://benjamin-bleske.github.io/adhoc-featurecollection-wizard/published/twinflow-ressorts.json";

type Dataset = { titel: string; slug: string; herausgeber: string; formate?: string[]; lizenz?: string; hinweis?: string };
type Ressort = {
  id: string; name: string; twinflow: string; farbe: string; regel: string;
  stellen: string[]; beitraege: string[]; daten: Dataset[];
};

type Feature = { type?: string; properties?: { name?: string; ressort?: string; ressort_name?: string; lage?: string; farbe?: string } };

type SecondaryInfoModalProps = {
  feature?: Feature;
  setOpen?: (open: boolean) => void;
  Footer?: React.ComponentType<SecondaryInfoFooterProps>;
};

const TwinFlowSIM = ({
  feature = {},
  setOpen = () => {},
  Footer = genericSecondaryInfoFooterFactory({
    skipTeilzwilling: true,
    applicationName: "Planungsphase 1: Ready2hack",
  }),
}: SecondaryInfoModalProps) => {
  const p = feature.properties ?? {};
  const [ressorts, setRessorts] = useState<Ressort[] | null>(null);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => r.json())
      .then((d) => setRessorts(d.ressorts))
      .catch(() => setRessorts([]));
  }, []);

  const r = ressorts?.find((x) => x.id === p.ressort);
  const close = () => setOpen(false);

  return (
    <Modal
      style={{ zIndex: 2900000000 }}
      dialogClassName="modal-dialog-scrollable"
      size="lg"
      show={true}
      onHide={close}
      keyboard={false}
    >
      <Modal.Header>
        <Modal.Title>
          <FontAwesomeIcon icon={faInfoCircle} />
          {` Datenblatt: ${p.name ?? "TwinFlow"}`}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body key="twinflow.secondaryInfo">
        <div style={{ fontSize: "115%", padding: "10px", paddingTop: 0 }}>
          <div><b>Ressort:</b> {p.ressort} {p.ressort_name}</div>
          <div><b>Lage:</b> {p.lage}</div>
        </div>
        {r === undefined && ressorts === null && <div style={{ padding: 10 }}>Lade Datenangebot …</div>}
        {r && (
          <Accordion style={{ marginBottom: 6 }} defaultActiveKey="beitrag">
            <Panel header="Beitrag zum Planungsprozess" eventKey="beitrag" bsStyle="info">
              <ul>{r.beitraege.map((b) => <li key={b}>{b}</li>)}</ul>
              <div><b>Zuständige Stellen:</b> {r.stellen.join("; ")}</div>
            </Panel>
            <Panel header={`Datenangebot (${r.daten.length})`} eventKey="daten" bsStyle="info">
              <ul>
                {r.daten.map((d) => (
                  <li key={d.slug}>
                    <a href={`https://ckan.open.nrw.de/dataset/${d.slug}`} target="_blank" rel="noreferrer">{d.titel}</a>
                    {" "}<small>({[d.herausgeber, (d.formate ?? []).join(", "), d.lizenz].filter(Boolean).join(" · ")})</small>
                    {d.hinweis && <small> – {d.hinweis}</small>}
                  </li>
                ))}
              </ul>
            </Panel>
          </Accordion>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Footer close={close} version="0.1" />
      </Modal.Footer>
    </Modal>
  );
};

export default TwinFlowSIM;
