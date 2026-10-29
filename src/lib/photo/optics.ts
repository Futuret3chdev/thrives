import { applyLook } from "@/lib/photo/looks";

export type Lut = "neutral" | "film" | "log" | "portrait";

export type Grade = {
  iso: number;
  shutter: number;
  aperture: number;
  nd: number;
  kelvin: number;
  tint: number;
  lut: Lut;
  bias: number;
  look: string;
};

export type Flags = {
  zebra: boolean;
  zebraAt: number;
  falseColor: boolean;
  clip: boolean;
  peaking: boolean;
  blinkOn: boolean;
  protect: boolean;
  sample: boolean;
  peak: [number, number, number];
};

export type Scopes = {
  luma: number[];
  red: number[];
  green: number[];
  blue: number[];
  wave: number[];
  vector: number[];
  scene: { sky: number; leaf: number; stone: number; skin: number };
};

const COLS = 48;

export function shutterFromAngle(angle: number, fps: number) {
  return angle / 360 / Math.max(fps, 1);
}

export function exposureGain(grade: Grade) {
  const isoStops = Math.log2(grade.iso / 100);
  const shutterStops = Math.log2(Math.max(grade.shutter, 1 / 8000) / (1 / 60));
  const apertureStops = 2 * Math.log2(4 / Math.max(grade.aperture, 0.7));
  return 2 ** (isoStops + shutterStops + apertureStops - grade.nd + grade.bias);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function planck(kelvin: number) {
  const t = kelvin / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(Math.max(t, 1)) - 161.1195681661;
  } else {
    r = 329.698727446 * (t - 60) ** -0.1332047592;
    g = 288.1221695283 * (t - 60) ** -0.0755148492;
  }
  if (t >= 66) b = 255;
  else if (t <= 19) b = 0;
  else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [clamp01(r / 255), clamp01(g / 255), clamp01(b / 255)] as const;
}

export function balance(kelvin: number, tint: number) {
  const now = planck(Math.max(2000, Math.min(11000, kelvin)));
  const ref = planck(5600);
  const tintShift = tint / 180;
  return [
    now[0] / Math.max(ref[0], 0.05) + tintShift,
    now[1] / Math.max(ref[1], 0.05) - tint / 260,
    now[2] / Math.max(ref[2], 0.05) - tintShift,
  ] as const;
}

function lutOf(r: number, g: number, b: number, lut: Lut) {
  if (lut === "log") {
    const curve = (x: number) => Math.log2(Math.max(x, 0) * 10 + 1) / Math.log2(11);
    return [curve(r), curve(g), curve(b)] as const;
  }
  if (lut === "film") {
    const curve = (x: number) => clamp01((x - 0.5) * 1.12 + 0.48);
    return [curve(r * 1.05), curve(g * 0.99), curve(b * 0.92)] as const;
  }
  if (lut === "portrait") {
    return [clamp01(r * 1.06 + 0.03), clamp01(g * 1.02 + 0.02), clamp01(b * 0.95 + 0.015)] as const;
  }
  return [clamp01(r), clamp01(g), clamp01(b)] as const;
}

function falseTone(y: number): [number, number, number] {
  if (y < 0.04) return [0.1, 0.15, 0.55];
  if (y < 0.18) return [0.35, 0.2, 0.55];
  if (y < 0.4) return [0.2, 0.45, 0.28];
  if (y < 0.75) return [y, y, y];
  if (y < 0.92) return [0.75, 0.35, 0.45];
  return [0.85, 0.15, 0.12];
}

function emptyScopes(): Scopes {
  return {
    luma: Array(32).fill(0),
    red: Array(32).fill(0),
    green: Array(32).fill(0),
    blue: Array(32).fill(0),
    wave: Array(COLS).fill(0),
    vector: Array(256).fill(0),
    scene: { sky: 0, leaf: 0, stone: 0, skin: 0 },
  };
}

