export type Sensor = "full" | "apsc" | "m43";

const COC: Record<Sensor, number> = { full: 0.03, apsc: 0.02, m43: 0.015 };

export function circleOfConfusion(sensor: Sensor) {
  return COC[sensor];
}

export function evAtIso(fNumber: number, seconds: number, iso: number) {
  if (seconds <= 0 || fNumber <= 0 || iso <= 0) return 0;
  const ev100 = Math.log2((fNumber * fNumber) / seconds);
  return ev100 - Math.log2(iso / 100);
}

export function secondsFor(fNumber: number, ev: number, iso: number) {
  const ev100 = ev + Math.log2(iso / 100);
  return (fNumber * fNumber) / 2 ** ev100;
}

export function formatShutter(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds >= 1) {
    const rounded = seconds >= 10 ? Math.round(seconds) : Math.round(seconds * 10) / 10;
    return `${rounded}s`;
  }
  const denom = Math.round(1 / seconds);
  return `1/${Math.max(1, denom)}`;
}

export function stopsBetween(a: number, b: number) {
  if (a <= 0 || b <= 0) return 0;
  return Math.log2(b / a);
}

export function depthOfField(focalMm: number, fNumber: number, distanceM: number, sensor: Sensor) {
  const f = Math.max(1, focalMm);
  const N = Math.max(0.5, fNumber);
  const s = Math.max(f + 1, distanceM * 1000);
  const c = COC[sensor];
  const hyper = (f * f) / (N * c) + f;
  const near = (hyper * s) / (hyper + (s - f));
  const far = s >= hyper ? Number.POSITIVE_INFINITY : (hyper * s) / (hyper - (s - f));
  return { hyperMm: hyper, nearMm: near, farMm: far, dofMm: Number.isFinite(far) ? far - near : Number.POSITIVE_INFINITY };
}

export function metres(mm: number) {
  if (!Number.isFinite(mm)) return "∞";
  if (mm >= 10000) return `${(mm / 1000).toFixed(1)} m`;
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`;
  return `${Math.round(mm)} mm`;
}

export function guideAperture(guideNumber: number, distanceM: number, iso: number) {
  if (distanceM <= 0) return 0;
  const gn = guideNumber * Math.sqrt(iso / 100);
  return gn / distanceM;
}

export type SunMark = { hour: number; altitude: number };

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  return Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
}

/** Solar altitude in degrees for a local hour (0–24), latitude degrees, day of year. */
export function solarAltitude(hour: number, latitude: number, doy: number) {
  const decl = 23.44 * Math.sin(((360 / 365) * (doy - 81) * Math.PI) / 180);
  const lat = (latitude * Math.PI) / 180;
  const dec = (decl * Math.PI) / 180;
  const ha = ((hour - 12) * 15 * Math.PI) / 180;
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha);
  return (Math.asin(Math.min(1, Math.max(-1, sinAlt))) * 180) / Math.PI;
}

export function sunDay(date: Date, latitude: number): SunMark[] {
  const doy = dayOfYear(date);
  const marks: SunMark[] = [];
  for (let h = 0; h <= 24; h += 0.25) marks.push({ hour: h, altitude: solarAltitude(h, latitude, doy) });
  return marks;
}

export function crossHour(marks: SunMark[], level: number, rising: boolean) {
  for (let i = 1; i < marks.length; i++) {
    const a = marks[i - 1]!;
    const b = marks[i]!;
    const up = b.altitude >= a.altitude;
    if (rising !== up) continue;
    if ((a.altitude - level) * (b.altitude - level) <= 0) {
      const t = (level - a.altitude) / (b.altitude - a.altitude || 1);
      return a.hour + (b.hour - a.hour) * t;
    }
  }
  return null;
}

export function formatHour(hour: number | null) {
  if (hour == null || !Number.isFinite(hour)) return "—";
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const RATIOS = [
  { id: "3:2", w: 3, h: 2 },
  { id: "4:5", w: 4, h: 5 },
  { id: "1:1", w: 1, h: 1 },
  { id: "16:9", w: 16, h: 9 },
  { id: "5:7", w: 5, h: 7 },
  { id: "4:3", w: 4, h: 3 },
] as const;

export function printNeed(inchesW: number, inchesH: number, dpi: number) {
  return { pxW: Math.round(inchesW * dpi), pxH: Math.round(inchesH * dpi) };
}

export type Job = {
  id: string;
  client: string;
  date: string;
  hours: number;
  rate: number;
  expenses: number;
  tax: number;
  deposit: number;
  note: string;
};

const KEY = "thrives-ledger-v1";

export function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Job[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJobs(jobs: Job[]) {
  localStorage.setItem(KEY, JSON.stringify(jobs));
}

export function jobTotal(job: Job) {
  const net = job.hours * job.rate + job.expenses;
  const tax = net * (job.tax / 100);
  const gross = net + tax;
  const due = gross * (job.deposit / 100);
  return { net, tax, gross, due, balance: gross - due };
}
