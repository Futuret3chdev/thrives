import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  RATIOS,
  type Job,
  type Sensor,
  depthOfField,
  evAtIso,
  formatHour,
  formatShutter,
  guideAperture,
  jobTotal,
  loadJobs,
  metres,
  printNeed,
  saveJobs,
  secondsFor,
  sunDay,
  crossHour,
} from "@/lib/photo/calc";
import { LOOKS, applyLook } from "@/lib/photo/looks";
import { EMAIL, SERVICES } from "./content";
import { Camera } from "./Camera";
import { Darkroom } from "./Darkroom";

type Tool = "Camera" | "Darkroom" | "Meter" | "Focus" | "Grade" | "Frame" | "Sun" | "Ledger" | "Book";

export function Bench() {
  const [tool, setTool] = useState<Tool>("Camera");
  const [plate, setPlate] = useState("/plates/tammy.jpg");
  return (
    <section className="section" id="bench">
      <p className="kicker">The bench</p>
      <h2>What the day needs</h2>
      <div className="bench">
        <Camera
          onBench={(name) => setTool(name)}
          onEdit={(url) => {
            setPlate(url);
            setTool("Darkroom");
          }}
        >
          <div className="tools under-cam">
            <button type="button" data-on={tool === "Sun" ? "1" : "0"} onClick={() => setTool(tool === "Sun" ? "Camera" : "Sun")}>
              Sun
            </button>
            <button type="button" data-on={tool === "Ledger" ? "1" : "0"} onClick={() => setTool(tool === "Ledger" ? "Camera" : "Ledger")}>
              Ledger
            </button>
            <button type="button" data-on={tool === "Book" ? "1" : "0"} onClick={() => setTool(tool === "Book" ? "Camera" : "Book")}>
              Book
            </button>
          </div>
        </Camera>
        {tool === "Darkroom" && <Darkroom src={plate} />}
        {tool === "Meter" && <Meter />}
        {tool === "Focus" && <Focus />}
        {tool === "Grade" && <Grade />}
        {tool === "Frame" && <Frame />}
        {tool === "Sun" && <Sun />}
        {tool === "Ledger" && <Ledger />}
        {tool === "Book" && <BookForm />}
      </div>
    </section>
  );
}

