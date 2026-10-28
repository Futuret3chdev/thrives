import { useEffect, useRef, useState } from "react";
import { formatShutter } from "@/lib/photo/calc";
import { averageLuma, gradeFrame, shutterFromAngle, type Flags, type Grade, type Lut, type Scopes } from "@/lib/photo/optics";
import { aimPlace, loadPlaces, type PlaceHit } from "@/lib/photo/places";

const ISOS = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800];
const SPEEDS = [1 / 8000, 1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4, 1 / 2, 1, 2];
const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
const RATES = [24, 25, 30, 48, 60, 120];

type Mode = "exposure" | "focus" | "monitor" | "capture" | "studio" | "place";
type Facing = "user" | "environment";

type Settings = {
  iso: number;
  shutter: number;
  angle: number;
  lockAngle: boolean;
  fps: number;
  aperture: number;
  kelvin: number;
  tint: number;
  nd: number;
  focus: number;
  pullA: number;
  pullB: number;
  peaking: boolean;
  mag: boolean;
  desqueeze: number;
  lut: Lut;
  zebra: boolean;
  zebraAt: number;
  falseColor: boolean;
  clip: boolean;
  thirds: boolean;
  golden: boolean;
  safe: boolean;
  protect: boolean;
  steady: boolean;
  proxy: boolean;
  negative: boolean;
  preroll: boolean;
  smooth: boolean;
  bitrate: number;
  audio: boolean;
  gain: number;
  dim: boolean;
  facing: Facing;
};

type Shot = { url: string; note: string; name: string; blob: Blob; meta: string };

const INITIAL: Settings = {
  iso: 100,
  shutter: 1 / 125,
  angle: 180,
  lockAngle: false,
  fps: 24,
  aperture: 4,
  kelvin: 5600,
  tint: 0,
  nd: 0,
  focus: 0.55,
  pullA: 0.2,
  pullB: 0.85,
  peaking: true,
  mag: false,
  desqueeze: 1,
  lut: "neutral",
  zebra: false,
  zebraAt: 0.8,
  falseColor: false,
  clip: false,
  thirds: true,
  golden: false,
  safe: false,
  protect: true,
  steady: false,
  proxy: true,
  negative: false,
  preroll: true,
  smooth: false,
  bitrate: 24,
  audio: false,
  gain: 1,
  dim: false,
  facing: "environment",
};

