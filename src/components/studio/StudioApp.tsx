import { useState } from "react";
import { INSTAGRAM, EMAIL, PLATES, SERVICES } from "./content";
import { Skyline } from "./Skyline";
import { Bench, BookForm } from "./Bench";
import { Rates } from "./Rates";

type Page = "studio" | "work" | "services" | "rates" | "bench" | "book";

export function StudioApp() {
  const [page, setPage] = useState<Page>("studio");
  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <b>THRIVES</b>
          <span>Tammy Nguyen · CFO & Lead Photographer</span>
        </div>
        <div className="socials">
          <a className="ig-mark" href={INSTAGRAM} target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#f9ce34" />
                  <stop offset="0.45" stopColor="#ee2a7b" />
                  <stop offset="1" stopColor="#6228d7" />
                </linearGradient>
              </defs>
              <rect width="24" height="24" rx="6" fill="url(#ig)" />
              <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
              <circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" strokeWidth="1.7" />
              <circle cx="16.5" cy="7.6" r="0.9" fill="#fff" />
            </svg>
          </a>
          <a className="mail-mark" href={`mailto:${EMAIL}`} aria-label="Email">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10.2" fill="#fff" stroke="#1c1712" strokeWidth="1.6" />
              <path d="M6.2 8.6h11.6v7.2H6.2z" fill="#1c1712" />
              <path d="M6.2 8.6l5.8 4.2 5.8-4.2" fill="none" stroke="#fff" strokeWidth="1.3" />
            </svg>
          </a>
        </div>
        <nav className="nav">
          {(
            [
              ["studio", "Studio"],
              ["work", "Portfolio"],
              ["services", "Services"],
              ["rates", "Rates"],
              ["bench", "Bench"],
              ["book", "Book"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" data-on={page === id ? "1" : "0"} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
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
              <div className="actions">
                <button className="btn" type="button" onClick={() => setPage("bench")}>
                  Open the bench
                </button>
                <button className="btn ghost" type="button" onClick={() => setPage("work")}>
                  See the portfolio
                </button>
                <button className="btn ghost" type="button" onClick={() => setPage("rates")}>
                  Rates
                </button>
              </div>
            </div>
            <figure className="plate">
              <img src="/plates/melbourne-lane.jpg" alt="A Melbourne bluestone warehouse lane at dusk" />
              <figcaption>A bluestone lane way · Melbourne</figcaption>
            </figure>
          </section>
          <Skyline />
        </>
      )}

      {page === "work" && (
        <section className="section">
          <p className="kicker">Portfolio</p>
          <h2>Chosen frames from Instagram</h2>
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
          <p style={{ marginTop: "1.5rem", opacity: 0.7 }}>
            <a href={INSTAGRAM} target="_blank" rel="noreferrer">
              View the full Instagram feed →
            </a>
          </p>
        </section>
      )}

      {page === "services" && (
        <section className="section">
          <p className="kicker">Services</p>
          <h2>What the studio takes on</h2>
          <div className="grid">
            {SERVICES.map((item) => (
              <article className="card service" key={item.title}>
                <img src={item.image} alt="" />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {page === "rates" && <Rates onBook={() => setPage("book")} />}

      {page === "bench" && <Bench />}
      {page === "book" && (
        <section className="section">
          <p className="kicker">Book</p>
          <h2>A time, and Tammy quotes you in person.</h2>
          <BookForm />
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div className="card" style={{ flex: "1 1 200px", padding: "1.2rem" }}>
              <h3 style={{ margin: "0 0 0.5rem" }}>Sun</h3>
              <p style={{ margin: 0, opacity: 0.8 }}>Daylight and golden-hour planning for the location.</p>
            </div>
            <div className="card" style={{ flex: "1 1 200px", padding: "1.2rem" }}>
              <h3 style={{ margin: "0 0 0.5rem" }}>Ledger</h3>
              <p style={{ margin: 0, opacity: 0.8 }}>Job notes, rates and the quote that leaves with the pictures.</p>
            </div>
          </div>
        </section>
      )}

      <footer className="foot">
        <p>
          Tammy Nguyen, CFO and Lead Photographer.{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          {" · "}
          <a href={INSTAGRAM} target="_blank" rel="noreferrer">
            Instagram
          </a>
        </p>
      </footer>
    </div>
  );
}
