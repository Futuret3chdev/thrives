import { useEffect, useRef, useState } from "react";

export function Camera({ onEdit }: { onEdit: (url: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [live, setLive] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function openCamera(next: "user" | "environment") {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setFacing(next);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: next, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setLive(true);
      setError(null);
    } catch {
      setLive(false);
      setError("The camera needs permission. A digital file still opens below.");
    }
  }

  function snap() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setShots((current) => [URL.createObjectURL(blob), ...current].slice(0, 12));
      },
      "image/jpeg",
      0.92,
    );
  }

  function takeFile(file: File) {
    setShots((current) => [URL.createObjectURL(file), ...current].slice(0, 12));
  }

  function download(url: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = `thrives-${Date.now()}.jpg`;
    link.click();
  }

  return (
    <div className="panel">
      <div className="stage camera-stage">
        <video ref={videoRef} playsInline muted autoPlay className={facing === "user" ? "mirror" : ""} />
        {!live && <p className="camera-wait">Camera is off until you open it.</p>}
      </div>
      {error && <p>{error}</p>}
      <div className="row">
        <button className="btn" type="button" onClick={() => openCamera(facing)}>
          Open camera
        </button>
        <button className="btn ghost" type="button" onClick={() => openCamera(facing === "user" ? "environment" : "user")}>
          Flip
        </button>
        <button className="btn" type="button" onClick={snap} disabled={!live}>
          Shutter
        </button>
      </div>
      <label className="field">
        Digital file (JPEG, PNG, WebP)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) takeFile(file);
          }}
        />
      </label>
      <div className="shots">
        {shots.map((url) => (
          <figure key={url}>
            <img src={url} alt="A frame from this session" />
            <div className="row">
              <button className="btn" type="button" onClick={() => download(url)}>
                JPEG
              </button>
              <button className="btn ghost" type="button" onClick={() => onEdit(url)}>
                Edit
              </button>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