export function Camera({ onEdit }: { onEdit: (url: string) => void }) {
  const [settings, setSettings] = useState<Settings>(INITIAL);
  const [mode, setMode] = useState<Mode>("exposure");
  const [live, setLive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lens, setLens] = useState("Preview grade");
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [aimed, setAimed] = useState<PlaceHit | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [placeNote, setPlaceNote] = useState("Point the camera at an old building. The name and year show here.");
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [primaryId, setPrimaryId] = useState("");
  const [secondId, setSecondId] = useState("");
  const [clock, setClock] = useState("00:00:00:00");
  const [copyright, setCopyright] = useState("Tammy Nguyen");
  const [intervalSec, setIntervalSec] = useState(5);
  const [intervalCount, setIntervalCount] = useState(12);
  const [jamText, setJamText] = useState("00:00:00:00");
  const [scene, setScene] = useState({ sky: 0, leaf: 0, stone: 0, skin: 0 });
  const [hasFile, setHasFile] = useState(false);
  const [secondOn, setSecondOn] = useState(false);
  const [busy, setBusy] = useState(false);

  const settingsRef = useRef(settings);
  const biasRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const vectorRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pipStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<MediaStream | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const fileRef = useRef<HTMLImageElement | null>(null);
  const magRef = useRef<HTMLCanvasElement | null>(null);
  const placeRef = useRef<PlaceHit | null>(null);
  const hereRef = useRef<{ lat: number; lon: number } | null>(null);
  const headingRef = useRef<number | null>(null);
  const placesRef = useRef<PlaceHit[]>([]);
  const askedRef = useRef(false);
  const pinnedRef = useRef<string | null>(null);
  const modeRef = useRef<Mode>("exposure");
  const ringRef = useRef<Shot[]>([]);
  const preAt = useRef(0);
  const jamRef = useRef(Date.now());
  const tickRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);
  const dirRef = useRef<FileSystemDirectoryHandle | null>(null);
  const ink = useRef({ peak: [141, 98, 56] as [number, number, number], paper: "#f3eee6", ink: "#1c1712" });

  settingsRef.current = settings;
  modeRef.current = mode;
  pinnedRef.current = pinned;
  placeRef.current = pinned ? (places.find((place) => place.id === pinned) ?? aimed) : aimed;

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    ink.current.paper = root.getPropertyValue("--color-paper").trim() || ink.current.paper;
    ink.current.ink = root.getPropertyValue("--color-ink").trim() || ink.current.ink;
    ink.current.peak = rgb(root.getPropertyValue("--color-brass").trim() || "#8d6238");
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setClock(timecode(Date.now() - jamRef.current, settingsRef.current.fps)), 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      event.preventDefault();
      void shoot("Frame", true);
    };
    window.addEventListener("keydown", onKey);
    const bus = new BroadcastChannel("thrives-shutter");
    bus.onmessage = (event) => {
      if (event.data === "fire") void shoot("Remote", true);
    };
    return () => {
      window.removeEventListener("keydown", onKey);
      bus.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      pipStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioRef.current?.getTracks().forEach((track) => track.stop());
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    let stop = false;
    let last = 0;
    const loop = (now: number) => {
      if (stop) return;
      const gap = settingsRef.current.dim ? 220 : 70;
      if (now - last > gap) {
        last = now;
        paint();
      }
      requestAnimationFrame(loop);
    };
    const frame = requestAnimationFrame(loop);
    return () => {
      stop = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    void track.applyConstraints({ frameRate: settings.fps }).catch(() => undefined);
    void linkFocus(track, settings.focus);
  }, [settings.fps, settings.focus, live]);

  function patch(next: Partial<Settings>) {
    setSettings((current) => ({ ...current, ...next }));
  }

  async function openCamera(facing: Facing, deviceId?: string) {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    patch({ facing });
    setPrimaryId(deviceId ?? "");
    await wait(160);
    const video = deviceId
      ? { deviceId: { ideal: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      : { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: settingsRef.current.fps } };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video });
      streamRef.current = stream;
      fileRef.current = null;
      setHasFile(false);
      const view = videoRef.current;
      if (view) {
        view.srcObject = stream;
        await view.play();
      }
      setLive(true);
      setError(null);
      const using = stream.getVideoTracks()[0]?.getSettings().deviceId;
      if (using) setPrimaryId(using);
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCams(devices.filter((device) => device.kind === "videoinput" && device.deviceId));
      const track = stream.getVideoTracks()[0];
      if (track) {
        const linked = await linkFocus(track, settingsRef.current.focus);
        setLens(linked ? "Lens focus linked" : "This phone kept autofocus. Peaking still marks the sharp edges.");
      }
      if (!askedRef.current) {
        askedRef.current = true;
        void askWhere();
      }
    } catch {
      setLive(false);
      setError("The camera needs permission. A digital file still opens.");
    }
  }

  async function askWhere() {
    const orientation = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof orientation.requestPermission === "function") {
      try {
        await orientation.requestPermission();
      } catch {
        /* compass stays off */
      }
    }
    const onOrient = (event: DeviceOrientationEvent) => {
      const apple = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      const heading = apple ?? (event.alpha == null ? null : (360 - event.alpha + 360) % 360);
      if (heading == null) return;
      headingRef.current = heading;
      retarget();
    };
    window.addEventListener("deviceorientation", onOrient);
    if (!navigator.geolocation) {
      setPlaceNote("This browser has no location, so the building cannot be named.");
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const here = { lat: position.coords.latitude, lon: position.coords.longitude };
        const previous = hereRef.current;
        hereRef.current = here;
        const moved = !previous || haversine(previous.lat, previous.lon, here.lat, here.lon) > 40;
        if (moved) void refreshPlaces(here.lat, here.lon);
        else retarget();
      },
      () => setPlaceNote("Location is off, so the building in front of the lens cannot be named."),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }

  async function refreshPlaces(lat: number, lon: number) {
    setPlaceNote("Reading the street…");
    try {
      const next = await loadPlaces(lat, lon);
      placesRef.current = next;
      setPlaces(next);
      if (!next.length) setPlaceNote("Nothing dated is recorded within a short walk.");
      retarget();
    } catch {
      setPlaceNote("The place list did not answer. Try again in a moment.");
    }
  }

  function retarget() {
    const here = hereRef.current;
    if (!here) return;
    const next = aimPlace(placesRef.current, here.lat, here.lon, headingRef.current);
    const pin = pinnedRef.current;
    const chosen = pin ? (placesRef.current.find((place) => place.id === pin) ?? next) : next;
    setAimed(chosen);
    if (!chosen) setPlaceNote("Nothing dated is in front of the lens.");
  }

  async function openSecond(deviceId: string) {
    pipStreamRef.current?.getTracks().forEach((track) => track.stop());
    pipStreamRef.current = null;
    if (!deviceId) {
      setSecondOn(false);
      setSecondId("");
      return;
    }
    setSecondId(deviceId);
    await wait(160);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { ideal: deviceId } },
      });
      pipStreamRef.current = stream;
      const video = pipVideoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setSecondOn(true);
      setError(null);
    } catch {
      setSecondOn(false);
      setSecondId("");
      setError("This phone will not run a second camera at the same time. Choose it as the main camera instead.");
    }
  }

  async function enableAudio(on: boolean) {
    patch({ audio: on });
    if (!on) {
      audioRef.current?.getTracks().forEach((track) => track.stop());
      audioRef.current = null;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioRef.current = stream;
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const gain = context.createGain();
      gain.gain.value = settingsRef.current.gain;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(gain).connect(analyser);
      gainRef.current = gain;
      analyserRef.current = analyser;
    } catch {
      setError("The microphone needs permission for the level meter.");
      patch({ audio: false });
    }
  }

  function paint() {
    const canvas = viewRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;
    const desk = settingsRef.current;
    const file = fileRef.current;
    const video = videoRef.current;
    let source: CanvasImageSource | null = null;
    let srcW = 0;
    let srcH = 0;
    let mirror = false;
    if (file && file.complete && file.naturalWidth) {
      source = file;
      srcW = file.naturalWidth;
      srcH = file.naturalHeight;
    } else if (video && video.videoWidth) {
      source = video;
      srcW = video.videoWidth;
      srcH = video.videoHeight;
      mirror = desk.facing === "user";
    }
    if (!source || !srcW || !srcH) return;
    const scale = Math.min(1, 720 / (srcW * desk.desqueeze));
    const w = Math.max(2, Math.round(srcW * desk.desqueeze * scale));
    const h = Math.max(2, Math.round(srcH * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const inset = desk.steady ? 0.07 : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (mirror) {
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, srcW * inset, srcH * inset, srcW * (1 - inset * 2), srcH * (1 - inset * 2), 0, 0, w, h);
    if (mirror) ctx.restore();
    if (desk.mag) magnify(ctx, w, h);
    tickRef.current += 1;
    const sample = modeRef.current === "monitor" && tickRef.current % 2 === 0;
    const flags: Flags = {
      zebra: desk.zebra,
      zebraAt: desk.zebraAt,
      falseColor: desk.falseColor,
      clip: desk.clip,
      peaking: desk.peaking,
      blinkOn: Math.floor(tickRef.current / 8) % 2 === 0,
      protect: desk.protect,
      sample,
      peak: ink.current.peak,
    };
    const frame = ctx.getImageData(0, 0, w, h);
    const scopes = gradeFrame(frame.data, w, h, toGrade(desk, biasRef.current), flags);
    ctx.putImageData(frame, 0, 0);
    guides(ctx, w, h, desk, ink.current.paper);
    if (sample) {
      setScene(scopes.scene);
      drawScopes(scopes);
    }
    drawVu();
    if (desk.preroll && performance.now() - preAt.current > 450) {
      preAt.current = performance.now();
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const previous = ringRef.current;
        ringRef.current = [{ url, note: "Before the shutter", name: "before.jpg", blob, meta: "" }, ...previous].slice(0, 5);
        previous.slice(4).forEach((shot) => URL.revokeObjectURL(shot.url));
      }, "image/jpeg", 0.72);
    }
    if (desk.smooth) {
      const luma = averageLuma(frame.data);
      if (luma > 0.72) biasRef.current = Math.max(-3, biasRef.current - 0.04);
      if (luma < 0.22) biasRef.current = Math.min(3, biasRef.current + 0.04);
    }
  }

  function drawScopes(scopes: Scopes) {
    paintHist(histRef.current, [scopes.luma, scopes.red, scopes.green, scopes.blue]);
    paintWave(waveRef.current, scopes.wave);
    paintVector(vectorRef.current, scopes.vector);
  }

  function drawVu() {
    const canvas = vectorRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser || modeRef.current !== "monitor") return;
    const bins = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(bins);
    let peak = 0;
    for (const value of bins) peak = Math.max(peak, Math.abs(value - 128));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const level = peak / 128;
    ctx.fillStyle = ink.current.paper;
    ctx.fillRect(8, canvas.height - 8, (canvas.width - 16) * level, 4);
  }

  async function shoot(tag: string, withRoll: boolean) {
    if (busy) return;
    const source = currentSource();
    if (!source) return;
    setBusy(true);
    try {
      const desk = settingsRef.current;
      const baked = await bake(source, desk, false);
      if (!baked) return;
      if (desk.smooth) {
        const luma = averageLuma(baked.pixels);
        if (luma > 0.68) biasRef.current = Math.max(-3, biasRef.current - 0.15);
        if (luma < 0.25) biasRef.current = Math.min(3, biasRef.current + 0.15);
      }
      const place = placeRef.current;
      const note = place ? `${place.name}${place.year ? ` · ${place.year}` : ""}` : tag;
      const slug = (place?.name || tag).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const meta = JSON.stringify(metaFor(desk, place, tag), null, 2);
      const frames: Shot[] = [];
      if (withRoll && desk.preroll) frames.push(...ringRef.current);
      frames.push({ url: URL.createObjectURL(baked.jpeg), note, name: `thrives-${slug || "frame"}.jpg`, blob: baked.jpeg, meta });
      if (desk.negative) {
        frames.push({ url: URL.createObjectURL(baked.png), note: `${note} · negative`, name: `thrives-${slug || "frame"}.png`, blob: baked.png, meta });
      }
      if (desk.proxy) {
        frames.push({ url: URL.createObjectURL(baked.proxy), note: `${note} · proxy`, name: `thrives-${slug || "frame"}-proxy.jpg`, blob: baked.proxy, meta });
      }
      const pip = pipVideoRef.current;
      if (pip && pip.videoWidth) {
        const second = await bake({ image: pip, width: pip.videoWidth, height: pip.videoHeight, mirror: false }, desk, false);
        if (second) frames.push({ url: URL.createObjectURL(second.jpeg), note: `${note} · camera 2`, name: `thrives-${slug || "frame"}-b.jpg`, blob: second.jpeg, meta });
      }
      setShots((current) => [...frames, ...current].slice(0, 18));
      ringRef.current = [];
      if (dirRef.current) {
        await writeFile(dirRef.current, frames[frames.length - (desk.proxy ? 2 : 1)] ?? frames[0]!, meta);
      }
    } finally {
      setBusy(false);
    }
  }

  async function bracket() {
    const saved = biasRef.current;
    for (const stop of [-2, 0, 2]) {
      biasRef.current = saved + stop;
      await wait(180);
      await shoot(`Bracket ${stop > 0 ? "+" : ""}${stop}`, false);
    }
    biasRef.current = saved;
  }

  async function focusStack() {
    const saved = settingsRef.current.focus;
    for (const focus of [0.05, 0.3, 0.55, 0.8, 1]) {
      settingsRef.current = { ...settingsRef.current, focus };
      setSettings((current) => ({ ...current, focus }));
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) await linkFocus(track, focus);
      await wait(420);
      await shoot("Focus stack", false);
    }
    settingsRef.current = { ...settingsRef.current, focus: saved };
    setSettings((current) => ({ ...current, focus: saved }));
  }

  async function pixelStack() {
    for (let step = 1; step <= 4; step += 1) {
      await shoot(`Pixel stack ${step}`, false);
      await wait(280);
    }
  }

  function startInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    let left = intervalCount;
    intervalRef.current = setInterval(() => {
      void shoot("Interval", false);
      left -= 1;
      if (left <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, Math.max(1, intervalSec) * 1000);
  }

  function runPull() {
    const start = performance.now();
    const from = settingsRef.current.pullA;
    const to = settingsRef.current.pullB;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 2200);
      const focus = from + (to - from) * t;
      settingsRef.current = { ...settingsRef.current, focus };
      setSettings((current) => ({ ...current, focus }));
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) void linkFocus(track, focus);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  async function toggleRec() {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
      return;
    }
    const canvas = viewRef.current;
    if (!canvas) return;
    const stream = canvas.captureStream(Math.min(30, settingsRef.current.fps));
    const audio = audioRef.current?.getAudioTracks()[0];
    if (audio) stream.addTrack(audio);
    const mime = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: settingsRef.current.bitrate * 1_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const ext = mime.includes("mp4") ? "mp4" : "webm";
      const shot: Shot = {
        url: URL.createObjectURL(blob),
        note: settingsRef.current.fps >= 60 ? "High frame rate · play at 24 fps for slow motion" : "Editing master",
        name: `thrives-master.${ext}`,
        blob,
        meta: JSON.stringify(metaFor(settingsRef.current, placeRef.current, "Master"), null, 2),
      };
      setShots((current) => [shot, ...current].slice(0, 18));
      setRecording(false);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  async function pictureInPicture() {
    const canvas = viewRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const stream = canvas.captureStream(20);
    video.srcObject = stream;
    await video.play();
    if (document.pictureInPictureEnabled) await video.requestPictureInPicture();
  }

  async function chooseFolder() {
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    if (!picker) {
      setError("This browser saves files to Downloads. A watched folder needs Chrome or Edge.");
      return;
    }
    dirRef.current = await picker();
    setError(null);
    setPlaceNote("New frames will also be written into the chosen folder.");
  }

  function loadFile(file: File) {
    const image = new Image();
    image.onload = () => {
      fileRef.current = image;
      setHasFile(true);
    };
    image.src = URL.createObjectURL(file);
  }

  function jam() {
    const parts = jamText.split(":").map((part) => Number(part));
    const [hh = 0, mm = 0, ss = 0, ff = 0] = parts;
    const fps = Math.max(1, settings.fps);
    const ms = ((hh * 3600 + mm * 60 + ss) * 1000) + (ff / fps) * 1000;
    jamRef.current = Date.now() - ms;
    setClock(timecode(ms, fps));
  }

  const shown = placeRef.current;
  const speed = settings.lockAngle ? shutterFromAngle(settings.angle, settings.fps) : settings.shutter;
  const canShoot = live || hasFile;

  return (
    <div className="panel" data-dim={settings.dim ? "1" : "0"}>
      <div className="stage finder">
        <canvas ref={viewRef} />
        <video ref={videoRef} className="cam-src" playsInline muted autoPlay />
        <video ref={pipVideoRef} className="pip" playsInline muted autoPlay data-on={secondOn ? "1" : "0"} />
        <div className="tc">{clock}</div>
        <div className="cam-read">
          <span>ISO {settings.iso}</span>
          <span>{formatShutter(speed)}</span>
          <span>f/{settings.aperture}</span>
          <span>{settings.kelvin}K</span>
          {settings.nd > 0 && <span>ND {settings.nd.toFixed(1)}</span>}
        </div>
        <div className="place-card">
          {shown ? (
            <>
              <b>{shown.name}</b>
              <em>{shown.year || "Year unrecorded"}</em>
              <p>{shown.about}</p>
            </>
          ) : (
            <p>{placeNote}</p>
          )}
        </div>
        {!live && !hasFile && <p className="camera-wait">Open the camera, or load a digital file.</p>}
      </div>

      {error && <p>{error}</p>}
      <p className="lens-note">{lens}</p>

      <div className="shut-row">
        {!live && (
          <button className="btn" type="button" onClick={() => openCamera(settings.facing)}>
            Open camera
          </button>
        )}
        <button className="btn ghost" type="button" onClick={() => openCamera(settings.facing === "user" ? "environment" : "user")}>
          Flip
        </button>
        <button className="shut" type="button" aria-label="Take photo" disabled={!canShoot || busy} onClick={() => void shoot("Frame", true)} />
        <button className="rec" type="button" data-on={recording ? "1" : "0"} onClick={() => void toggleRec()}>
          {recording ? "Stop" : "Rec"}
        </button>
        <label className="file-btn">
          File
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) loadFile(file);
            }}
          />
        </label>
      </div>

      <div className="cam-pick">
        <p>Camera</p>
        <div className="tools">
          <button type="button" data-on={settings.facing === "environment" && !primaryId ? "1" : "0"} onClick={() => void openCamera("environment")}>
            Back
          </button>
          <button type="button" data-on={settings.facing === "user" && !primaryId ? "1" : "0"} onClick={() => void openCamera("user")}>
            Front
          </button>
          {cams.map((cam, index) => (
            <button key={cam.deviceId} type="button" data-on={primaryId === cam.deviceId ? "1" : "0"} onClick={() => void openCamera(facingOf(cam), cam.deviceId)}>
              {cameraName(cam, index)}
            </button>
          ))}
        </div>
        <p>Second camera</p>
        <div className="tools">
          <button type="button" data-on={secondId ? "0" : "1"} onClick={() => void openSecond("")}>
            Off
          </button>
          {cams.map((cam, index) => (
            <button key={cam.deviceId} type="button" data-on={secondId === cam.deviceId ? "1" : "0"} onClick={() => void openSecond(cam.deviceId)}>
              {cameraName(cam, index)}
            </button>
          ))}
        </div>
      </div>

      <div className="tools" role="tablist">
        {(
          [
            ["exposure", "Exposure"],
            ["focus", "Focus"],
            ["monitor", "Monitor"],
            ["capture", "Capture"],
            ["studio", "Studio"],
            ["place", "Place"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" data-on={mode === id ? "1" : "0"} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>

      {mode === "exposure" && (
        <div className="fields">
          <Range label={`ISO ${settings.iso}`} min={0} max={ISOS.length - 1} step={1} value={ISOS.indexOf(settings.iso)} onChange={(index) => patch({ iso: ISOS[index] ?? 100 })} />
          <Range label={`Shutter ${formatShutter(speed)}`} min={0} max={SPEEDS.length - 1} step={1} value={Math.max(0, SPEEDS.indexOf(settings.shutter))} disabled={settings.lockAngle} onChange={(index) => patch({ shutter: SPEEDS[index] ?? 1 / 125 })} />
          <Check label="Shutter angle locks the speed to the frame rate" on={settings.lockAngle} set={(lockAngle) => patch({ lockAngle })} />
          <Range label={`Shutter angle ${settings.angle}°`} min={11} max={360} step={1} value={settings.angle} onChange={(angle) => patch({ angle })} />
          <label className="field">
            Frame rate {settings.fps}
            <select value={settings.fps} onChange={(event) => patch({ fps: Number(event.target.value) })}>
              {RATES.map((fps) => (
                <option key={fps} value={fps}>
                  {fps} fps{fps >= 60 ? " · high frame rate" : ""}
                </option>
              ))}
            </select>
          </label>
          <Range label={`Aperture f/${settings.aperture}`} min={0} max={STOPS.length - 1} step={1} value={Math.max(0, STOPS.indexOf(settings.aperture))} onChange={(index) => patch({ aperture: STOPS[index] ?? 4 })} />
          <Range label={`Kelvin ${settings.kelvin}`} min={2500} max={10000} step={50} value={settings.kelvin} onChange={(kelvin) => patch({ kelvin })} />
          <Range label={`Tint ${settings.tint}`} min={-50} max={50} step={1} value={settings.tint} onChange={(tint) => patch({ tint })} />
          <Range label={`ND ${settings.nd.toFixed(1)} stops`} min={0} max={8} step={0.1} value={settings.nd} onChange={(nd) => patch({ nd })} />
        </div>
      )}

      {mode === "focus" && (
        <div className="fields">
          <Range label="Manual focus" min={0} max={1} step={0.01} value={settings.focus} onChange={(focus) => patch({ focus })} />
          <Check label="Focus peaking" on={settings.peaking} set={(peaking) => patch({ peaking })} />
          <Check label="Focus magnification" on={settings.mag} set={(mag) => patch({ mag })} />
          <Range label="Pull from" min={0} max={1} step={0.01} value={settings.pullA} onChange={(pullA) => patch({ pullA })} />
          <Range label="Pull to" min={0} max={1} step={0.01} value={settings.pullB} onChange={(pullB) => patch({ pullB })} />
          <button className="btn" type="button" onClick={runPull}>
            Run focus pull
          </button>
          <label className="field">
            Anamorphic desqueeze
            <select value={settings.desqueeze} onChange={(event) => patch({ desqueeze: Number(event.target.value) })}>
              <option value={1}>None</option>
              <option value={1.33}>1.33×</option>
              <option value={1.5}>1.5×</option>
              <option value={2}>2×</option>
            </select>
          </label>
          <Check label="Electronic stabilisation crop" on={settings.steady} set={(steady) => patch({ steady })} />
        </div>
      )}

      {mode === "monitor" && (
        <div className="fields">
          <div className="scopes">
            <canvas ref={histRef} width={320} height={96} />
            <canvas ref={waveRef} width={320} height={96} />
            <canvas ref={vectorRef} width={160} height={160} />
          </div>
          <p className="lens-note">Histogram, waveform, vectorscope. The thin bar on the vectorscope is the microphone.</p>
          <label className="field">
            Look
            <select value={settings.lut} onChange={(event) => patch({ lut: event.target.value as Lut })}>
              <option value="neutral">Neutral</option>
              <option value="log">Log</option>
              <option value="film">Film</option>
              <option value="portrait">Portrait</option>
            </select>
          </label>
          <Check label="Zebra stripes" on={settings.zebra} set={(zebra) => patch({ zebra })} />
          <Range label={`Zebra at ${Math.round(settings.zebraAt * 100)}%`} min={0.6} max={1} step={0.01} value={settings.zebraAt} onChange={(zebraAt) => patch({ zebraAt })} />
          <Check label="False colour" on={settings.falseColor} set={(falseColor) => patch({ falseColor })} />
          <Check label="Clipping warning" on={settings.clip} set={(clip) => patch({ clip })} />
          <Check label="Rule of thirds" on={settings.thirds} set={(thirds) => patch({ thirds })} />
          <Check label="Golden ratio" on={settings.golden} set={(golden) => patch({ golden })} />
          <Check label="Safe area" on={settings.safe} set={(safe) => patch({ safe })} />
          <Check label="Scene parse — hold the sky, warm skin, lift foliage" on={settings.protect} set={(protect) => patch({ protect })} />
          <div className="readout">
            <div>
              <b>{Math.round(scene.sky * 100)}%</b>
              <span>Sky</span>
            </div>
            <div>
              <b>{Math.round(scene.leaf * 100)}%</b>
              <span>Foliage</span>
            </div>
            <div>
              <b>{Math.round(scene.stone * 100)}%</b>
              <span>Stone</span>
            </div>
            <div>
              <b>{Math.round(scene.skin * 100)}%</b>
              <span>Skin</span>
            </div>
          </div>
          <Check label="Microphone meter" on={settings.audio} set={(on) => void enableAudio(on)} />
          <Range
            label="Audio gain"
            min={0}
            max={2}
            step={0.05}
            value={settings.gain}
            onChange={(gain) => {
              patch({ gain });
              if (gainRef.current) gainRef.current.gain.value = gain;
            }}
          />
        </div>
      )}

      {mode === "capture" && (
        <div className="fields">
          <Range label={`Master bitrate ${settings.bitrate} Mb/s`} min={4} max={80} step={1} value={settings.bitrate} onChange={(bitrate) => patch({ bitrate })} />
          <Check label="Save a proxy JPEG as well" on={settings.proxy} set={(proxy) => patch({ proxy })} />
          <Check label="Save a PNG digital negative" on={settings.negative} set={(negative) => patch({ negative })} />
          <Check label="Keep the frames from just before the shutter" on={settings.preroll} set={(preroll) => patch({ preroll })} />
          <Check label="Smooth exposure across an interval" on={settings.smooth} set={(smooth) => patch({ smooth })} />
          <button className="btn" type="button" disabled={!canShoot || busy} onClick={() => void bracket()}>
            Exposure bracket ±2
          </button>
          <div className="fields two">
            <label className="field">
              Interval seconds
              <input type="number" min={1} max={120} value={intervalSec} onChange={(event) => setIntervalSec(Number(event.target.value))} />
            </label>
            <label className="field">
              Frames
              <input type="number" min={1} max={200} value={intervalCount} onChange={(event) => setIntervalCount(Number(event.target.value))} />
            </label>
          </div>
          <button className="btn ghost" type="button" disabled={!canShoot} onClick={startInterval}>
            {intervalRef.current ? "Stop interval" : "Start interval"}
          </button>
          <button className="btn ghost" type="button" disabled={!canShoot || busy} onClick={() => void focusStack()}>
            Focus stack
          </button>
          <button className="btn ghost" type="button" disabled={!canShoot || busy} onClick={() => void pixelStack()}>
            Pixel-shift stack, four frames
          </button>
          <label className="field">
            Copyright
            <input value={copyright} onChange={(event) => setCopyright(event.target.value)} />
          </label>
          <button className="btn ghost" type="button" onClick={() => void chooseFolder()}>
            Save into a folder
          </button>
        </div>
      )}

      {mode === "studio" && (
        <div className="fields">
          <button className="btn" type="button" onClick={() => void pictureInPicture()}>
            Virtual camera
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              const bus = new BroadcastChannel("thrives-shutter");
              bus.postMessage("fire");
              bus.close();
              void shoot("Remote", true);
            }}
          >
            Fire every open desk
          </button>
          <label className="field">
            Jam timecode
            <input value={jamText} onChange={(event) => setJamText(event.target.value)} />
          </label>
          <button className="btn ghost" type="button" onClick={jam}>
            Jam
          </button>
          <Check label="Dim the screen and slow the preview" on={settings.dim} set={(dim) => patch({ dim })} />
        </div>
      )}

      {mode === "place" && (
        <div className="fields">
          {shown ? (
            <article className="card">
              <h3>{shown.name}</h3>
              <p>
                {shown.year || "Year unrecorded"} · {Math.round(shown.distance)} m
              </p>
              <p>{shown.about}</p>
              {shown.href && (
                <a href={shown.href} target="_blank" rel="noreferrer">
                  Read the entry
                </a>
              )}
            </article>
          ) : (
            <p>{placeNote}</p>
          )}
          {places.map((place) => (
            <button key={place.id} className="btn ghost" type="button" onClick={() => setPinned(place.id === pinned ? null : place.id)}>
              {place.name}
              {place.year ? ` · ${place.year}` : ""}
              {place.id === pinned ? " · held" : ""}
            </button>
          ))}
        </div>
      )}

      <div className="shots">
        {shots.map((shot) => (
          <figure key={shot.url}>
            {shot.blob.type.startsWith("video") ? <video src={shot.url} controls playsInline /> : <img src={shot.url} alt={shot.note} />}
            <figcaption>{shot.note}</figcaption>
            <div className="row">
              <button className="btn" type="button" onClick={() => save(shot)}>
                Save
              </button>
              {!shot.blob.type.startsWith("video") && (
                <button className="btn ghost" type="button" onClick={() => onEdit(shot.url)}>
                  Edit
                </button>
              )}
              <button className="btn ghost" type="button" onClick={() => saveText(shot.meta, shot.name.replace(/\.\w+$/, ".json"))}>
                Notes
              </button>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );

  function currentSource() {
    const file = fileRef.current;
    const video = videoRef.current;
    if (file && file.complete && file.naturalWidth) {
      return { image: file, width: file.naturalWidth, height: file.naturalHeight, mirror: false };
    }
    if (video && video.videoWidth) {
      return { image: video, width: video.videoWidth, height: video.videoHeight, mirror: settingsRef.current.facing === "user" };
    }
    return null;
  }

  function metaFor(desk: Settings, place: PlaceHit | null, tag: string) {
    return {
      creator: "Tammy Nguyen",
      copyright,
      tag,
      iso: desk.iso,
      shutter: formatShutter(desk.lockAngle ? shutterFromAngle(desk.angle, desk.fps) : desk.shutter),
      shutterAngle: desk.angle,
      aperture: desk.aperture,
      kelvin: desk.kelvin,
      tint: desk.tint,
      nd: desk.nd,
      lut: desk.lut,
      fps: desk.fps,
      playbackFps: desk.fps >= 60 ? 24 : desk.fps,
      timecode: timecode(Date.now() - jamRef.current, desk.fps),
      place: place ? { name: place.name, year: place.year, about: place.about, href: place.href } : null,
      taken: new Date().toISOString(),
    };
  }
}

function cameraName(cam: MediaDeviceInfo, index: number) {
  const label = cam.label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)$/i, "").trim();
  return label || `Camera ${index + 1}`;
}

function facingOf(cam: MediaDeviceInfo): Facing {
  return /front|user|face/i.test(cam.label) ? "user" : "environment";
}

function Range({
  label,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="field">
      {label}
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Check({ label, on, set }: { label: string; on: boolean; set: (on: boolean) => void }) {
  return (
    <label className="check">
      <input type="checkbox" checked={on} onChange={(event) => set(event.target.checked)} />
      {label}
    </label>
  );
}

function toGrade(settings: Settings, bias: number): Grade {
  return {
    iso: settings.iso,
    shutter: settings.lockAngle ? shutterFromAngle(settings.angle, settings.fps) : settings.shutter,
    aperture: settings.aperture,
    nd: settings.nd,
    kelvin: settings.kelvin,
    tint: settings.tint,
    lut: settings.lut,
    bias,
  };
}

async function linkFocus(track: MediaStreamTrack, focus: number) {
  const caps = track.getCapabilities?.() as MediaTrackCapabilities & {
    focusMode?: string[];
    focusDistance?: { min: number; max: number };
  };
  const advanced: MediaTrackConstraintSet[] = [];
  if (caps.focusMode?.includes("manual")) advanced.push({ focusMode: "manual" } as MediaTrackConstraintSet);
  if (caps.focusDistance) {
    const distance = caps.focusDistance.max - focus * (caps.focusDistance.max - caps.focusDistance.min);
    advanced.push({ focusDistance: distance } as MediaTrackConstraintSet);
  }
  if (!advanced.length) return false;
  try {
    await track.applyConstraints({ advanced });
    const applied = track.getSettings() as MediaTrackSettings & { focusMode?: string };
    return applied.focusMode === "manual";
  } catch {
    return false;
  }
}

function guides(ctx: CanvasRenderingContext2D, w: number, h: number, settings: Settings, paper: string) {
  ctx.save();
  ctx.strokeStyle = paper;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1;
  if (settings.thirds) {
    ctx.beginPath();
    for (const part of [1 / 3, 2 / 3]) {
      ctx.moveTo(w * part, 0);
      ctx.lineTo(w * part, h);
      ctx.moveTo(0, h * part);
      ctx.lineTo(w, h * part);
    }
    ctx.stroke();
  }
  if (settings.golden) {
    const phi = 1 / 1.618;
    ctx.beginPath();
    for (const part of [phi, 1 - phi]) {
      ctx.moveTo(w * part, 0);
      ctx.lineTo(w * part, h);
      ctx.moveTo(0, h * part);
      ctx.lineTo(w, h * part);
    }
    ctx.stroke();
  }
  if (settings.safe) {
    ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);
    ctx.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
  }
  ctx.restore();
}

function magnify(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const mw = Math.max(2, Math.round(w / 4));
  const mh = Math.max(2, Math.round(h / 4));
  const crop = ctx.getImageData((w - mw) / 2, (h - mh) / 2, mw, mh);
  const hold = document.createElement("canvas");
  hold.width = mw;
  hold.height = mh;
  hold.getContext("2d")?.putImageData(crop, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(hold, 0, 0, w, h);
}

async function bake(
  source: { image: CanvasImageSource; width: number; height: number; mirror: boolean },
  settings: Settings,
  overlays: boolean,
) {
  const long = Math.max(source.width * settings.desqueeze, source.height);
  const scale = long > 2560 ? 2560 / long : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(source.width * settings.desqueeze * scale));
  canvas.height = Math.max(2, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  if (source.mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source.image, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  gradeFrame(frame.data, canvas.width, canvas.height, toGrade(settings, 0), {
    zebra: overlays && settings.zebra,
    zebraAt: settings.zebraAt,
    falseColor: overlays && settings.falseColor,
    clip: false,
    peaking: false,
    blinkOn: false,
    protect: settings.protect,
    sample: false,
    peak: [0, 0, 0],
  });
  ctx.putImageData(frame, 0, 0);
  const jpeg = await blobOf(canvas, "image/jpeg", 0.92);
  const png = await blobOf(canvas, "image/png");
  const proxyCanvas = document.createElement("canvas");
  proxyCanvas.width = 1280;
  proxyCanvas.height = Math.max(2, Math.round((1280 / canvas.width) * canvas.height));
  proxyCanvas.getContext("2d")?.drawImage(canvas, 0, 0, proxyCanvas.width, proxyCanvas.height);
  const proxy = await blobOf(proxyCanvas, "image/jpeg", 0.8);
  return { jpeg, png, proxy, pixels: frame.data };
}

function blobOf(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), type, quality);
  });
}

