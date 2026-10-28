import { useEffect, useRef, useState } from "react";

type Look = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  warmth: number;
  saturation: number;
  vignette: number;
};

const START: Look = {
  exposure: 0,
  contrast: 1,
  highlights: 0,
  shadows: 0,
  warmth: 0,
  saturation: 1,
  vignette: 0.12,
};

export function Darkroom({ src }: { src: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [look, setLook] = useState<Look>(START);
  const [plain, setPlain] = useState(false);
  const [bins, setBins] = useState<number[]>(Array.from({ length: 32 }, () => 0));

  useEffect(() => {
    const image = new Image();
    image.onload = () => draw(image);
    image.src = src;

    function draw(photo: HTMLImageElement) {
      const node = canvas.current;
      if (!node) return;
      const scale = Math.min(1, 1400 / photo.width);
      node.width = Math.max(1, Math.round(photo.width * scale));
      node.height = Math.max(1, Math.round(photo.height * scale));
      const ctx = node.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(photo, 0, 0, node.width, node.height);
      if (plain) {
        setBins(Array.from({ length: 32 }, () => 0));
        return;
      }
      const frame = ctx.getImageData(0, 0, node.width, node.height);
      const data = frame.data;
      const next = Array.from({ length: 32 }, () => 0);
      const gain = 2 ** look.exposure;
      const cx = node.width / 2;
      const cy = node.height / 2;
      const maxD = Math.hypot(cx, cy) || 1;
      for (let y = 0; y < node.height; y++) {
        for (let x = 0; x < node.width; x++) {
          const i = (y * node.width + x) * 4;
          let r = data[i]! / 255;
          let g = data[i + 1]! / 255;
          let b = data[i + 2]! / 255;
          r *= gain;
          g *= gain;
          b *= gain;
          r = (r - 0.5) * look.contrast + 0.5;
          g = (g - 0.5) * look.contrast + 0.5;
          b = (b - 0.5) * look.contrast + 0.5;
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const shadowLift = look.shadows * Math.max(0, 0.55 - lum);
          const highPull = look.highlights * Math.max(0, lum - 0.45);
          r += shadowLift - highPull;
          g += shadowLift - highPull;
          b += shadowLift - highPull;
          r += look.warmth / 220;
          b -= look.warmth / 220;
          const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          r = gray + (r - gray) * look.saturation;
          g = gray + (g - gray) * look.saturation;
          b = gray + (b - gray) * look.saturation;
          const vig = 1 - look.vignette * (Math.hypot(x - cx, y - cy) / maxD) ** 1.6;
          r *= vig;
          g *= vig;
          b *= vig;
          data[i] = byte(r);
          data[i + 1] = byte(g);
          data[i + 2] = byte(b);
          const yv = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
          next[Math.min(31, (yv / 256) * 32) | 0]! += 1;
        }
      }
      const peak = Math.max(...next, 1);
      setBins(next.map((n) => n / peak));
      ctx.putImageData(frame, 0, 0);
    }
  }, [src, look, plain]);

  function save(kind: "jpeg" | "png") {
    const node = canvas.current;
    if (!node) return;
    const link = document.createElement("a");
    link.href = kind === "jpeg" ? node.toDataURL("image/jpeg", 0.92) : node.toDataURL("image/png");
    link.download = kind === "jpeg" ? "thrives-edit.jpg" : "thrives-edit.png";
    link.click();
  }

  return (
    <div className="panel">
      <div className="stage">
        <canvas ref={canvas} />
      </div>
      <div className="hist" aria-hidden="true">
        {bins.map((n, i) => (
          <i key={i} style={{ height: `${Math.max(4, n * 100)}%` }} />
        ))}
      </div>
      <div className="fields two">
        <Slider label={`Exposure ${look.exposure.toFixed(2)}`} min={-2} max={2} step={0.05} value={look.exposure} onChange={(exposure) => setLook({ ...look, exposure })} />
        <Slider label={`Contrast ${look.contrast.toFixed(2)}`} min={0.6} max={1.8} step={0.02} value={look.contrast} onChange={(contrast) => setLook({ ...look, contrast })} />
        <Slider label={`Highlights ${look.highlights.toFixed(2)}`} min={-0.6} max={0.6} step={0.02} value={look.highlights} onChange={(highlights) => setLook({ ...look, highlights })} />
        <Slider label={`Shadows ${look.shadows.toFixed(2)}`} min={-0.6} max={0.6} step={0.02} value={look.shadows} onChange={(shadows) => setLook({ ...look, shadows })} />
        <Slider label={`Warmth ${look.warmth}`} min={-40} max={40} step={1} value={look.warmth} onChange={(warmth) => setLook({ ...look, warmth })} />
        <Slider label={`Colour ${look.saturation.toFixed(2)}`} min={0} max={2} step={0.02} value={look.saturation} onChange={(saturation) => setLook({ ...look, saturation })} />
        <Slider label="Vignette" min={0} max={0.7} step={0.02} value={look.vignette} onChange={(vignette) => setLook({ ...look, vignette })} />
      </div>
      <div className="row">
        <button className="btn ghost" type="button" onClick={() => setPlain((on) => !on)}>
          {plain ? "Show grade" : "Original"}
        </button>
        <button className="btn ghost" type="button" onClick={() => setLook(START)}>
          Reset
        </button>
        <button className="btn" type="button" onClick={() => save("jpeg")}>
          Save JPEG
        </button>
        <button className="btn ghost" type="button" onClick={() => save("png")}>
          Save PNG
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="field">
      {label}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function byte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n * 255)));
}
