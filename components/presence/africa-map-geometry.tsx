import { geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import countriesTopology from "world-atlas/countries-50m.json";

import { createAfricaProjection } from "@/lib/africa-projection";
import styles from "./africa-presence-map.module.css";

const AFRICAN_COUNTRY_IDS = new Set([
  "012", "024", "072", "108", "120", "132", "140", "148", "174",
  "178", "180", "204", "226", "231", "232", "262", "266", "270",
  "288", "324", "384", "404", "426", "430", "434", "450", "454",
  "466", "478", "480", "504", "508", "516", "562", "566", "624",
  "646", "678", "686", "690", "694", "706", "710", "716", "728",
  "729", "732", "748", "768", "788", "800", "818", "834", "854",
  "894",
]);

export function AfricaMapGeometry() {
  const topology = countriesTopology as unknown as Topology;
  const collection = feature(
    topology,
    topology.objects.countries as GeometryCollection,
  ) as unknown as FeatureCollection<Geometry, { name?: string }>;
  const countries = collection.features.filter((country) =>
    AFRICAN_COUNTRY_IDS.has(String(country.id).padStart(3, "0")),
  );
  const path = geoPath(createAfricaProjection());

  return (
    <g aria-label="Frontières des pays africains">
      {countries.map((country: Feature<Geometry, { name?: string }>) => (
        <path
          className={styles.country}
          d={path(country) ?? undefined}
          key={String(country.id)}
        >
          <title>{country.properties?.name ?? "Pays africain"}</title>
        </path>
      ))}
    </g>
  );
}
