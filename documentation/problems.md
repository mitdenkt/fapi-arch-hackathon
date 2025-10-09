# Probleme

## Schreibender Zugriff auf den Table Storage

Issue: https://github.com/mitdenkt/fapi/issues/79

Die fapi schreibt nicht direkt in den Table Storage. Das seres ist ein Proxy für alle schreibenden Anfragen. Das Seres schreibt jedoch nur im Batch in den Table Storage und erst dann wird auf den RabbitMQ das Änderungsevent gepusht. Bis die Änderung in der fapi ankommt dauert locker 10 Sekunden und mehr.

## Unterschiedliche Schemata je Quelle

Unterschiedliche Quellen liefern unterschiedliche Schemata. Das führt zu komischen Seiteneffekten.
Verschiedene problembehaftete Quellen:

- avro-Dateien
- RabbitMQ
- Table Storage

## Großer Zugriff auf die Daten für kleine Anfragen

await https://teams.microsoft.com/l/message/19:8b4e7988-dc7d-4f38-b18b-de816e47346f_9521efb3-fde7-4e69-866b-52e90648cb02@unq.gbl.spaces/1758725941639?context=%7B%22contextType%22%3A%22chat%22%7D

## Hohe Serverkosten

Durch das ständige Caching haben wir monatliche Serverkosten pro Instanz von 1-2 EUR.

await https://teams.microsoft.com/l/message/19:8b4e7988-dc7d-4f38-b18b-de816e47346f_9521efb3-fde7-4e69-866b-52e90648cb02@unq.gbl.spaces/1758726179770?context=%7B%22contextType%22%3A%22chat%22%7D

## Gleichzeitiger API-Zugriff

Es könnte sein, dass sich API-Zugriffe gegenseitig blockieren. Weil die Daten alle in einem Thread gecached sind, werden andere Zugriffe blockiert.