export function BookForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(SERVICES[0]?.title ?? "Sitting");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [note, setNote] = useState("");
  const body = `Name: ${name}\nEmail: ${email}\nService: ${service}\nPreferred date: ${date}\nPreferred time: ${time}\nNotes: ${note}\n\nA time, and Tammy quotes in person.`;
  const href = `mailto:${EMAIL}?cc=${encodeURIComponent(email)}&subject=${encodeURIComponent(`Booking request from ${name || "a client"}`)}&body=${encodeURIComponent(body)}`;
  return (
    <form className="panel" onSubmit={(event) => event.preventDefault()}>
      <label className="field">
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="field">
        Your email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="field">
        Service
        <select value={service} onChange={(event) => setService(event.target.value)}>
          {SERVICES.map((item) => (
            <option key={item.title}>{item.title}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Preferred date
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="field">
        Preferred time
        <select value={time} onChange={(event) => setTime(event.target.value)}>
          {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((slot) => (
            <option key={slot}>{slot}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Notes
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Place, people, what the picture is for" />
      </label>
      <div className="quote-actions">
        <a className="btn" href={href}>
          Email quote
        </a>
        <button className="btn ghost" type="button" onClick={() => downloadBooking(name, body)}>
          Download
        </button>
        <button className="btn ghost" type="button" onClick={() => void shareBooking(name, body)}>
          Share
        </button>
      </div>
    </form>
  );
}

function bookingFile(name: string, body: string) {
  const lines = ["THRIVES", "Booking", "", ...body.split("\n")];
  const blob = quotePdf(lines);
  const fileName = `thrives-booking-${(name || "client").replace(/\s+/g, "-").toLowerCase()}.pdf`;
  return { blob, fileName, file: new File([blob], fileName, { type: "application/pdf" }) };
}

function downloadBooking(name: string, body: string) {
  const { blob, fileName } = bookingFile(name, body);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
}

async function shareBooking(name: string, body: string) {
  const { file } = bookingFile(name, body);
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "THRIVES booking", text: body });
    return;
  }
  if (navigator.share) {
    await navigator.share({ title: "THRIVES booking", text: body });
    return;
  }
  downloadBooking(name, body);
}

function Meter() {
  const [iso, setIso] = useState(200);
  const [f, setF] = useState(2.8);
  const [seconds, setSeconds] = useState(1 / 125);
  const [scene, setScene] = useState(13);
  const ev = evAtIso(f, seconds, iso);
  const match = secondsFor(f, scene, iso);
  return (
    <div className="panel">
      <div className="fields two">
        <Field label={`ISO ${iso}`}>
          <input type="range" min={50} max={6400} step={50} value={iso} onChange={(e) => setIso(Number(e.target.value))} />
        </Field>
        <Field label={`Aperture f/${f.toFixed(1)}`}>
          <input type="range" min={1} max={22} step={0.1} value={f} onChange={(e) => setF(Number(e.target.value))} />
        </Field>
        <Field label={`Shutter ${formatShutter(seconds)}`}>
          <input
            type="range"
            min={-12}
            max={2}
            step={0.1}
            value={Math.log2(seconds)}
            onChange={(e) => setSeconds(2 ** Number(e.target.value))}
          />
        </Field>
        <Field label={`Scene EV ${scene}`}>
          <input type="range" min={2} max={16} step={0.5} value={scene} onChange={(e) => setScene(Number(e.target.value))} />
        </Field>
      </div>
      <div className="readout">
        <div>
          <span>This exposure</span>
          <b>EV {ev.toFixed(1)}</b>
        </div>
        <div>
          <span>Match the scene</span>
          <b>{formatShutter(match)}</b>
        </div>
      </div>
      <p>A guide number of 40 at 5 metres and this ISO wants about f/{guideAperture(40, 5, iso).toFixed(1)}.</p>
    </div>
  );
}

function Focus() {
  const [focal, setFocal] = useState(50);
  const [f, setF] = useState(2.8);
  const [distance, setDistance] = useState(3);
  const [sensor, setSensor] = useState<Sensor>("full");
  const dof = depthOfField(focal, f, distance, sensor);
  return (
    <div className="panel">
      <div className="fields two">
        <Field label={`Focal ${focal} mm`}>
          <input type="range" min={14} max={400} step={1} value={focal} onChange={(e) => setFocal(Number(e.target.value))} />
        </Field>
        <Field label={`f/${f.toFixed(1)}`}>
          <input type="range" min={1.2} max={22} step={0.1} value={f} onChange={(e) => setF(Number(e.target.value))} />
        </Field>
        <Field label={`Distance ${distance.toFixed(1)} m`}>
          <input type="range" min={0.4} max={40} step={0.1} value={distance} onChange={(e) => setDistance(Number(e.target.value))} />
        </Field>
        <Field label="Sensor">
          <select value={sensor} onChange={(e) => setSensor(e.target.value as Sensor)}>
            <option value="full">Full frame</option>
            <option value="apsc">APS-C</option>
            <option value="m43">Micro four thirds</option>
          </select>
        </Field>
      </div>
      <div className="readout">
        <div>
          <span>Near</span>
          <b>{metres(dof.nearMm)}</b>
        </div>
        <div>
          <span>Far</span>
          <b>{metres(dof.farMm)}</b>
        </div>
        <div>
          <span>Hyperfocal</span>
          <b>{metres(dof.hyperMm)}</b>
        </div>
        <div>
          <span>In focus</span>
          <b>{metres(dof.dofMm)}</b>
        </div>
      </div>
    </div>
  );
}

function Grade() {
  const [url, setUrl] = useState("/plates/bank.jpg");
  const [exposure, setExposure] = useState(0);
  const [contrast, setContrast] = useState(1);
  const [warmth, setWarmth] = useState(8);
  const [fade, setFade] = useState(0.08);
  const [look, setLook] = useState("none");
  const canvas = useRef<HTMLCanvasElement>(null);
  const [bins, setBins] = useState<number[]>(Array.from({ length: 32 }, () => 0));

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => paint(img);
    img.src = url;
    function paint(image: HTMLImageElement) {
      const node = canvas.current;
      if (!node) return;
      const maxW = 960;
      const scale = Math.min(1, maxW / image.width);
      node.width = Math.round(image.width * scale);
      node.height = Math.round(image.height * scale);
      const ctx = node.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, 0, 0, node.width, node.height);
      const frame = ctx.getImageData(0, 0, node.width, node.height);
      const data = frame.data;
      const next = Array.from({ length: 32 }, () => 0);
      const gain = 2 ** exposure;
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i]! / 255;
        let g = data[i + 1]! / 255;
        let b = data[i + 2]! / 255;
        r = (r - 0.5) * contrast + 0.5;
        g = (g - 0.5) * contrast + 0.5;
        b = (b - 0.5) * contrast + 0.5;
        r = r * gain + warmth / 255;
        b = b * gain - warmth / 255;
        r = r * (1 - fade) + fade * 0.92;
        g = g * (1 - fade) + fade * 0.86;
        b = b * (1 - fade) + fade * 0.74;
        const px = (i / 4) % node.width;
        const py = Math.floor(i / 4 / node.width);
        [r, g, b] = applyLook(r, g, b, look, px / node.width, py / node.height);
        data[i] = clampByte(r * 255);
        data[i + 1] = clampByte(g * 255);
        data[i + 2] = clampByte(b * 255);
        const y = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
        next[Math.min(31, (y / 256) * 32 | 0)]! += 1;
      }
      const peak = Math.max(...next, 1);
      setBins(next.map((n) => n / peak));
      ctx.putImageData(frame, 0, 0);
    }
  }, [url, exposure, contrast, warmth, fade, look]);

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
        <Field label="Plate">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setUrl(URL.createObjectURL(file));
            }}
          />
        </Field>
        <Field label={`Exposure ${exposure.toFixed(1)}`}>
          <input type="range" min={-2} max={2} step={0.05} value={exposure} onChange={(e) => setExposure(Number(e.target.value))} />
        </Field>
        <Field label={`Contrast ${contrast.toFixed(2)}`}>
          <input type="range" min={0.6} max={1.8} step={0.02} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} />
        </Field>
        <Field label={`Warmth ${warmth}`}>
          <input type="range" min={-40} max={40} step={1} value={warmth} onChange={(e) => setWarmth(Number(e.target.value))} />
        </Field>
        <Field label="Filter">
          <select value={look} onChange={(e) => setLook(e.target.value)}>
            {LOOKS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.group}: {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fade">
          <input type="range" min={0} max={0.45} step={0.01} value={fade} onChange={(e) => setFade(Number(e.target.value))} />
        </Field>
      </div>
      <button
        className="btn"
        type="button"
        onClick={() => {
          const node = canvas.current;
          if (!node) return;
          const a = document.createElement("a");
          a.href = node.toDataURL("image/jpeg", 0.92);
          a.download = "thrives-grade.jpg";
          a.click();
        }}
      >
        Save grade
      </button>
    </div>
  );
}

