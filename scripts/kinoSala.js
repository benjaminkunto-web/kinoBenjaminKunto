const VALIDNI_STATUSI = ["slobodno", "zauzeto", "rezervisano"];

function validirajPodatke(podaci) {
  if (
    !podaci ||
    !Array.isArray(podaci.projekcije) ||
    podaci.projekcije.length === 0
  ) {
    return false;
  }

  for (const proj of podaci.projekcije) {
    if (!proj.film || !proj.vrijeme || !Array.isArray(proj.sjedista)) {
      return false;
    }
    for (const sjediste of proj.sjedista) {
      if (!VALIDNI_STATUSI.includes(sjediste.status)) {
        return false;
      }
    }
  }

  return true;
}

function prikaziSalu(projekcija, index, ukupno, onSjediste, onPrev, onNext) {
  const kontejner = document.getElementById("sala");
  if (!kontejner) return;

  kontejner.innerHTML = "";

  const infoBox = document.createElement("div");
  infoBox.className = "film-info-box";
  infoBox.innerHTML = `
    <div class="film-info-item">
      <span class="info-label">Film</span>
      <span class="info-value">${projekcija.film}</span>
    </div>
    <div class="film-info-item">
      <span class="info-label">Projekcija</span>
      <span class="info-value">${projekcija.vrijeme}</span>
    </div>
    <div class="film-info-item">
      <span class="info-label">Sala</span>
      <span class="info-value">${projekcija.sala || "Sala 1"}</span>
    </div>
    <div class="film-info-item">
      <span class="info-label">Projekcija</span>
      <span class="info-value proj-counter">${index + 1} / ${ukupno}</span>
    </div>
  `;
  kontejner.appendChild(infoBox);

  const screenWrapper = document.createElement("div");
  screenWrapper.className = "screen-wrapper";
  screenWrapper.innerHTML = `<div class="screen">PLATNO</div>`;
  kontejner.appendChild(screenWrapper);

  const legenda = document.createElement("div");
  legenda.className = "legend";
  legenda.innerHTML = `
    <div class="legend-item">
      <div class="legend-seat free"></div>
      <span>Slobodno</span>
    </div>
    <div class="legend-item">
      <div class="legend-seat taken"></div>
      <span>Zauzeto</span>
    </div>
    <div class="legend-item">
      <div class="legend-seat reserved"></div>
      <span>Rezervisano</span>
    </div>
  `;
  kontejner.appendChild(legenda);

  const redovi = {};
  for (const sjediste of projekcija.sjedista) {
    if (!redovi[sjediste.red]) redovi[sjediste.red] = [];
    redovi[sjediste.red].push(sjediste);
  }

  for (const red in redovi) {
    redovi[red].sort((a, b) => a.broj - b.broj);
  }

  const salawrapper = document.createElement("div");
  salawrapper.className = "sala-wrapper";

  const grid = document.createElement("div");
  grid.className = "sala-grid";

  const maxKolona = Math.max(...Object.values(redovi).map(r => r.length));
  grid.style.gridTemplateColumns = `28px repeat(${maxKolona}, var(--seat-size))`;

  const sortiraniredovi = Object.keys(redovi).sort();

  for (const red of sortiraniredovi) {
    const oznakaReda = document.createElement("div");
    oznakaReda.className = "row-label";
    oznakaReda.textContent = red;
    grid.appendChild(oznakaReda);

    for (const sjediste of redovi[red]) {
      const el = document.createElement("div");
      el.className = `seat ${statusUKlasu(sjediste.status)}`;
      el.title = `Red ${sjediste.red}, Mjesto ${sjediste.broj} – ${sjediste.status}`;

      if (sjediste.status === "slobodno") {
        el.addEventListener("click", () => onSjediste(sjediste.red, sjediste.broj));
      }

      grid.appendChild(el);
    }
  }

  salawrapper.appendChild(grid);
  kontejner.appendChild(salawrapper);

  const slobodna = projekcija.sjedista.filter(s => s.status === "slobodno").length;
  const ukupnoSjedista = projekcija.sjedista.length;

  const statsDiv = document.createElement("div");
  statsDiv.className = "sala-stats";
  statsDiv.innerHTML = `
    <span class="stats-free">${slobodna}</span> slobodnih od 
    <span class="stats-total">${ukupnoSjedista}</span> mjesta
  `;
  kontejner.appendChild(statsDiv);

  const navDiv = document.createElement("div");
  navDiv.className = "proj-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "proj-btn";
  btnPrev.innerHTML = "&#8592; Prethodna";
  btnPrev.disabled = index === 0;
  btnPrev.addEventListener("click", onPrev);

  const btnNext = document.createElement("button");
  btnNext.className = "proj-btn";
  btnNext.innerHTML = "Sljedeća &#8594;";
  btnNext.disabled = index === ukupno - 1;
  btnNext.addEventListener("click", onNext);

  navDiv.appendChild(btnPrev);
  navDiv.appendChild(btnNext);
  kontejner.appendChild(navDiv);
}

function statusUKlasu(status) {
  const mapa = {
    slobodno:   "free",
    zauzeto:    "taken",
    rezervisano: "reserved",
  };
  return mapa[status] || "reserved";
}

function prikaziGresku(poruka) {
  const kontejner = document.getElementById("sala");
  if (!kontejner) return;
  kontejner.innerHTML = `<div class="sala-error">${poruka}</div>`;
}

function inicijalizujSalu(podaci) {
  if (!validirajPodatke(podaci)) {
    prikaziGresku("Podaci nisu validni!");
    return;
  }

  let trenutniIndex = 0;

  function render() {
    prikaziSalu(
      podaci.projekcije[trenutniIndex],
      trenutniIndex,
      podaci.projekcije.length,
      handleKlikSjediste,
      handlePrev,
      handleNext
    );
  }

  function handleKlikSjediste(red, broj) {
    const sjediste = podaci.projekcije[trenutniIndex].sjedista.find(
      s => s.red === red && s.broj === broj
    );
    if (sjediste && sjediste.status === "slobodno") {
      sjediste.status = "rezervisano";
      render();
    }
  }

  function handlePrev() {
    if (trenutniIndex > 0) {
      trenutniIndex--;
      render();
    }
  }

  function handleNext() {
    if (trenutniIndex < podaci.projekcije.length - 1) {
      trenutniIndex++;
      render();
    }
  }

  render();
}