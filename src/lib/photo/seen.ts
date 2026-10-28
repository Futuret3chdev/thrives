export type Seen = {
  label: string;
  also: string;
  placeLike: boolean;
};

type Predictor = {
  classify: (
    img: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
    topk?: number,
  ) => Promise<Array<{ className: string; probability: number }>>;
};

let loading: Promise<Predictor> | null = null;

export function loadSeen() {
  if (!loading) {
    loading = (async () => {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const mobilenet = await import("@tensorflow-models/mobilenet");
      return mobilenet.load({ version: 2, alpha: 0.5 });
    })();
  }
  return loading;
}

export async function seeFrame(source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement): Promise<Seen | null> {
  const model = await loadSeen();
  const guesses = await model.classify(source, 3);
  const useful = guesses.filter((guess) => guess.probability >= 0.08).map((guess) => tidy(guess.className));
  const label = useful[0];
  if (!label) return null;
  const also = useful.find((name) => name !== label) ?? "";
  return { label, also, placeLike: isPlace(label) || isPlace(also) };
}

function tidy(className: string) {
  const first = className.split(",")[0]?.trim() ?? className;
  return first.replace(/[_-]+/g, " ");
}

function isPlace(label: string) {
  return /church|palace|castle|monastery|mosque|temple|barn|house|home|building|bridge|tower|lighthouse|dome|library|museum|theatre|theater|cinema|station|boathouse|greenhouse|fountain|viaduct|dam|prison|shop|store|restaurant|hotel|school|bank|mill|warehouse|facade|arch|monument|ruins|cottage|mansion|villa|chapel|cathedral|fort|dock|pier|alley|street|cliff|beacon/i.test(
    label,
  );
}