export function gradeFrame(data: Uint8ClampedArray, width: number, height: number, grade: Grade, flags: Flags): Scopes {
  const gain = exposureGain(grade);
  const [wr, wg, wb] = balance(grade.kelvin, grade.tint);
  const scopes = emptyScopes();
  const waveN = Array(COLS).fill(0);
  let sky = 0;
  let leaf = 0;
  let stone = 0;
  let skin = 0;
  let seen = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let r = (data[i]! / 255) * gain * wr;
      let g = (data[i + 1]! / 255) * gain * wg;
      let b = (data[i + 2]! / 255) * gain * wb;
      const lit = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (flags.protect) {
        if (b > r + 0.05 && b > g && b > 0.35 && lit > 0.55) {
          r *= 0.9;
          g *= 0.9;
          b *= 0.86;
        } else if (r > g && g > b && r - b > 0.08 && r - b < 0.45 && lit > 0.2 && lit < 0.9) {
          r = r * 1.04 + 0.01;
          g = g * 1.01;
        } else if (g > r + 0.04 && g > b && g > 0.15) {
          g *= 1.05;
        }
      }
      [r, g, b] = lutOf(r, g, b, grade.lut);
      [r, g, b] = applyLook(r, g, b, grade.look, width ? x / width : 0.5, height ? y / height : 0.5);
      const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (flags.sample && (x & 1) === 0 && (y & 1) === 0) {
        scopes.luma[Math.min(31, (clamp01(Y) * 32) | 0)]! += 1;
        scopes.red[Math.min(31, (clamp01(r) * 32) | 0)]! += 1;
        scopes.green[Math.min(31, (clamp01(g) * 32) | 0)]! += 1;
        scopes.blue[Math.min(31, (clamp01(b) * 32) | 0)]! += 1;
        const col = Math.min(COLS - 1, ((x / width) * COLS) | 0);
        scopes.wave[col]! += clamp01(Y);
        waveN[col]! += 1;
        const cb = -0.1687 * r - 0.3313 * g + 0.5 * b;
        const cr = 0.5 * r - 0.4187 * g - 0.0813 * b;
        const vx = Math.min(15, Math.max(0, ((cr + 0.5) * 16) | 0));
        const vy = Math.min(15, Math.max(0, ((0.5 - cb) * 16) | 0));
        scopes.vector[vy * 16 + vx]! += 1;
        seen += 1;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (b > r + 0.05 && b > g && b > 0.35) sky += 1;
        else if (g > r + 0.04 && g > b && g > 0.2) leaf += 1;
        else if (r > g && g > b && r - b > 0.08 && r - b < 0.45 && max - min > 0.08 && Y > 0.25 && Y < 0.85) skin += 1;
        else if (max - min < 0.12 && Y > 0.25 && Y < 0.8) stone += 1;
      }
      let R = r;
      let G = g;
      let B = b;
      if (flags.falseColor) [R, G, B] = falseTone(clamp01(Y));
      if (flags.zebra && Y > flags.zebraAt && ((x + y) & 7) < 3) R = G = B = 1;
      if (flags.clip && flags.blinkOn && (Y > 0.98 || Y < 0.02)) {
        R = Y > 0.98 ? 1 : 0.15;
        G = 0.1;
        B = Y < 0.02 ? 1 : 0.1;
      }
      data[i] = (clamp01(R) * 255) | 0;
      data[i + 1] = (clamp01(G) * 255) | 0;
      data[i + 2] = (clamp01(B) * 255) | 0;
    }
  }

  if (flags.peaking && !flags.falseColor) {
    const [pr, pg, pb] = flags.peak;
    for (let y = 1; y < height; y += 2) {
      for (let x = 1; x < width; x += 2) {
        const i = (y * width + x) * 4;
        const left = i - 4;
        const up = i - width * 4;
        const Y = data[i]! * 0.2126 + data[i + 1]! * 0.7152 + data[i + 2]! * 0.0722;
        const Yl = data[left]! * 0.2126 + data[left + 1]! * 0.7152 + data[left + 2]! * 0.0722;
        const Yu = data[up]! * 0.2126 + data[up + 1]! * 0.7152 + data[up + 2]! * 0.0722;
        if (Math.abs(Y - Yl) + Math.abs(Y - Yu) > 28) {
          data[i] = pr;
          data[i + 1] = pg;
          data[i + 2] = pb;
        }
      }
    }
  }

  if (flags.sample) {
    for (let i = 0; i < COLS; i++) scopes.wave[i] = waveN[i] ? scopes.wave[i]! / waveN[i]! : 0;
    const n = Math.max(seen, 1);
    scopes.scene = { sky: sky / n, leaf: leaf / n, stone: stone / n, skin: skin / n };
    normalise(scopes.luma);
    normalise(scopes.red);
    normalise(scopes.green);
    normalise(scopes.blue);
    normalise(scopes.vector);
  }
  return scopes;
}

function normalise(bins: number[]) {
  const peak = Math.max(...bins, 1);
  for (let i = 0; i < bins.length; i++) bins[i] = bins[i]! / peak;
}

export function averageLuma(data: Uint8ClampedArray) {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 32) {
    sum += data[i]! * 0.2126 + data[i + 1]! * 0.7152 + data[i + 2]! * 0.0722;
    n += 1;
  }
  return n ? sum / n / 255 : 0;
}
