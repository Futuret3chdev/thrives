export const LOOKS = [
  { id: "none", group: "Style", name: "None" },
  { id: "teal-orange", group: "Style", name: "Teal and orange" },
  { id: "warm-vintage", group: "Style", name: "Warm vintage" },
  { id: "moody-matte", group: "Style", name: "Moody matte" },
  { id: "light-airy", group: "Style", name: "Light and airy" },
  { id: "contrast-bw", group: "Style", name: "High contrast black and white" },
  { id: "polaroid", group: "Style", name: "Faded Polaroid" },
  { id: "neon", group: "Style", name: "Cyberpunk neon" },
  { id: "cross", group: "Style", name: "Cross-processed" },
  { id: "glow", group: "Style", name: "Glow, soft dream" },
  { id: "cinema", group: "Style", name: "Cinematic film" },
  { id: "pop", group: "Style", name: "Saturated pop" },
  { id: "sepia", group: "Style", name: "Moody sepia" },
  { id: "glitch", group: "Style", name: "Glitch" },
  { id: "americana", group: "Style", name: "Dark Americana" },
  { id: "duotone", group: "Style", name: "Duotone" },
  { id: "pastel", group: "Style", name: "Pastel dream" },
  { id: "noir", group: "Style", name: "Gothic noir" },
  { id: "golden", group: "Style", name: "Sun-kissed" },
  { id: "infrared-look", group: "Style", name: "Infrared digital" },
  { id: "grain-mono", group: "Style", name: "Grainy monochrome" },
  { id: "cpl", group: "Lens", name: "Circular polarizer" },
  { id: "linear-pol", group: "Lens", name: "Linear polarizer" },
  { id: "nd", group: "Lens", name: "Solid ND" },
  { id: "vnd", group: "Lens", name: "Variable ND" },
  { id: "gnd-hard", group: "Lens", name: "Graduated ND, hard" },
  { id: "gnd-soft", group: "Lens", name: "Graduated ND, soft" },
  { id: "gnd-reverse", group: "Lens", name: "Reverse graduated ND" },
  { id: "center-nd", group: "Lens", name: "Center-spot ND" },
  { id: "black-mist", group: "Lens", name: "Black mist" },
  { id: "white-mist", group: "Lens", name: "White mist" },
  { id: "uv", group: "Lens", name: "UV / skylight" },
  { id: "ir-pass", group: "Lens", name: "Infrared pass" },
  { id: "lpr", group: "Lens", name: "Light pollution cut" },
  { id: "star", group: "Lens", name: "Star filter" },
  { id: "streak", group: "Lens", name: "Anamorphic streak" },
  { id: "prism", group: "Lens", name: "Prism" },
  { id: "macro", group: "Lens", name: "Close-up" },
  { id: "ctb", group: "Lens", name: "Colour temperature blue" },
  { id: "cto", group: "Lens", name: "Colour temperature orange" },
  { id: "didymium", group: "Lens", name: "Colour enhancing" },
] as const;

export type LookId = (typeof LOOKS)[number]["id"];

