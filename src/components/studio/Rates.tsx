import { EMAIL, RATES } from "./content";

export function Rates({ onBook }: { onBook: () => void }) {
  return (
    <section className="section">
      <div className="sheet">
        <div className="sheet-head">
          <div className="sheet-mark">
            <b>THRIVES</b>
            <span>Tammy Nguyen</span>
          </div>
          <h2>Price list</h2>
        </div>
        <div className="sheet-body">
          <figure>
            <img src="/plates/tammy.jpg" alt="Tammy Nguyen holding a camera, with a parrot in the foreground" />
          </figure>
          <div className="sheet-list">
            {RATES.map((group) => (
              <div key={group.group}>
                <p className="sheet-group">{group.group}</p>
                {group.items.map((item) => (
                  <article key={item.title}>
                    <h3>{item.title}</h3>
                    <ul>
                      {item.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
        <button className="sheet-foot" type="button" onClick={onBook}>
          <div>
            <span>Book</span>
            <b>{EMAIL}</b>
          </div>
          <p>A time, and I’ll quote you in person.</p>
        </button>
      </div>
    </section>
  );
}
