import { useState } from "react";
import { INSTAGRAM, EMAIL, PLATES, SERVICES } from "./content";
import { Skyline } from "./Skyline";
import { Bench } from "./Bench";

type Page = "studio" | "work" | "services" | "bench";

export function StudioApp() {
  const [page, setPage] = useState<Page>("studio");
  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <b>THRIVES</b>
          <span>Tammy Nguyen · CFO & Lead Photographer</span>
        </div>
        <nav className="nav">
          {(
            [
              ["studio", "Studio"],
              ["work", "Work"],
              ["services", "Services"],
              ["bench", "Bench"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" data-on={page === id ? "1" : "0"} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
          <a className="ig" href={INSTAGRAM} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a className="ig" href={`mailto:${EMAIL}`}>
            Email
          </a>
        </nav>
      </header>

      {page === "studio" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <p className="kicker">Old buildings, kept</p>
              <h1>The light stays in the stone.</h1>
              <p className="lede">
                Tammy Nguyen photographs the rooms and facades that outlast a lease. She is the lead photographer and the CFO, so the picture and the invoice leave together.
              </p>
              <div className="row">
                <button className="btn" type="button" onClick={() => setPage("bench")}>
                  Open the bench
                </button>
                <button className="btn ghost" type="button" onClick={() => setPage("work")}>
                  See the work
                </button>
              </div>
            </div>
            <figure className="plate">
              <img src="/plates/mill.jpg" alt="A limestone mill at dusk beside the river" />
              <figcaption>River mill · dusk</figcaption>
            </figure>
          </section>
          <Skyline />
        </>
      )}

      {page === "work" && (
        <section className="section">
          <p className="kicker">Plates</p>
          <h2>Buildings that still work</h2>
          <div className="work">
            {PLATES.map((plate) => (
              <figure key={plate.src}>
                <img src={plate.src} alt={plate.title} />
                <figcaption>
                  {plate.title}
                  <em>{plate.place}</em>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {page === "services" && (
        <section className="section">
          <p className="kicker">Services</p>
          <h2>What the studio takes on</h2>
          <div className="grid">
            {SERVICES.map((item) => (
              <article className="card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {page === "bench" && <Bench />}

      <footer className="foot">
        <p>
          Tammy Nguyen, CFO and Lead Photographer.{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          {" · "}
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">
            Instagram
          </a>
          . Add THRIVES to the iPhone home screen from the share menu.
        </p>
      </footer>
    </div>
  );
}