function yOf(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function applyLook(r: number, g: number, b: number, id: string, x = 0.5, y = 0.5): [number, number, number] {
  const Y = yOf(r, g, b);
  switch (id) {
    case "teal-orange":
      return Y < 0.45 ? [r * 0.82, g * 0.96, Math.min(1, b * 1.18)] : [Math.min(1, r * 1.14), g * 0.98, b * 0.78];
    case "warm-vintage":
      return [mix(Y, Math.min(1, r * 1.08 + 0.06), 0.7), mix(Y, g * 0.96 + 0.04, 0.55), mix(Y, b * 0.78, 0.45)];
    case "moody-matte":
      return [mix(0.16, r, 0.82), mix(0.15, g, 0.8), mix(0.14, b, 0.78)];
    case "light-airy":
      return [Math.min(1, r * 1.12 + 0.06), Math.min(1, g * 1.1 + 0.06), Math.min(1, b * 1.08 + 0.07)];
    case "contrast-bw": {
      const v = Math.min(1, Math.max(0, (Y - 0.42) * 1.8 + 0.42));
      return [v, v, v];
    }
    case "polaroid":
      return [mix(0.18, r * 1.02, 0.86), mix(0.2, g * 0.98, 0.84), mix(0.22, b * 1.04, 0.84)];
    case "neon":
      return [Math.min(1, r * 1.25 + (b > 0.4 ? 0.08 : 0)), g * 0.85, Math.min(1, b * 1.3)];
    case "cross":
      return [Math.min(1, r * 1.05 + 0.04), Math.min(1, g * 1.08), b * 0.82 + 0.02];
    case "glow":
      return [Math.min(1, r + Y * 0.12), Math.min(1, g + Y * 0.1), Math.min(1, b + Y * 0.08)];
    case "cinema":
      return [r * 0.96, g * 1.02, b * 0.9];
    case "pop":
      return [mix(Y, r, 1.45), mix(Y, g, 1.45), mix(Y, b, 1.45)];
    case "sepia":
      return [Y * 1.05, Y * 0.82, Y * 0.55];
    case "glitch":
      return [Math.min(1, r + (x > 0.5 ? 0.08 : 0)), g, Math.min(1, b + (x < 0.5 ? 0.1 : 0))];
    case "americana":
      return [r * 0.9, g * 0.82, b * 0.7];
    case "duotone":
      return [Y * 0.95, Y * 0.35, Y * 0.85];
    case "pastel":
      return [mix(0.75, r, 0.55) * 1.05, mix(0.82, g, 0.55), mix(0.86, b, 0.55)];
    case "noir": {
      const v = Y < 0.35 ? Y * 0.45 : Y;
      const keep = Math.max(r, g, b) - Math.min(r, g, b) > 0.25;
      return keep ? [r * 0.7, g * 0.7, b * 0.75] : [v, v, v * 1.05];
    }
    case "golden":
      return [Math.min(1, r * 1.12 + 0.06), g * 0.98 + 0.03, b * 0.72];
    case "infrared-look":
    case "ir-pass":
      return g > r && g > 0.2 ? [Math.min(1, 0.7 + g * 0.4), Math.min(1, 0.45 + g * 0.3), g * 0.7] : [Y * 0.2, Y * 0.2, Y * 0.25];
    case "grain-mono": {
      const grain = ((Math.sin(x * 120 + y * 80) + 1) / 2 - 0.5) * 0.12;
      const v = Math.min(1, Math.max(0, Y + grain));
      return [v, v, v];
    }
    case "cpl":
    case "linear-pol":
      return b > r && b > 0.3 ? [r * 0.9, g * 0.95, Math.min(1, b * 1.2)] : g > r ? [r, Math.min(1, g * 1.12), b] : [r, g, b];
    case "nd":
      return [r * 0.55, g * 0.55, b * 0.55];
    case "vnd":
      return [r * 0.4, g * 0.4, b * 0.4];
    case "gnd-hard":
      return y < 0.42 ? [r * 0.55, g * 0.55, b * 0.55] : [r, g, b];
    case "gnd-soft": {
      const t = Math.min(1, y / 0.7);
      const d = mix(0.5, 1, t);
      return [r * d, g * d, b * d];
    }
    case "gnd-reverse": {
      const band = Math.abs(y - 0.38) < 0.16 ? 0.45 : 1;
      return [r * band, g * band, b * band];
    }
    case "center-nd": {
      const d = Math.hypot(x - 0.5, y - 0.5);
      const k = d < 0.22 ? 0.62 : 1;
      return [r * k, g * k, b * k];
    }
    case "black-mist":
      return [mix(Y, r, 0.82) + 0.03, mix(Y, g, 0.82) + 0.03, mix(Y, b, 0.82) + 0.03];
    case "white-mist":
      return [mix(0.72, r, 0.62), mix(0.72, g, 0.62), mix(0.72, b, 0.62)];
    case "uv":
      return [r, g, b * 0.92];
    case "lpr":
      return [r * 0.82, g * 0.95, Math.min(1, b * 1.08)];
    case "star":
      return Y > 0.82 ? [1, 1, 1] : [r, g, b];
    case "streak":
      return Y > 0.75 ? [Math.min(1, r + 0.2), g, b] : [r, g, b];
    case "prism":
      return [Math.min(1, r + 0.08), g, Math.min(1, b + (x < 0.3 || x > 0.7 ? 0.1 : 0))];
    case "macro":
      return [mix(Y, r, 1.2), mix(Y, g, 1.2), mix(Y, b, 1.2)];
    case "ctb":
      return [r * 0.82, g * 0.92, Math.min(1, b * 1.18)];
    case "cto":
      return [Math.min(1, r * 1.15), g * 0.98, b * 0.75];
    case "didymium":
      return r > g && r > b ? [Math.min(1, r * 1.25), g * 0.95, b * 0.9] : [r, g, b];
    default:
      return [r, g, b];
  }
}
