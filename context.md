# Kontext

## Was ist die fapi

Der Name "fapi" ist eine Wortkreuzung aus "fast" + "api". Die fapi soll das Altsystem "Seres" (.NET) ablösen, ist bisher nur in Teilen produktiv im Einsatz und hat hier und da noch Probleme. Für jeden Frisörsalon (= #mitdenkt-Kunde) wird eine eigene Instanz der fapi hochgefahren und stellt damit das gesamte Backend dar. Verfügbare Funktionen:

- Schichtpläne der Mitarbeiter (Frisöre)
- Berechnung verfügbarer Termine
- Anzeige von Terminen

## Randbedingungen

### Seres

Seres ist die vom Gründer der Firma entwickelte Software und das Altsystem, welches die fapi ablösen soll. Das Seres ist die einzige Anwendung, die im Table Storage schreibt.

### Table Storage

Der Table Storage ist ein persistenter KV-Could-Store von Microsoft. Single-Point-Of-Truth im Unternehmen. Datensätze werden hier nicht verändert, stattdessen werden nur neue Datensätze angelegt und älter Datensätze als veraltet angesehen.

### RabbitMQ

Wenn im Altsystem Änderungen an den Daten passieren, werden die Änderungen auf den RabbitMQ veröffentlich und alle Subscriber werden hierüber synchronisiert.

### Kontextdiagramm

![fapi-context](/imgs/fapi-context.drawio.svg)

## Status Quo der fapi

### Techstack

Die fapi ist eine JavaScript-Anwendung (nicht TypeScript!) und nutzt das Web-Framework Fastify.

### Persistenz der Daten

Alle Daten werden dauerhaft im Cache gehalten; das bedeutet, dass beim Start der Anwendung HashMaps etc. aufgebaut werden, die alle Kundendaten beinhalten (das können mehrere GB pro Instanz sein, die dann dauerhaft im Hauptspeicher gehalten werden, jedoch keine Änderungshistorie wie im Table Storage). Dadurch erhofft man sich Performancevorteile im Betrieb gegenüber einer persistenten Datenbank. Persistent sind die Daten im Table Storage. Beim Start der Anwendung alle Daten aus dem Table Storage zu laden wäre zu teuer - stattdessen nutzt die fapi [avro-Dateien](https://avro.apache.org/), die auf der Festplatte auf dem jeweiligen Server persitiert werden. Änderungen werden in einem 5-Minuten-Intervall auf der Festplatte persistiert.

### Initialisierung der Instanz

Beim Start werden die Avro-Dateien ausgelesen. Lediglich das Delta wird aus dem TableStorage nachgeladen. Das Erreichen des States `READY` dauert in etwas eine Minute, ist aber starkt abhängig von der Datenmenge.

![fapi-init](/imgs/fapi-init.drawio.svg)
