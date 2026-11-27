// Simulierte Diskussionen der Ressorts speziell zur Gewerbepotenzialfläche Blombach-Süd (Datenblatt, Ready2hack).
// Sachstand laut Verwaltung vom 25.03.2024 (Gewerbepotenzialflächen-Kataster, Quartalsberichte zum HP Gewerbeflächen).
// Die Wortbeiträge sind erfunden und keine Aussagen der Ämter; nur die zugrunde liegenden Fakten stammen aus dem Sachstand.
// Je Ressort: `auftakt` (erster Beitrag des eigenen Ressorts) und `diskussion` (Antworten).
const DISKUSSION_BLOMBACH = {
  101: {
    auftakt: 'Blombach-Süd ist mit rund 26 ha direkt an der A 1 unsere bedeutendste gewerbliche Reservefläche. Nur: Im FNP ist bisher allein die mittlere Teilfläche gewerblich, Norden und Süden sind Grünfläche bzw. Landwirtschaft. Entwickeln wir in Stufen oder gehen wir gleich das Ganze an?',
    diskussion: [
      { von: '106', text: 'Bitte nicht so tun, als wäre das Ganze schon entschieden. GIB im Regionalplan-Entwurf ersetzt weder die FNP-Änderung noch die Prüfung von Artenschutz und Kompensation im Norden und Süden.' },
      { von: '102', text: 'Planungsrechtlich liegen außerdem die B-Pläne 748 (1984) und 207 (1988) auf dem Tisch. Wir sollten zuerst klären, was deren Festsetzungen für die Teilflächen noch bedeuten.' },
      { von: '101', text: 'Dann Stufe 1 auf der mittleren Teilfläche vorbereiten und Nord und Süd als Option führen. Die Priorität bleibt „Vorbereitung für spätere Entwicklung treffen“, niemand verspricht hier einen Baustart.' },
      { von: '105', text: 'Einverstanden, aber die Wohnbebauung nebenan muss von Anfang an mit an den Tisch. Sonst diskutieren wir die Stufen später vor vollen Zuschauerrängen.' },
    ],
  },
  102: {
    auftakt: 'Der Knackpunkt ist das Eigentum: Privatpersonen, private Gesellschaften und öffentliche Institutionen. In den Gesprächen 2021 haben die Privaten weder Verkaufs- noch Entwicklungsbereitschaft gezeigt. Ohne Bodenordnung planen wir auf fremdem Grund.',
    diskussion: [
      { von: '101', text: 'Der Sachstand nennt Umlegung und Vorkaufssatzung als Instrumente, die intensiver geprüft werden sollen. Können wir dafür eine Eigentümerkarte je Teilfläche bekommen?' },
      { von: '102', text: 'Intern ja, die gehört aber nicht ins öffentliche Datenblatt. Vorsicht bei der Erwartung: Die Vorkaufssatzung hilft erst, wenn jemand verkauft. Eine Umlegung greift weiter, braucht aber einen langen Atem.' },
      { von: '105', text: 'Dann ist „Verfügbarkeit: nicht kalkulierbar“ wohl noch höflich formuliert.' },
      { von: '101', text: 'Deshalb Flächengedächnis: Jede Gesprächsrunde und jeden Eigentümerwechsel an der Fläche festhalten, damit wir bei einem Gelegenheitsfenster nicht wieder bei null anfangen.' },
    ],
  },
  103: {
    auftakt: 'Rundherum Wald, Grünland und ein Spiel- bzw. Bolzplatz, Teile der Fläche selbst sind Grünfläche oder Landwirtschaft. Wenn hier Gewerbe kommt, will ich vorher wissen, was erhalten bleibt und wo ausgeglichen wird.',
    diskussion: [
      { von: '101', text: 'Ganz ohne Eingriff wird es nicht gehen. Welche Bereiche wären für euch als Puffer unverzichtbar?' },
      { von: '103', text: 'Der Übergang zum Wald und zur Wohnbebauung, außerdem eine Wegeverbindung, die man auch zu Fuß gern nutzt. Der Bolzplatz darf nicht einfach zwischen Lieferzufahrten enden.' },
      { von: '106', text: 'Die Kompensationsflächen bitte jetzt mitsuchen. Wer erst nach dem Entwurf anfängt, findet in der Nähe nichts mehr.' },
      { von: '104', text: 'Puffer ja, aber nicht genau dort, wo die einzige machbare Zufahrt liegen könnte. Lasst uns die Trasse und das Grün auf einem Plan zusammen ansehen.' },
    ],
  },
  104: {
    auftakt: 'Die Lage an der Anschlussstelle Wuppertal-Ronsdorf ist top, der ÖPNV laut Kataster „nicht zufriedenstellend“, und das Gelände ist bewegt. Gute Autobahnnähe allein ist noch keine Erschließung.',
    diskussion: [
      { von: '105', text: 'Die Anwohnenden werden als Erstes fragen, ob der Lkw-Verkehr durch ihre Straße fährt. Was sagen wir denen?' },
      { von: '104', text: 'Ziel ist die direkte Führung zur A 1, nicht durchs Wohngebiet. Die Machbarkeitsstudie von 2013 hat erste Fragen zur Erschließung geklärt, ist aber über zehn Jahre alt. Wir brauchen eine Aktualisierung und die Abstimmung mit der Autobahn GmbH.' },
      { von: '106', text: 'Und bitte nicht nur Straße planen. Mit Bushaltestelle in der Nähe sollte es Takt und sichere Rad- und Fußwege geben, sonst kommt jede Schicht einzeln mit dem Auto.' },
      { von: '104', text: 'Notiert. Das Schlagloch aus der Bestandsaufnahme setzen wir auf die Liste, bevor Baustellenverkehr daraus eine Kraterlandschaft macht.' },
    ],
  },
  105: {
    auftakt: 'Aus den Nachbarschaften erwarte ich Widerstand, wenn wir nur über Hallen und Zufahrten reden. Die angrenzende Wohnbebauung steht ausdrücklich bei den Planungseinschränkungen. Wie halten wir Abstand, Lärm und Höhen verträglich?',
    diskussion: [
      { von: '106', text: 'Über eine Gliederung in der Bauleitplanung: ruhige Nutzungen an den Rand, lärmintensive Richtung Autobahn. Das gehört gutachterlich untersucht.' },
      { von: '101', text: 'Wenn wir den Rand zu stark beschneiden, bleibt von der Reservefläche weniger übrig, als alle im Kopf haben. Bei bewegtem Gelände schrumpfen die nutzbaren Plateaus ohnehin.' },
      { von: '105', text: 'Lieber ehrlich kleiner als später beklagt. Zeigt den Leuten früh Geländeschnitte und ein einfaches 3D-Modell, nicht nur den Plan von oben.' },
      { von: '103', text: 'Dabei bitte die Gründächer und Baumreihen mit darstellen. Und zwar so, wie sie nach fünf Jahren aussehen, nicht nach fünfzig.' },
    ],
  },
  106: {
    auftakt: 'Vor jeder Euphorie: Kompensationspflichten und mögliche Artenschutzansprüche sind offen, die Entwässerung ist bei bewegtem Gelände anspruchsvoll. Gleichzeitig gibt es Interesse, auf dem Standort Solarstrom zu erzeugen. Reden wir darüber auch ernsthaft?',
    diskussion: [
      { von: '101', text: 'Freiflächen-PV auf der bedeutendsten Gewerbereserve? Damit wäre die Fläche auf Jahre gebunden.' },
      { von: '106', text: 'Auf Jahre ungenutzt ist sie womöglich auch so, wenn die Eigentümer nicht mitziehen. Eine befristete Zwischennutzung wäre eine Prüfung wert, vielleicht mit PV später auf den Hallendächern.' },
      { von: '102', text: 'Für eine Zwischennutzung brauchen wir trotzdem das Einverständnis der Eigentümer und eine klare Laufzeit, sonst wird aus „vorübergehend“ ein Dauerzustand.' },
      { von: '104', text: 'Beim Wasser bitte die Studie von 2013 nicht ungeprüft übernehmen. Straßen und Rückhaltung müssen zusammen neu gerechnet werden.' },
    ],
  },
};
