export type PlaceHit = {
  id: string;
  name: string;
  year: string;
  about: string;
  lat: number;
  lon: number;
  distance: number;
  href: string;
};

type WikiGeo = { pageid: number; title: string; lat: number; lon: number; dist: number };
type OsmEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function loadPlaces(lat: number, lon: number): Promise<PlaceHit[]> {
  const [wiki, osm, here] = await Promise.all([
    wikiPlaces(lat, lon).catch(() => [] as PlaceHit[]),
    osmPlaces(lat, lon).catch(() => [] as PlaceHit[]),
    herePlace(lat, lon).catch(() => [] as PlaceHit[]),
  ]);
  const merged = new Map<string, PlaceHit>();
  for (const place of [...here, ...osm, ...wiki]) {
    const key = place.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key) continue;
    const have = merged.get(key);
    if (!have) {
      merged.set(key, place);
      continue;
    }
    merged.set(key, {
      ...have,
      year: have.year || place.year,
      about: have.about.length >= place.about.length ? have.about : place.about,
      href: have.href || place.href,
      distance: Math.min(have.distance, place.distance),
    });
  }
  return [...merged.values()]
    .sort((a, b) => Number(Boolean(b.year)) - Number(Boolean(a.year)) || a.distance - b.distance)
    .slice(0, 16);
}

export function aimPlace(places: PlaceHit[], lat: number, lon: number, heading: number | null) {
  if (!places.length) return null;
  const ranked = places.map((place) => {
    const face = bearing(lat, lon, place.lat, place.lon);
    let delta = heading == null ? 0 : Math.abs(face - heading);
    if (delta > 180) delta = 360 - delta;
    const building = /build|house|church|mill|hall|station|bridge|warehouse|tower|court|hotel|theatre|theater|school|bank|heritage|historic|chapel|cathedral|fort|castle|barn|facade/i.test(
      `${place.name} ${place.about}`,
    );
    return { place, delta, building };
  });
  if (heading == null) {
    return ranked.sort((a, b) => Number(b.building) - Number(a.building) || a.place.distance - b.place.distance)[0]?.place ?? null;
  }
  const ahead = ranked.filter((item) => item.delta < 55);
  const pool = ahead.length ? ahead : ranked;
  return pool.sort((a, b) => Number(b.building) - Number(a.building) || a.delta - b.delta || a.place.distance - b.place.distance)[0]?.place ?? null;
}

async function wikiPlaces(lat: number, lon: number): Promise<PlaceHit[]> {
  const geoUrl = `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&list=geosearch&gscoord=${lat}|${lon}&gsradius=900&gslimit=12`;
  const geo = (await getJson(geoUrl)) as { query?: { geosearch?: WikiGeo[] } };
  const hits = (geo.query?.geosearch ?? []).filter((item) => !/^list of /i.test(item.title));
  if (!hits.length) return [];
  const ids = hits.map((item) => item.pageid).join("|");
  const infoUrl = `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=1&explaintext=1&exchars=480&pageids=${ids}`;
  const info = (await getJson(infoUrl)) as { query?: { pages?: Record<string, { pageid: number; title: string; extract?: string }> } };
  const pages = info.query?.pages ?? {};
  return hits.map((hit) => {
    const about = (pages[String(hit.pageid)]?.extract ?? "").replace(/\s+/g, " ").trim();
    return {
      id: `wiki-${hit.pageid}`,
      name: hit.title,
      year: yearFrom(about),
      about,
      lat: hit.lat,
      lon: hit.lon,
      distance: hit.dist,
      href: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g, "_"))}`,
    };
  });
}

async function osmPlaces(lat: number, lon: number): Promise<PlaceHit[]> {
  const query = `[out:json][timeout:8];(nwr["name"]["historic"](around:450,${lat},${lon});nwr["name"]["building"](around:280,${lat},${lon}););out center tags 18;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(14000),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { elements?: OsmEl[] };
  return (json.elements ?? []).flatMap((el) => {
    const tags = el.tags ?? {};
    const name = tags.name;
    const point = el.lat != null ? { lat: el.lat, lon: el.lon ?? lon } : el.center;
    if (!name || !point) return [];
    const year = (tags.start_date ?? "").match(/\d{4}/)?.[0] ?? "";
    const kind = tags.historic || tags.building || "place";
    const about = tags.description || `${name} is recorded here as ${kind}${year ? `, dated ${year}` : ""}.`;
    return [
      {
        id: `osm-${el.type}-${el.id}`,
        name,
        year,
        about,
        lat: point.lat,
        lon: point.lon ?? lon,
        distance: haversine(lat, lon, point.lat, point.lon ?? lon),
        href: "",
      },
    ];
  });
}

async function herePlace(lat: number, lon: number): Promise<PlaceHit[]> {
  const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&limit=8`;
  const json = (await getJson(url)) as {
    features?: {
      geometry?: { coordinates?: [number, number] };
      properties?: { name?: string; street?: string; city?: string; osm_value?: string; osm_key?: string };
    }[];
  };
  return (json.features ?? []).flatMap((feature, index) => {
    const props = feature.properties ?? {};
    const name = props.name || props.street;
    const coords = feature.geometry?.coordinates;
    if (!name || !coords) return [];
    const [placeLon, placeLat] = coords;
    const kind = props.osm_value || props.osm_key || "place";
    return [
      {
        id: `here-${index}-${name}`,
        name,
        year: "",
        about: props.city ? `${name} · ${props.city}. Recorded as ${kind}.` : `${name} is the nearest named place.`,
        lat: placeLat,
        lon: placeLon,
        distance: haversine(lat, lon, placeLat, placeLon),
        href: "",
      },
    ];
  });
}

function yearFrom(text: string) {
  const built = text.match(/\b(?:built|completed|opened|constructed|erected|founded|established|designed|dated)\s+(?:in\s+)?(\d{4})\b/i);
  if (built?.[1]) return built[1];
  return text.match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/)?.[1] ?? "";
}

function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function placeBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  return bearing(lat1, lon1, lat2, lon2);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dφ = ((lat2 - lat1) * Math.PI) / 180;
  const dλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

async function getJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