function Frame() {
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]["id"]>("3:2");
  const [guide, setGuide] = useState<"thirds" | "golden" | "diagonal">("thirds");
  const [printW, setPrintW] = useState(16);
  const [dpi, setDpi] = useState(300);
  const spec = RATIOS.find((item) => item.id === ratio) ?? RATIOS[0];
  const printH = (printW * spec.h) / spec.w;
  const need = printNeed(printW, printH, dpi);
  return (
    <div className="panel">
      <div className="stage frame-stage" style={{ aspectRatio: `${spec.w} / ${spec.h}` }}>
        <img src="/plates/melbourne-lane.jpg" alt="A bluestone lane way, Melbourne, with a crop guide" />
        <svg className="overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
          {guide === "thirds" && (
            <g stroke="#f3eee6" strokeWidth="0.6" opacity="0.85">
              <path d="M33.3 0 v100 M66.6 0 v100 M0 33.3 h100 M0 66.6 h100" />
            </g>
          )}
          {guide === "golden" && (
            <g stroke="#c4a27a" strokeWidth="0.7" fill="none">
              <rect x="0" y="0" width="61.8" height="61.8" />
              <rect x="61.8" y="0" width="38.2" height="38.2" />
            </g>
          )}
          {guide === "diagonal" && (
            <g stroke="#f3eee6" strokeWidth="0.6">
              <path d="M0 100 L100 0 M0 0 L100 100" />
            </g>
          )}
        </svg>
      </div>
      <div className="tools">
        {RATIOS.map((item) => (
          <button key={item.id} type="button" data-on={ratio === item.id ? "1" : "0"} onClick={() => setRatio(item.id)}>
            {item.id}
          </button>
        ))}
      </div>
      <div className="tools">
        {(["thirds", "golden", "diagonal"] as const).map((name) => (
          <button key={name} type="button" data-on={guide === name ? "1" : "0"} onClick={() => setGuide(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className="fields two">
        <Field label={`Print width ${printW} in`}>
          <input type="range" min={4} max={40} step={1} value={printW} onChange={(e) => setPrintW(Number(e.target.value))} />
        </Field>
        <Field label={`DPI ${dpi}`}>
          <input type="range" min={150} max={600} step={10} value={dpi} onChange={(e) => setDpi(Number(e.target.value))} />
        </Field>
      </div>
      <div className="readout">
        <div>
          <span>Print</span>
          <b>
            {printW} × {printH.toFixed(1)}
          </b>
        </div>
        <div>
          <span>Need</span>
          <b>
            {need.pxW} × {need.pxH}
          </b>
        </div>
      </div>
    </div>
  );
}

function Sun() {
  const [lat, setLat] = useState(-37.8);
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 10));
  const marks = useMemo(() => sunDay(new Date(when + "T12:00:00"), lat), [lat, when]);
  const rise = crossHour(marks, 0, true);
  const set = crossHour(marks, 0, false);
  const goldStart = crossHour(marks, 6, true);
  const goldEnd = crossHour(marks, 6, false);
  const max = Math.max(...marks.map((m) => m.altitude), 1);
  return (
    <div className="panel">
      <div className="fields two">
        <Field label="Latitude">
          <input type="number" step="0.1" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
        </Field>
        <Field label="Date">
          <input type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
      </div>
      <div className="hist" aria-hidden="true">
        {marks.filter((_, i) => i % 2 === 0).map((m) => (
          <i key={m.hour} style={{ height: `${Math.max(2, ((m.altitude + 20) / (max + 20)) * 100)}%` }} />
        ))}
      </div>
      <div className="readout">
        <div>
          <span>Sunrise</span>
          <b>{formatHour(rise)}</b>
        </div>
        <div>
          <span>Sunset</span>
          <b>{formatHour(set)}</b>
        </div>
        <div>
          <span>Gold starts</span>
          <b>{formatHour(goldStart)}</b>
        </div>
        <div>
          <span>Gold ends</span>
          <b>{formatHour(goldEnd)}</b>
        </div>
      </div>
      <p>Melbourne is about −37.8. Gold here is when the sun is under six degrees. Times are solar, not civil clock.</p>
    </div>
  );
}

function Ledger() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [client, setClient] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [hours, setHours] = useState(6);
  const [rate, setRate] = useState(180);
  const [expenses, setExpenses] = useState(40);
  const [tax, setTax] = useState(10);
  const [deposit, setDeposit] = useState(40);
  useEffect(() => setJobs(loadJobs()), []);
  const draft = jobTotal({ id: "", client, date: "", hours, rate, expenses, tax, deposit, note: "" });
  const book = jobs.reduce((sum, job) => sum + jobTotal(job).gross, 0);
  return (
    <div className="panel">
      <div className="fields two">
        <Field label="Client">
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Estate, magazine, family" />
        </Field>
        <Field label="Client email">
          <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" />
        </Field>
        <Field label="Hours">
          <input type="number" min={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
        </Field>
        <Field label="Day rate portion">
          <input type="number" min={0} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </Field>
        <Field label="Expenses">
          <input type="number" min={0} value={expenses} onChange={(e) => setExpenses(Number(e.target.value))} />
        </Field>
        <Field label="Tax %">
          <input type="number" min={0} value={tax} onChange={(e) => setTax(Number(e.target.value))} />
        </Field>
        <Field label="Deposit %">
          <input type="number" min={0} max={100} value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} />
        </Field>
      </div>
      <div className="readout">
        <div>
          <span>Quote</span>
          <b>${draft.gross.toFixed(0)}</b>
        </div>
        <div>
          <span>Deposit due</span>
          <b>${draft.due.toFixed(0)}</b>
        </div>
      </div>
      <button className="btn" type="button" onClick={() => sendQuote(client, clientEmail, hours, rate, expenses, tax, draft.gross, draft.due)}>
        Send quote
      </button>
      <button className="btn ghost" type="button" onClick={() => void shareQuote(client, hours, rate, expenses, tax, draft.gross, draft.due)}>
        Download and share
      </button>
      <button
        className="btn ghost"
        type="button"
        onClick={() => {
          if (!client.trim()) return;
          const next = [
            { id: crypto.randomUUID(), client: client.trim(), date: new Date().toISOString().slice(0, 10), hours, rate, expenses, tax, deposit, note: "" },
            ...jobs,
          ];
          setJobs(next);
          saveJobs(next);
        }}
      >
        Keep this job on the phone
      </button>
      <div className="jobs">
        {jobs.map((job) => (
          <div className="job" key={job.id}>
            <div>
              <strong>{job.client}</strong>
              <div>
                {job.date} · ${jobTotal(job).gross.toFixed(0)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = jobs.filter((item) => item.id !== job.id);
                setJobs(next);
                saveJobs(next);
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <p>Booked on this phone: ${book.toFixed(0)}. Stays in this browser.</p>
    </div>
  );
}

function quoteLines(client: string, hours: number, rate: number, expenses: number, tax: number, gross: number, due: number) {
  return [
    "THRIVES",
    "Tammy Nguyen, CFO and Lead Photographer",
    "Tammy.n@futuret3ch.com.au",
    "",
    "Quote",
    `Client: ${client.trim() || "To be named"}`,
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    `Hours: ${hours}`,
    `Day rate portion: $${rate}`,
    `Expenses: $${expenses}`,
    `Tax: ${tax}%`,
    `Quote: $${gross.toFixed(0)}`,
    `Deposit due: $${due.toFixed(0)}`,
    "",
    "A time, and Tammy quotes you in person.",
  ];
}

function sendQuote(client: string, clientEmail: string, hours: number, rate: number, expenses: number, tax: number, gross: number, due: number) {
  const to = clientEmail.trim();
  const subject = `Quote for ${client.trim() || "your shoot"}`;
  const body = quoteLines(client, hours, rate, expenses, tax, gross, due).join("\n");
  const href = to
    ? `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(EMAIL)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

async function shareQuote(client: string, hours: number, rate: number, expenses: number, tax: number, gross: number, due: number) {
  const blob = quotePdf(quoteLines(client, hours, rate, expenses, tax, gross, due));
  const name = `thrives-quote-${(client || "client").replace(/\s+/g, "-").toLowerCase()}.pdf`;
  const file = new File([blob], name, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "THRIVES quote", text: "Quote from Tammy Nguyen" });
    return;
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
}

function quotePdf(lines: string[]) {
  const content = lines
    .map((line, index) => `BT /F1 12 Tf 48 ${760 - index * 18} Td (${line.replace(/[()\\]/g, " ").replace(/[^\x20-\x7E]/g, " ")}) Tj ET`)
    .join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += object;
  }
  const start = pdf.length;
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (let index = 1; index <= 5; index += 1) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

