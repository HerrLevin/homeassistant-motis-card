# Motis Departures Card

A small Lovelace custom card that displays the next departures from the Motis integration with route colors.

Installation (HACS)

1. Add this repository to HACS as a custom repository (category: Frontend).
2. Install `Motis Departures Card` from HACS.
3. Add the resource is automatically added by HACS. Confirm under `Configuration > Dashboards > Resources`.

Manual usage

If you don't use HACS, copy `motis-departures-card.js` into `/config/www/motis-departures-card/` and add `/local/motis-departures-card/motis-departures-card.js` as a resource.

Example Lovelace card

type: 'custom:motis-departures-card'
title: 'Departures from Hbf'
entities:
  - sensor.motis_next_departure_station1
  - sensor.motis_second_departure_station1
  - sensor.motis_third_departure_station1