async function writeFile(dir: FileSystemDirectoryHandle, shot: Shot, meta: string) {
  const image = await dir.getFileHandle(shot.name, { create: true });
  const imageOut = await image.createWritable();
  await imageOut.write(shot.blob);
  await imageOut.close();
  const notes = await dir.getFileHandle(shot.name.replace(/\.\w+$/, ".json"), { create: true });
  const notesOut = await notes.createWritable();
  await notesOut.write(meta);
  await notesOut.close();
}

function save(shot: Shot) {
  const link = document.createElement("a");
  link.href = shot.url;
  link.download = shot.name;
  link.click();
}

function saveText(text: string, name: string) {
  const blob = new Blob([text], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
}

function paintHist(canvas: HTMLCanvasElement | null, series: number[][]) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const colors = ["rgba(243,238,230,0.9)", "rgba(180,70,60,0.8)", "rgba(70,140,80,0.8)", "rgba(70,110,170,0.8)"];
  series.forEach((bins, index) => {
    ctx.fillStyle = colors[index] ?? colors[0]!;
    const bar = width / bins.length;
    bins.forEach((value, i) => ctx.fillRect(i * bar, height - value * (height - 6), Math.max(1, bar - 1), value * (height - 6)));
  });
}

function paintWave(canvas: HTMLCanvasElement | null, wave: number[]) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(243,238,230,0.95)";
  ctx.beginPath();
  wave.forEach((value, index) => {
    const x = (index / Math.max(1, wave.length - 1)) * canvas.width;
    const y = canvas.height - value * canvas.height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function paintVector(canvas: HTMLCanvasElement | null, bins: number[]) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cell = canvas.width / 16;
  bins.forEach((value, index) => {
    if (value < 0.04) return;
    ctx.globalAlpha = 0.25 + value * 0.75;
    ctx.fillStyle = "rgba(196,162,122,0.95)";
    ctx.fillRect((index % 16) * cell, Math.floor(index / 16) * cell, cell, cell);
  });
  ctx.globalAlpha = 1;
}

function timecode(ms: number, fps: number) {
  const rate = Math.max(1, Math.round(fps));
  const framesTotal = Math.max(0, Math.floor((ms / 1000) * rate));
  const frames = framesTotal % rate;
  const seconds = Math.floor(framesTotal / rate);
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;
  return [hh, mm, ss].map((part) => String(part).padStart(2, "0")).join(":") + ":" + String(frames).padStart(2, "0");
}

function rgb(color: string): [number, number, number] {
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return [141, 98, 56];
  probe.fillStyle = color;
  const hex = probe.fillStyle;
  if (!hex.startsWith("#") || hex.length < 7) return [141, 98, 56];
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dφ = ((lat2 - lat1) * Math.PI) / 180;
  const dλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dλ / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
}
