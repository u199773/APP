const STORAGE = {
  user: "rallygo_user_v2",
  data: "rallygo_data_v2"
};

const LEVELS = ["0.0", "0.5", "1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0"];
const CATEGORIES = ["Masculino", "Femenino", "Mixto"];
const SPORTS = ["Pickleball"];
const PROVINCES = [
  "Barcelona", "Madrid", "Valencia", "Sevilla", "Málaga", "Alicante", "Girona", "Zaragoza", "Bilbao", "Murcia", "Palma de Mallorca", "Tarragona", "A Coruña", "Granada"
];

const CITY_MAP = {
  "Barcelona": ["Barcelona", "Sant Cugat", "Badalona", "Sabadell", "Mataró"],
  "Madrid": ["Madrid", "Alcobendas", "Pozuelo", "Las Rozas", "Getafe"],
  "Valencia": ["Valencia", "Paterna", "Torrent", "Sagunto", "Gandía"],
  "Sevilla": ["Sevilla", "Dos Hermanas", "Tomares", "Mairena", "Camas"],
  "Málaga": ["Málaga", "Marbella", "Fuengirola", "Benalmádena", "Estepona"],
  "Alicante": ["Alicante", "Elche", "San Juan", "Torrevieja", "Benidorm"],
  "Girona": ["Girona", "Figueres", "Blanes", "Olot", "Banyoles"],
  "Zaragoza": ["Zaragoza", "Utebo", "Cuarte", "Calatayud", "Ejea"],
  "Bilbao": ["Bilbao", "Getxo", "Barakaldo", "Leioa", "Basauri"],
  "Murcia": ["Murcia", "Cartagena", "Molina", "Lorca", "Alcantarilla"],
  "Palma de Mallorca": ["Palma", "Inca", "Manacor", "Calvià", "Llucmajor"],
  "Tarragona": ["Tarragona", "Reus", "Cambrils", "Salou", "Valls"],
  "A Coruña": ["A Coruña", "Santiago", "Ferrol", "Oleiros", "Arteixo"],
  "Granada": ["Granada", "Armilla", "Motril", "Albolote", "Loja"]
};

const PICKLEBALL_IMAGES = [
  "assets/pickleball-hero-net.png",
  "assets/pickleball-player.png",
  "assets/pickleball-doubles.png",
  "assets/pickleball-paddle-close.png"
];

const HERO_IMAGES = [
  PICKLEBALL_IMAGES[0],
  PICKLEBALL_IMAGES[1],
  PICKLEBALL_IMAGES[2],
  PICKLEBALL_IMAGES[3],
  PICKLEBALL_IMAGES[0]
];

const CLUB_IMAGES = [
  PICKLEBALL_IMAGES[3],
  PICKLEBALL_IMAGES[2],
  PICKLEBALL_IMAGES[1],
  PICKLEBALL_IMAGES[0],
  PICKLEBALL_IMAGES[3]
];

const FIRST_NAMES = ["Marc", "Laia", "Pablo", "Nuria", "Alex", "Clara", "Jordi", "Marta", "David", "Irene", "Sergio", "Paula", "Hugo", "Aina", "Adrián", "Lucía", "Nil", "Carla", "Pol", "Marina", "Óscar", "Vera", "Arnau", "Elena", "Mario", "Berta", "Daniel", "Alba", "Guillem", "Sara"];
const LAST_NAMES = ["García", "Vives", "Martínez", "López", "Soler", "Navarro", "Ruiz", "Torres", "Pérez", "Ramos", "Romero", "Sánchez", "Costa", "Moreno", "Molina", "Vidal", "Castro", "Ortega", "Suárez", "Ferrer"];

let state = {
  user: null,
  data: null,
  view: "home",
  matchFilter: "todos",
  selectedLeague: null,
  selectedConversation: null,
  leagueFilters: { province: "", sport: "", search: "" },
  clubFilters: { province: "", city: "", type: "", search: "" },
  rankingCategory: "Mixto",
  rankingLevel: "2.5",
  pendingRegistration: null
};

const app = document.getElementById("app");

function init() {
  try {
    const savedUser = normalizeUser(readJSON(STORAGE.user, null));
    if (savedUser) {
      state.user = savedUser;
      const savedData = readJSON(STORAGE.data, null);
      state.data = isValidData(savedData) ? savedData : createDefaultData(savedUser);
      migrateToPickleballOnly();
      forcePickleballImages();
      persistUser();
      persistData();
      renderApp();
    } else {
      renderWelcome();
    }
  } catch (error) {
    console.error("RallyGo failed to start", error);
    state.user = null;
    state.data = null;
    renderWelcome();
    showBootError(error);
  }
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;
  const fallback = createDefaultUser();
  const isDemo = user.accessMode === "demo" || user.email === fallback.email;
  return {
    ...fallback,
    ...user,
    sport: "Pickleball",
    level: user.level || fallback.level,
    category: user.category || fallback.category,
    province: user.province || fallback.province,
    city: user.city || fallback.city,
    accessMode: isDemo ? "demo" : (user.accessMode || "registered"),
    leagueAccess: isDemo ? "active" : (user.leagueAccess || "none"),
    signupStatus: isDemo ? "demo" : (user.signupStatus || "not_enrolled"),
    levelSource: user.levelSource || (isDemo ? "demo" : "nivelación inicial"),
    levelScore: Number.isFinite(Number(user.levelScore)) ? Number(user.levelScore) : (isDemo ? 12 : null),
    levelAssessment: user.levelAssessment || null
  };
}

function isValidData(data) {
  return !!(
    data &&
    Array.isArray(data.players) &&
    Array.isArray(data.leagues) &&
    Array.isArray(data.matches) &&
    Array.isArray(data.conversations) &&
    Array.isArray(data.clubs) &&
    Array.isArray(data.incidents) &&
    data.currentLeague
  );
}

function migrateToPickleballOnly() {
  if (!state.data) return;
  if (state.data.currentLeague) state.data.currentLeague.sport = "Pickleball";
  if (Array.isArray(state.data.leagues)) {
    state.data.leagues.forEach(league => {
      league.sport = "Pickleball";
      league.name = String(league.name || "Pickleball League").replace(/Pádel|Padel|Tenis|Tennis/gi, "Pickleball");
    });
  }
  if (Array.isArray(state.data.clubs)) {
    state.data.clubs.forEach(club => {
      club.sport = "Pickleball";
      club.name = String(club.name || "Pickleball Club").replace(/Pádel|Padel|Tenis|Tennis/gi, "Pickleball");
    });
  }
}

function showBootError(error) {
  const box = document.createElement("div");
  box.className = "boot-error";
  box.innerHTML = `<strong>Se ha reiniciado la demo local.</strong><br><span>Había datos antiguos en el navegador. Pulsa “Entrar en modo demo” para abrir la app limpia.</span>`;
  document.body.appendChild(box);
}

function forcePickleballImages() {
  if (!state.data) return;
  if (Array.isArray(state.data.leagues)) {
    state.data.leagues.forEach((league, index) => {
      league.image = HERO_IMAGES[index % HERO_IMAGES.length];
    });
  }
  if (Array.isArray(state.data.clubs)) {
    state.data.clubs.forEach((club, index) => {
      club.image = CLUB_IMAGES[index % CLUB_IMAGES.length];
    });
  }
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn("LocalStorage read error", error);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("LocalStorage write error", error);
  }
}

function persistUser() { writeJSON(STORAGE.user, state.user); }
function persistData() { writeJSON(STORAGE.data, state.data); }

function hasFullLeagueAccess() {
  return Boolean(state.user && (state.user.accessMode === "demo" || state.user.leagueAccess === "active"));
}

function isWaitingForWinterCalendar() {
  return Boolean(state.user && state.user.signupStatus === "winter-paid");
}

function pick(list, index) { return list[Math.abs(index) % list.length]; }
function initials(name = "RG") { return name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase(); }
function avatar(index) {
  const labels = ["RG", "MV", "CN", "PR", "LS", "AV", "JG", "IM", "DS", "CB", "PA", "EV"];
  const label = labels[Math.abs(index) % labels.length];
  const hue = (Math.abs(index) * 37) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="hsl(${hue},90%,58%)"/><stop offset="1" stop-color="hsl(${(hue + 90) % 360},90%,52%)"/></linearGradient></defs><rect width="160" height="160" rx="44" fill="#07111f"/><circle cx="118" cy="36" r="54" fill="url(#g)" opacity=".9"/><circle cx="35" cy="124" r="62" fill="url(#g)" opacity=".38"/><text x="80" y="94" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="42" font-weight="900" fill="white">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
function normalize(text) { return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function todayISO(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}
function prettyDate(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}
function statusClass(status = "") {
  const s = normalize(status);
  if (s.includes("incidencia")) return "status-incidencia";
  if (s.includes("confirmar")) return "status-confirmar";
  if (s.includes("jugado")) return "status-jugado";
  if (s.includes("programado")) return "status-programado";
  if (s.includes("asignado")) return "status-asignado";
  return "status-pendiente";
}

function createPlayers(count = 360) {
  return Array.from({ length: count }, (_, i) => {
    const province = pick(PROVINCES, i * 7 + 3);
    const city = pick(CITY_MAP[province], i * 5 + 1);
    const gender = i % 3 === 0 ? "Femenino" : i % 3 === 1 ? "Masculino" : "Mixto";
    const level = pick(LEVELS, i * 2 + 5);
    return {
      id: `p-${i + 1}`,
      name: pick(FIRST_NAMES, i * 3),
      surname: `${pick(LAST_NAMES, i * 5)} ${pick(LAST_NAMES, i * 11 + 2)}`,
      city,
      province,
      gender,
      category: gender,
      level,
      avatar: avatar(i + 2),
      points: 8 + ((i * 13) % 95),
      wins: (i * 3) % 10,
      losses: (i * 4) % 7
    };
  });
}

function createLeagues() {
  const leagueNames = ["Open League", "Challenge Series", "Premier Ladder"];
  const phaseNames = ["Fase 1", "Fase 2", "Fase 3"];
  const leagues = [];
  PROVINCES.forEach((province, pIndex) => {
    leagueNames.forEach((suffix, lIndex) => {
      const sport = pick(SPORTS, pIndex + lIndex);
      const city = pick(CITY_MAP[province], lIndex + pIndex);
      leagues.push({
        id: `league-${pIndex}-${lIndex}`,
        name: `${sport} ${province} ${suffix}`,
        sport,
        province,
        city,
        players: 148 + (pIndex * 37) + (lIndex * 64),
        startDate: todayISO(-20 + lIndex * 8),
        deadline: todayISO(24 + lIndex * 6),
        phase: pick(phaseNames, pIndex + lIndex),
        categories: CATEGORIES,
        levels: LEVELS,
        image: pick(HERO_IMAGES, pIndex + lIndex),
        activity: `${58 + ((pIndex + lIndex) * 7) % 38}% partidos coordinados`,
        clubs: 5 + ((pIndex + lIndex) % 7)
      });
    });
  });
  return leagues;
}

function createClubs() {
  const discounts = [
    { type: "Reserva de pista", value: "15% en reserva de pista", conditions: "Aplicable de lunes a viernes en franjas valle." },
    { type: "Clases", value: "10% en clases", conditions: "Descuento para jugadores inscritos en una liga activa." },
    { type: "Alquiler de pala", value: "20% en alquiler de pala", conditions: "Válido presentando tu perfil de RallyGo League." },
    { type: "Restauración", value: "Menú deportivo con descuento", conditions: "Incluye bebida isotónica y plato saludable post-partido." },
    { type: "Fisioterapia", value: "Fisioterapia deportiva colaboradora", conditions: "Primera valoración con precio reducido." }
  ];
  const clubs = [];
  PROVINCES.forEach((province, pIndex) => {
    CITY_MAP[province].slice(0, 4).forEach((city, cIndex) => {
      const d = pick(discounts, pIndex + cIndex);
      clubs.push({
        id: `club-${pIndex}-${cIndex}`,
        name: `${pick(["Urban", "Ace", "Match", "Arena", "Rally", "Prime", "Net"], pIndex + cIndex)} Club ${city}`,
        province,
        city,
        country: "España",
        address: `Calle Deporte ${12 + pIndex + cIndex}, ${city}`,
        discount: d.value,
        type: d.type,
        conditions: d.conditions,
        image: pick(CLUB_IMAGES, pIndex + cIndex),
        distance: `${(1.2 + ((pIndex + cIndex) % 8) * 0.7).toFixed(1)} km`,
        rating: (4.2 + ((pIndex + cIndex) % 7) / 10).toFixed(1)
      });
    });
  });
  return clubs;
}

function createDefaultUser() {
  return {
    name: "Enric",
    surname: "Vives Arnau",
    email: "demo@rallygo.app",
    phone: "+34 600 123 456",
    address: "Carrer de la Competició 21",
    province: "Barcelona",
    city: "Barcelona",
    birth: "2001-07-22",
    gender: "Masculino",
    level: "2.5",
    category: "Mixto",
    sport: "Pickleball",
    avatar: avatar(12),
    accessMode: "demo",
    leagueAccess: "active",
    signupStatus: "demo",
    levelSource: "demo",
    levelScore: 12,
    levelAssessment: null
  };
}

function createDefaultData(user) {
  const players = createPlayers();
  const leagues = createLeagues();
  const clubs = createClubs();
  const rivals = [
    { id: "r1", name: "Marc Soler", avatar: avatar(14), level: "2.5", city: "Sant Cugat" },
    { id: "r2", name: "Clara Navarro", avatar: avatar(22), level: "2.5", city: "Barcelona" },
    { id: "r3", name: "Pablo Ruiz", avatar: avatar(35), level: "2.5", city: "Badalona" }
  ];
  return {
    players,
    leagues,
    clubs,
    currentLeague: {
      id: "league-0-0",
      name: "Pickleball Barcelona Open League",
      province: user.province || "Barcelona",
      city: user.city || "Barcelona",
      category: user.category || "Mixto",
      level: user.level || "2.5",
      group: "Grupo B4",
      phase: "Fase 1 de 3",
      startDate: todayISO(-18),
      deadline: todayISO(28),
      phaseProgress: 42,
      points: 6,
      groupPosition: 2
    },
    matches: [
      {
        id: "m1",
        rival: rivals[0],
        status: "Partido programado",
        scheduled: "Jueves · 19:00 · Club Ace Barcelona",
        result: null,
        chatId: "c1"
      },
      {
        id: "m2",
        rival: rivals[1],
        status: "Pendiente",
        scheduled: "Sin fecha propuesta",
        result: null,
        chatId: "c2"
      },
      {
        id: "m3",
        rival: rivals[2],
        status: "Partido jugado",
        scheduled: "Domingo · 11:30 · Urban Club Badalona",
        result: "6-4 / 3-6 / 10-8",
        chatId: "c3"
      }
    ],
    conversations: [
      {
        id: "c1",
        player: rivals[0],
        unread: 2,
        blocked: false,
        last: "Perfecto, confirmamos entonces.",
        messages: [
          { from: "them", text: "¿Te va bien jugar el jueves por la tarde?", time: "10:24" },
          { from: "me", text: "Sí, yo puedo reservar pista en Barcelona a las 19:00.", time: "10:31" },
          { from: "them", text: "Perfecto, confirmamos entonces.", time: "10:33" }
        ]
      },
      {
        id: "c2",
        player: rivals[1],
        unread: 1,
        blocked: false,
        last: "Yo puedo martes o miércoles a partir de las 18:30.",
        messages: [
          { from: "them", text: "Hola, soy tu rival de la fase. ¿Cuándo te va bien jugar?", time: "09:12" },
          { from: "me", text: "Esta semana puedo por la tarde. ¿Tienes club preferido?", time: "09:44" },
          { from: "them", text: "Yo puedo martes o miércoles a partir de las 18:30.", time: "09:55" }
        ]
      },
      {
        id: "c3",
        player: rivals[2],
        unread: 0,
        blocked: false,
        last: "Resultado enviado, gracias por el partido.",
        messages: [
          { from: "me", text: "Buen partido, Pablo. Voy a subir el resultado ahora.", time: "18:06" },
          { from: "them", text: "Perfecto, gracias. Partido muy igualado.", time: "18:08" },
          { from: "me", text: "Resultado enviado, gracias por el partido.", time: "18:09" }
        ]
      }
    ],
    incidents: [
      { id: "i1", type: "Rival no responde", match: "Clara Navarro", status: "En revisión", created: todayISO(-2), description: "Se ha enviado recordatorio automático para coordinar el partido." }
    ],
    history: [
      { phase: "Temporada inicial", level: "2.0", result: "Subida a 2.5", position: "1º / Grupo C2" },
      { phase: "Fase de calibración", level: "2.5", result: "Se mantiene", position: "2º / Grupo B4" }
    ]
  };
}

function renderWelcome() {
  app.innerHTML = `
    <div class="bg-orb one"></div><div class="bg-orb two"></div><div class="bg-orb three"></div>
    <section class="auth-shell">
      <div class="welcome-hero">
        <div class="welcome-content">
          <div class="brand-row">
            <div class="row">
              <div class="logo-mark">RG</div>
              <div><div class="logo-text">RallyGo</div><div class="logo-sub">League OS</div></div>
            </div>
            <span class="live-pill">● 12.840 jugadores</span>
          </div>
          <div class="hero-copy">
            <span class="kicker">⚡ Ligas locales · comunidad real</span>
            <h1 class="hero-title">Compite, queda, juega y <span class="gradient-text">sube de nivel</span></h1>
            <p class="hero-lead">La app móvil-first para organizar ligas de pickleball por provincia, categoría y nivel. Nosotros conectamos jugadores; vosotros reserváis pista, jugáis y registráis resultados.</p>
            <div class="action-grid">
              <button class="btn btn-primary" data-action="show-register">Crear cuenta</button>
              <button class="btn btn-secondary" data-action="show-login">Iniciar sesión</button>
              <button class="btn btn-ghost" data-action="demo-login">Entrar en modo demo</button>
            </div>
            <div class="how-grid">
              ${["Entra en una liga de tu provincia", "Juega tus partidos asignados", "Registra resultados", "Sube, mantente o baja"].map((text, i) => `
                <div class="step-card"><span class="step-number">${i + 1}</span><strong>${text}</strong><p>${i === 0 ? "Elige provincia, categoría y nivel." : i === 1 ? "Coordina día y hora con tus rivales." : i === 2 ? "El resultado queda pendiente de confirmación." : "El ranking mueve tu nivel al final de fase."}</p></div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function renderAuth(mode = "login") {
  const isRegister = mode === "register";
  app.innerHTML = `
    <div class="bg-orb one"></div><div class="bg-orb two"></div><div class="bg-orb three"></div>
    <section class="auth-shell">
      <div class="auth-card">
        <div class="auth-top">
          <div class="row">
            <div class="logo-mark">RG</div>
            <div><div class="logo-text">RallyGo</div><div class="logo-sub">${isRegister ? "Crear perfil de jugador" : "Acceso jugador"}</div></div>
          </div>
          <button class="btn btn-ghost btn-small" data-action="back-welcome">Volver</button>
        </div>
        <h1 class="auth-title">${isRegister ? "Crea tu cuenta" : "Inicia sesión"}</h1>
        <p class="auth-lead">${isRegister ? "Datos simulados guardados en tu navegador para probar la experiencia completa." : "Accede con cualquier email/teléfono o usa el modo demo."}</p>
        ${isRegister ? registerForm() : loginForm()}
      </div>
    </section>`;
}

function registerForm() {
  return `
    <form class="form-grid section" id="registerForm" novalidate>
      <div class="filter-grid">
        ${inputField("name", "Nombre", "text", "Enric")}
        ${inputField("surname", "Apellidos", "text", "Vives Arnau")}
      </div>
      ${inputField("email", "Email", "email", "enric@email.com")}
      ${inputField("phone", "Número de teléfono", "tel", "+34 600 000 000")}
      ${inputField("address", "Dirección", "text", "Carrer Example 24")}
      <div class="filter-grid">
        ${selectField("province", "Provincia", PROVINCES, "Barcelona")}
        ${inputField("city", "Ciudad", "text", "Barcelona")}
      </div>
      <div class="filter-grid">
        ${inputField("birth", "Fecha de nacimiento", "date", "")}
        ${selectField("gender", "Género", ["Masculino", "Femenino", "No binario", "Prefiero no decirlo"], "Masculino")}
      </div>
      <div class="filter-grid">
        ${selectField("category", "Categoría preferida", CATEGORIES, "Mixto")}
        <div class="form-row"><label>Nivel inicial</label><div class="level-preview-box">Se asignará con 5 preguntas de nivelación</div></div>
      </div>
      ${inputField("password", "Contraseña falsa", "password", "••••••••")}
      <label class="checkbox-line"><input type="checkbox" name="terms" required /> Acepto los términos, privacidad y uso del chat solo para coordinar partidos.</label>
      <button class="btn btn-primary btn-full" type="submit">Crear cuenta y entrar</button>
      <button class="btn btn-ghost btn-full" type="button" data-action="show-login">Ya tengo cuenta</button>
    </form>`;
}

function loginForm() {
  return `
    <form class="form-grid section" id="loginForm" novalidate>
      ${inputField("login", "Email o teléfono", "text", "demo@rallygo.app")}
      ${inputField("password", "Contraseña falsa", "password", "••••••••")}
      <button class="btn btn-primary btn-full" type="submit">Entrar</button>
      <button class="btn btn-secondary btn-full" type="button" data-action="demo-login">Acceso rápido demo</button>
      <button class="btn btn-ghost btn-full" type="button" data-action="fake-recover">Recuperar contraseña</button>
      <p class="tiny">La autenticación es simulada. No se envía ningún dato a servidores.</p>
    </form>`;
}


function renderLevelAssessment() {
  const pending = state.pendingRegistration;
  if (!pending) return renderAuth("register");
  app.innerHTML = `
    <div class="bg-orb one"></div><div class="bg-orb two"></div><div class="bg-orb three"></div>
    <section class="auth-shell">
      <div class="auth-card assessment-card">
        <div class="auth-top">
          <div class="row">
            <div class="logo-mark">RG</div>
            <div><div class="logo-text">Nivelación</div><div class="logo-sub">Asignación automática de nivel</div></div>
          </div>
          <button class="btn btn-ghost btn-small" data-action="show-register">Volver</button>
        </div>
        <h1 class="auth-title">5 preguntas rápidas</h1>
        <p class="auth-lead">Responde según tu nivel real. La app te asignará un nivel inicial para inscribirte en la categoría correcta.</p>
        <form class="form-grid section" id="levelAssessmentForm" novalidate>
          ${assessmentQuestion("q1", "1. Fondo de pista", "¿Cómo te sientes jugando puntos largos desde el fondo de pista?", [
            [0, "Me cuesta mantener la bola en juego"],
            [1, "Aguanto intercambios cortos con errores frecuentes"],
            [2, "Soy bastante consistente a velocidad media"],
            [3, "Dirijo la bola y cambio profundidades con control"],
            [4, "Compito cómodo en puntos largos y bajo presión"]
          ])}
          ${assessmentQuestion("q2", "2. Cocina / zona de no volea", "¿Qué control tienes en la cocina con dinks, bloqueos y bolas bajas?", [
            [0, "Aún no domino la zona de cocina"],
            [1, "Sé colocarme, pero fallo muchas bolas bajas"],
            [2, "Mantengo dinks básicos y bloqueo bolas sencillas"],
            [3, "Puedo construir puntos con dinks y paciencia"],
            [4, "Uso cocina, bloqueos y cambios de ritmo con intención táctica"]
          ])}
          ${assessmentQuestion("q3", "3. Golpes técnicos", "¿Qué tal ejecutas saque, resto, volea y tercer golpe?", [
            [0, "Estoy aprendiendo los golpes básicos"],
            [1, "Saco y resto, pero sin mucha regularidad"],
            [2, "Tengo golpes básicos sólidos y tercer golpe simple"],
            [3, "Uso tercer golpe, voleas y globos con bastante control"],
            [4, "Ejecuto golpes avanzados con dirección, altura y profundidad"]
          ])}
          ${assessmentQuestion("q4", "4. Experiencia jugando partidos", "¿Cuánta experiencia tienes compitiendo o jugando partidos organizados?", [
            [0, "Casi ninguna"],
            [1, "Partidos ocasionales con amigos"],
            [2, "Juego cada semana y conozco bien las reglas"],
            [3, "He jugado ligas, torneos o americanas"],
            [4, "Compito regularmente y estoy acostumbrado a formatos exigentes"]
          ])}
          ${assessmentQuestion("q5", "5. Táctica y toma de decisiones", "¿Cómo gestionas posicionamiento, elección de golpe y comunicación en dobles?", [
            [0, "Me cuesta saber dónde colocarme"],
            [1, "Entiendo lo básico, pero tomo decisiones tarde"],
            [2, "Sé cuándo subir, defender y buscar la cocina"],
            [3, "Leo el punto y juego con intención táctica"],
            [4, "Tomo decisiones rápidas, adapto estrategia y coordino bien en dobles"]
          ])}
          <button class="btn btn-primary btn-full" type="submit">Calcular mi nivel y entrar</button>
        </form>
      </div>
    </section>`;
}

function assessmentQuestion(name, title, subtitle, options) {
  return `<fieldset class="assessment-question"><legend><strong>${title}</strong><span>${subtitle}</span></legend><div class="assessment-options">${options.map(([score, label]) => `<label class="assessment-option"><input type="radio" name="${name}" value="${score}" required><span>${label}</span></label>`).join("")}</div></fieldset>`;
}

function calculateInitialLevel(score) {
  const total = Number(score) || 0;
  if (total <= 1) return "0.5";
  if (total <= 3) return "1.0";
  if (total <= 5) return "1.5";
  if (total <= 7) return "2.0";
  if (total <= 9) return "2.5";
  if (total <= 11) return "3.0";
  if (total <= 13) return "3.5";
  if (total <= 15) return "4.0";
  if (total <= 17) return "4.5";
  if (total <= 19) return "5.0";
  return "5.5";
}

function levelLabel(user = state.user) {
  if (!user) return "Nivel pendiente";
  const source = user.levelSource ? ` · ${user.levelSource}` : "";
  return `Nivel ${user.level || "—"}${source}`;
}

function inputField(name, label, type = "text", placeholder = "") {
  return `<div class="form-row"><label for="${name}">${label}</label><input class="input" id="${name}" name="${name}" type="${type}" placeholder="${placeholder}" required /></div>`;
}

function selectField(name, label, options, selected = "") {
  return `<div class="form-row"><label for="${name}">${label}</label><select class="select" id="${name}" name="${name}" required>${options.map(opt => `<option value="${opt}" ${opt === selected ? "selected" : ""}>${opt}</option>`).join("")}</select></div>`;
}

function demoLogin() {
  state.user = createDefaultUser();
  state.data = createDefaultData(state.user);
  migrateToPickleballOnly();
  forcePickleballImages();
  persistUser();
  persistData();
  state.pendingRegistration = null;
  state.view = "home";
  renderApp();
  showToast("Modo demo activado con datos completos de pickleball.");
}

function renderApp() {
  app.innerHTML = `
    <div class="bg-orb one"></div><div class="bg-orb two"></div><div class="bg-orb three"></div>
    <section class="app-shell">
      <main id="viewRoot"></main>
      ${bottomNav()}
    </section>
    <div class="modal-mount" id="modalMount"></div>`;
  renderView();
}

function bottomNav() {
  const items = [
    ["home", "⌂", "Inicio"],
    ["matches", "⚔", "Partidos"],
    ["leagues", "🏆", "Ligas"],
    ["messages", "✉", "Mensajes"],
    ["inscriptions", "📝", "Inscripción"],
    ["profile", "☻", "Perfil"]
  ];
  const active = state.view === "leagueDetail" ? "leagues" : state.view;
  return `<nav class="bottom-nav" aria-label="Navegación principal">${items.map(([id, icon, label]) => `<button class="nav-item ${active === id ? "active" : ""}" data-nav="${id}"><span class="icon">${icon}</span><span>${label}</span></button>`).join("")}</nav>`;
}

function renderView() {
  const root = document.getElementById("viewRoot");
  if (!root) return;
  const map = {
    home: renderHome,
    matches: renderMatches,
    leagues: renderLeagues,
    leagueDetail: renderLeagueDetail,
    inscriptions: renderInscriptions,
    messages: renderMessages,
    discounts: renderDiscounts,
    profile: renderProfile
  };
  root.innerHTML = `<div class="view">${(map[state.view] || renderHome)()}</div>`;
}

function topbar(title, subtitle = "") {
  return `<div class="topbar"><div class="topbar-inner"><div class="user-mini"><img class="avatar" src="${state.user.avatar || avatar(8)}" alt="Avatar"><div><h1 class="h1">${title}</h1>${subtitle ? `<div class="tiny">${subtitle}</div>` : ""}</div></div><button class="btn btn-ghost btn-small" data-action="how-it-works">Reglas</button></div></div>`;
}

function renderLimitedHome() {
  const u = state.user;
  return `
    ${topbar(`Hola, ${u.name}`, "Cuenta creada · inscripción pendiente")}
    <section class="hero-panel limited-hero">
      <span class="kicker">🎾 Activa tu liga</span>
      <h2 class="hero-title" style="font-size:2.25rem">Elige una liga para empezar</h2>
      <p class="hero-lead">Tu cuenta ya está creada. Mientras no estés inscrito, puedes explorar ligas, consultar descuentos y editar tu perfil. Para desbloquear partidos y mensajes, inscríbete en una liga disponible.</p>
      <div class="hero-meta"><span class="chip chip-lime">Descuentos activos</span><span class="chip chip-blue">Ligas visibles</span><span class="chip chip-gold">Partidos bloqueados</span></div>
    </section>
    <section class="section grid-2">
      <button class="cta-card" data-nav="leagues"><span class="emoji">🏆</span><strong>Ver ligas</strong><span>Explora provincias, categorías y niveles.</span></button>
      <button class="cta-card" data-nav="discounts"><span class="emoji">◆</span><strong>Ver descuentos</strong><span>Consulta clubs colaboradores disponibles.</span></button>
      <button class="cta-card" data-nav="profile"><span class="emoji">☻</span><strong>Perfil</strong><span>Completa o edita tus datos.</span></button>
      <button class="cta-card" data-nav="inscriptions"><span class="emoji">📝</span><strong>Inscripciones</strong><span>Reserva plaza o inscríbete en invierno.</span></button>
    </section>
  `;
}

function renderAccessGate(sectionName) {
  return `
    ${topbar(sectionName, "Inscripción necesaria")}
    <section class="hero-panel limited-hero">
      <span class="kicker">🔒 Zona de liga activa</span>
      <h2 class="hero-title" style="font-size:2.1rem">Inscríbete a una liga</h2>
      <p class="hero-lead">Para usar ${sectionName.toLowerCase()} necesitas estar inscrito en una liga activa. Puedes seguir viendo ligas, descuentos y perfil mientras eliges tu próxima competición.</p>
      <div class="hero-meta"><span class="chip chip-lime">Liga de verano</span><span class="chip chip-blue">Liga de invierno</span></div>
    </section>
    <section class="section glass-card">
      <h2 class="h2">Desbloquea esta función</h2>
      <p class="tiny">Al inscribirte tendrás acceso a partidos, mensajes con rivales, calendario de fase y gestión de resultados.</p>
      <button class="btn btn-primary btn-full section" data-nav="inscriptions">Inscríbete a la liga</button>
    </section>
  `;
}

function renderInscriptions() {
  const u = state.user;
  return `
    ${topbar("Inscripciones", "Próximas ligas y plazas disponibles")}
    <section class="hero-panel inscriptions-hero">
      <span class="kicker">📝 Pickleball League</span>
      <h2 class="hero-title" style="font-size:2.2rem">Elige tu próxima liga</h2>
      <p class="hero-lead">Apúntate como reserva si la liga ya está en juego o inscríbete en la próxima temporada para desbloquear partidos y mensajes.</p>
      <div class="hero-meta"><span class="chip chip-gold">${u.province}</span><span class="chip chip-lime">${u.category}</span><span class="chip chip-blue">${levelLabel(u)}</span></div>
    </section>

    <section class="section card-stack">
      <article class="inscription-card">
        <div class="row-between">
          <div><span class="kicker">Liga de verano</span><h2 class="h2">Liga de Verano en juego</h2><p class="tiny">La fase actual ya ha empezado. Puedes apuntarte como reserva y te avisaremos cuando haya plaza libre.</p></div>
          <span class="chip chip-gold">En juego</span>
        </div>
        <div class="grid-2 section">
          ${metricCard("Reserva", "Estado", "Lista de espera abierta")}
          ${metricCard("12", "Puestos reserva", "Aviso automático simulado")}
        </div>
        <button class="btn btn-secondary btn-full section" data-action="join-summer-reserve">Apuntarme como reserva</button>
      </article>

      <article class="inscription-card featured-inscription">
        <div class="row-between">
          <div><span class="kicker">Liga de invierno</span><h2 class="h2">Liga de Invierno Pickleball</h2><p class="tiny">Más de 400 jugadores inscritos. Selecciona categoría y confirma el pago simulado para activar todas las funciones.</p></div>
          <span class="chip chip-lime">+400 inscritos</span>
        </div>
        <form class="form-grid section" id="winterSignupForm">
          <div class="filter-grid">
            <div class="form-row"><label>Categoría</label><select class="select" name="category" required>${CATEGORIES.map(c => `<option ${u.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
            <div class="form-row"><label>Provincia</label><select class="select" name="province" required>${PROVINCES.map(p => `<option ${u.province === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
          </div>
          <div class="glass-card assigned-level-box">
            <div class="row-between"><span class="tiny">Nivel de inscripción</span><strong>${u.level || "—"}</strong></div>
            <p class="tiny">Usaremos el nivel asignado en tu nivelación inicial para colocarte en el grupo correcto.</p>
          </div>
          <div class="glass-card" style="padding:12px;border-radius:18px;background:rgba(255,255,255,.045)">
            <div class="row-between"><span class="tiny">Inscripción</span><strong>Pago simulado</strong></div>
            <div class="row-between" style="margin-top:6px"><span class="tiny">Acceso</span><span class="chip chip-lime">Partidos + mensajes</span></div>
          </div>
          <button class="btn btn-primary btn-full" type="submit">Pagar e inscribirme</button>
        </form>
      </article>
    </section>
  `;
}

function renderHome() {
  if (!hasFullLeagueAccess()) return renderLimitedHome();
  const u = state.user;
  const d = state.data.currentLeague;
  const matches = state.data.matches;
  const pending = matches.filter(m => !normalize(m.status).includes("jugado") && !normalize(m.status).includes("confirmar")).length;
  const played = matches.length - pending;
  const next = matches.find(m => normalize(m.status).includes("programado")) || matches[0];
  return `
    ${topbar(`Hola, ${u.name}`, "Tu liga activa está en marcha")}
    <section class="hero-panel">
      <span class="kicker">🎾 ${d.name}</span>
      <h2 class="hero-title" style="font-size:2.35rem">${d.phase}</h2>
      <p class="hero-lead">Nivel ${d.level} · ${d.category} · ${d.province}. Quedan ${daysLeft(d.deadline)} días para cerrar los 3 partidos de la fase.</p>
      <div class="hero-meta">
        <span class="chip chip-lime">${d.group}</span>
        <span class="chip chip-blue">Posición ${d.groupPosition}/4</span>
        <span class="chip chip-gold">${d.points} puntos</span>
      </div>
      ${progressBlock(d.phaseProgress, "Progreso de fase")}
    </section>

    <section class="grid-2 section">
      ${metricCard(pending, "Partidos pendientes", "Coordina fecha con tus rivales")}
      ${metricCard(played, "Partidos jugados", "Resultados visibles en ranking")}
      ${metricCard(`${d.groupPosition}º`, "Posición en grupo", d.groupPosition === 1 ? "Zona de ascenso" : "Necesitas ganar para subir")}
      ${metricCard(d.points, "Puntos", "Riesgo bajo de descenso")}
    </section>

    <section class="section">
      <h2 class="h2">Próximo partido</h2>
      ${matchCard(next, true)}
    </section>

    <section class="section">
      <h2 class="h2">Acciones rápidas</h2>
      <div class="grid-2">
        <button class="cta-card" data-nav="matches"><span class="emoji">⚔</span><strong>Ver mis partidos</strong><span>Coordina, registra resultados y abre incidencias.</span></button>
        <button class="cta-card" data-action="open-current-ranking"><span class="emoji">🏆</span><strong>Ver ranking</strong><span>Consulta ascensos, permanencias y descensos.</span></button>
        <button class="cta-card" data-nav="messages"><span class="emoji">✉</span><strong>Abrir mensajes</strong><span>Habla con rivales para reservar pista.</span></button>
        <button class="cta-card" data-action="new-incident"><span class="emoji">⚠</span><strong>Reportar incidencia</strong><span>Rival no responde, lesión o resultado incorrecto.</span></button>
      </div>
    </section>

    <section class="section">
      <h2 class="h2">Estado de la fase</h2>
      ${phaseStatusCard()}
    </section>`;
}

function metricCard(value, label, note) {
  return `<div class="metric-card"><span class="metric-value">${value}</span><span class="metric-label">${label}</span><div class="metric-note">${note}</div></div>`;
}

function progressBlock(value, label = "Progreso") {
  return `<div class="progress-wrap"><div class="progress-label"><span>${label}</span><strong>${value}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${value}%"></div></div></div>`;
}

function daysLeft(iso) {
  return Math.max(0, Math.ceil((new Date(`${iso}T23:59:59`) - new Date()) / 86400000));
}

function phaseStatusCard() {
  const d = state.data.currentLeague;
  const completed = state.data.matches.filter(m => normalize(m.status).includes("jugado") || normalize(m.status).includes("confirmar")).length;
  return `<div class="glass-card">
    <div class="row-between"><div><strong>${d.phase}</strong><div class="tiny">Inicio ${prettyDate(d.startDate)} · Límite ${prettyDate(d.deadline)}</div></div><span class="chip chip-lime">${completed}/3 completados</span></div>
    ${progressBlock(Math.round((completed / 3) * 100), "Partidos completados")}
    <div class="grid-2 section" style="margin-top:14px">
      <div class="metric-card"><span class="metric-value">+1 victoria</span><span class="metric-label">Qué necesitas para subir</span><div class="metric-note">Ser 1º del grupo al cierre</div></div>
      <div class="metric-card"><span class="metric-value">Bajo</span><span class="metric-label">Riesgo de bajar</span><div class="metric-note">Evita quedar 4º</div></div>
    </div>
    <p class="tiny">Regla: el primero sube al nivel superior, el último baja y los dos jugadores intermedios se mantienen.</p>
  </div>`;
}

function renderUpcomingMatches() {
  const d = state.data.currentLeague;
  return `
    ${topbar("Mis partidos", "Calendario pendiente de asignación")}
    <section class="hero-panel upcoming-hero">
      <span class="kicker">✅ Inscripción confirmada</span>
      <h2 class="hero-title" style="font-size:2.25rem">Próximamente</h2>
      <p class="hero-lead">Ya tienes acceso completo. Tus partidos aparecerán aquí cuando se cierre el grupo de 4 jugadores de la Liga de Invierno.</p>
      <div class="hero-meta"><span class="chip chip-lime">${d.name}</span><span class="chip chip-blue">${d.category}</span><span class="chip chip-gold">Nivel ${d.level}</span></div>
    </section>
    <section class="section glass-card">
      <h2 class="h2">Estado de inscripción</h2>
      ${progressBlock(25, "Preparación de calendario")}
      <div class="grid-2 section">
        ${metricCard("Pendiente", "Grupo", "Asignación próxima")}
        ${metricCard("3", "Partidos", "Round robin por fase")}
      </div>
      <p class="tiny">Cuando haya rivales asignados, podrás abrir chat, proponer fecha y registrar resultados.</p>
    </section>
  `;
}

function renderMatches() {
  if (!hasFullLeagueAccess()) return renderAccessGate("Mis partidos");
  if (isWaitingForWinterCalendar()) return renderUpcomingMatches();
  const d = state.data.currentLeague;
  const filtered = filterMatches();
  return `
    ${topbar("Mis partidos", `${d.name} · ${d.group}`)}
    <section class="glass-card">
      <div class="row-between"><div><span class="kicker">Fase activa</span><h2 class="h2">${d.category} · Nivel ${d.level}</h2><p class="tiny">${d.province} · ${d.group} · fecha límite ${prettyDate(d.deadline)}</p></div><span class="chip chip-gold">${d.phase}</span></div>
      ${progressBlock(d.phaseProgress, "Progreso de calendario")}
    </section>
    <section class="tabs section" aria-label="Filtros de partidos">
      ${["todos", "pendientes", "programados", "jugados", "incidencias"].map(tab => `<button class="tab ${state.matchFilter === tab ? "active" : ""}" data-match-filter="${tab}">${capitalize(tab)}</button>`).join("")}
    </section>
    <section class="card-stack">
      ${filtered.length ? filtered.map(m => matchCard(m)).join("") : `<div class="empty-state"><strong>No hay partidos en este filtro</strong><p class="tiny">Cambia de pestaña para ver el resto de la fase.</p></div>`}
    </section>
    <section class="section">${phaseStatusCard()}</section>`;
}

function filterMatches() {
  const f = state.matchFilter;
  return state.data.matches.filter(m => {
    const s = normalize(m.status);
    if (f === "todos") return true;
    if (f === "pendientes") return s.includes("pendiente") || s.includes("asignado");
    if (f === "programados") return s.includes("programado");
    if (f === "jugados") return s.includes("jugado") || s.includes("confirmar");
    if (f === "incidencias") return s.includes("incidencia");
    return true;
  });
}

function matchCard(match, compact = false) {
  return `<article class="match-card">
    <div class="row-between">
      <div class="row grow"><img class="avatar" src="${match.rival.avatar}" alt="${match.rival.name}"><div class="grow"><strong>${match.rival.name}</strong><div class="tiny">Nivel ${match.rival.level} · ${match.rival.city}</div></div></div>
      <span class="status-badge ${statusClass(match.status)}">${match.status}</span>
    </div>
    <div class="glass-card" style="padding:12px;border-radius:18px;background:rgba(255,255,255,.045)">
      <div class="row-between"><span class="tiny">Fecha / club</span><strong style="font-size:.88rem">${match.scheduled}</strong></div>
      ${match.result ? `<div class="row-between" style="margin-top:8px"><span class="tiny">Resultado</span><span class="chip chip-green">${match.result}</span></div>` : ""}
    </div>
    ${compact ? `<button class="btn btn-primary btn-full" data-nav="matches">Gestionar partido</button>` : `<div class="match-actions">
      <button class="btn btn-secondary btn-small" data-action="open-chat" data-chat-id="${match.chatId}">Abrir chat</button>
      <button class="btn btn-ghost btn-small" data-action="propose-date" data-match-id="${match.id}">Proponer fecha</button>
      <button class="btn btn-primary btn-small" data-action="register-result" data-match-id="${match.id}">Registrar resultado</button>
      <button class="btn btn-danger btn-small" data-action="report-match" data-match-id="${match.id}">Reportar incidencia</button>
    </div>`}
  </article>`;
}

function renderLeagues() {
  const filtered = state.data.leagues.filter(league => {
    const matchesProvince = !state.leagueFilters.province || league.province === state.leagueFilters.province;
    const matchesSport = !state.leagueFilters.sport || league.sport === state.leagueFilters.sport;
    const text = normalize(`${league.name} ${league.province} ${league.city}`);
    const matchesSearch = !state.leagueFilters.search || text.includes(normalize(state.leagueFilters.search));
    return matchesProvince && matchesSport && matchesSearch;
  });
  return `
    ${topbar("Ligas activas", "Provincias, categorías, niveles y rankings")}
    <section class="glass-card">
      <span class="kicker">Comunidad nacional</span>
      <h2 class="h2">${sumPlayers()} jugadores en ligas simuladas</h2>
      <p class="tiny">Explora ligas de pickleball por provincia, categoría y nivel. Cada liga contiene rankings por grupo y reglas de fase.</p>
    </section>
    <section class="filter-bar">
      <div class="search-box"><span>⌕</span><input class="input" data-filter="league-search" placeholder="Buscar liga, ciudad o provincia" value="${state.leagueFilters.search}"></div>
      <div class="filter-grid">
        <select class="select" data-filter="league-province"><option value="">Todas las provincias</option>${PROVINCES.map(p => `<option ${state.leagueFilters.province === p ? "selected" : ""}>${p}</option>`).join("")}</select>
        <select class="select" data-filter="league-sport"><option value="">Pickleball</option>${SPORTS.map(s => `<option ${state.leagueFilters.sport === s ? "selected" : ""}>${s}</option>`).join("")}</select>
      </div>
    </section>
    <section class="card-stack">
      ${filtered.map(league => leagueCard(league)).join("")}
    </section>`;
}

function sumPlayers() {
  return state.data.leagues.reduce((acc, l) => acc + l.players, 0).toLocaleString("es-ES");
}

function leagueCard(league) {
  return `<article class="league-card">
    <div class="league-cover" style="background-image:url('${league.image}')"></div>
    <div class="row-between"><div><strong>${league.name}</strong><div class="tiny">${league.city}, ${league.province} · Inicio ${prettyDate(league.startDate)}</div></div><span class="chip chip-lime">${league.players} jugadores</span></div>
    <div class="pill-list">
      <span class="chip chip-blue">${league.phase}</span>
      <span class="chip">${league.categories.join(" · ")}</span>
      <span class="chip chip-gold">15 niveles</span>
      <span class="chip">${league.activity}</span>
    </div>
    <div class="level-strip section" style="margin-top:12px">${league.levels.map(l => `<span class="chip level-chip">${l}</span>`).join("")}</div>
    <button class="btn btn-primary btn-full" data-action="view-league" data-league-id="${league.id}">Ver liga</button>
  </article>`;
}

function renderLeagueDetail() {
  const league = state.selectedLeague || state.data.leagues[0];
  const ranking = makeRanking(league, state.rankingCategory, state.rankingLevel, 12);
  const group = ranking.slice(0, 4);
  return `
    <div class="topbar"><div class="topbar-inner"><button class="btn btn-ghost btn-small" data-nav="leagues">← Ligas</button><div class="grow"><h1 class="h1">${league.name}</h1><div class="tiny">${league.city}, ${league.province}</div></div><button class="btn btn-ghost btn-small" data-action="how-it-works">Reglas</button></div></div>
    <section class="hero-panel" style="background-image:linear-gradient(145deg,rgba(5,9,18,.28),rgba(5,9,18,.88)),url('${league.image}')">
      <span class="kicker">${league.sport} · ${league.phase}</span>
      <h2 class="hero-title" style="font-size:2.2rem">Liga por niveles</h2>
      <p class="hero-lead">${league.players} jugadores activos · ${league.clubs} clubs colaboradores · categorías masculino, femenino y mixto.</p>
      <div class="hero-meta"><span class="chip chip-lime">Round robin grupos de 4</span><span class="chip chip-blue">3 partidos por fase</span></div>
    </section>
    <section class="section glass-card">
      <h2 class="h2">Cómo se juega esta liga</h2>
      <p class="tiny">Cada fase dura aproximadamente 1 mes y medio. Los jugadores se dividen en grupos de 4 dentro de su nivel y categoría. Cada jugador debe jugar 3 partidos, uno contra cada rival. Al finalizar la fase, el primero sube de nivel, el último baja y los dos jugadores intermedios se mantienen.</p>
    </section>
    <section class="section">
      <h2 class="h2">Categorías y niveles</h2>
      <div class="pill-list">${CATEGORIES.map(c => `<span class="chip ${c === state.rankingCategory ? "chip-lime" : ""}">${c}</span>`).join("")}</div>
      <div class="level-strip section" style="margin-top:12px">${LEVELS.map(l => `<span class="chip level-chip ${l === state.rankingLevel ? "chip-lime" : ""}">${l}</span>`).join("")}</div>
    </section>
    <section class="section glass-card">
      <div class="row-between"><h2 class="h2" style="margin:0">Rankings</h2><span class="chip chip-gold">${state.rankingCategory} · ${state.rankingLevel}</span></div>
      <div class="filter-grid section" style="margin-top:12px">
        <select class="select" data-filter="ranking-category">${CATEGORIES.map(c => `<option ${state.rankingCategory === c ? "selected" : ""}>${c}</option>`).join("")}</select>
        <select class="select" data-filter="ranking-level">${LEVELS.map(l => `<option ${state.rankingLevel === l ? "selected" : ""}>${l}</option>`).join("")}</select>
      </div>
      <h3 class="h2" style="font-size:1rem;margin-top:18px">Ranking general</h3>
      ${rankingTable(ranking)}
      <h3 class="h2" style="font-size:1rem;margin-top:18px">Ranking por grupo · Grupo A1</h3>
      ${rankingTable(group)}
    </section>`;
}

function makeRanking(league, category, level, count = 12) {
  const seed = league.id.length + category.length + Math.round(Number(level) * 10);
  const provincePlayers = state.data.players.filter(p => p.province === league.province).slice(0, 80);
  return Array.from({ length: count }, (_, i) => {
    const p = provincePlayers[(i * 7 + seed) % provincePlayers.length] || state.data.players[i];
    const wins = Math.max(0, 3 - (i % 4));
    const losses = 3 - wins;
    const points = wins * 3 + ((count - i) % 2);
    const status = i === 0 ? "Sube de nivel" : i === count - 1 || (count === 4 && i === 3) ? "Baja de nivel" : "Se mantiene";
    return { ...p, pos: i + 1, played: 3, wins, losses, setsFor: 6 + wins + (i % 3), setsAgainst: 2 + losses + (i % 4), points, status };
  });
}

function rankingTable(rows) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Pos.</th><th>Jugador</th><th>Ciudad</th><th>PJ</th><th>V</th><th>D</th><th>Sets +</th><th>Sets -</th><th>Puntos</th><th>Estado</th></tr></thead>
    <tbody>${rows.map(row => `<tr class="${row.status.includes("Sube") ? "promote" : row.status.includes("Baja") ? "relegate" : ""}">
      <td><strong>#${row.pos}</strong></td><td><div class="player-cell"><img class="avatar-sm" src="${row.avatar}" alt="${row.name}"><span>${row.name} ${row.surname}</span></div></td><td>${row.city}</td><td>${row.played}</td><td>${row.wins}</td><td>${row.losses}</td><td>${row.setsFor}</td><td>${row.setsAgainst}</td><td><strong>${row.points}</strong></td><td><span class="chip ${row.status.includes("Sube") ? "chip-lime" : row.status.includes("Baja") ? "chip-red" : "chip-blue"}">${row.status}</span></td>
    </tr>`).join("")}</tbody></table></div>`;
}

function renderMessages() {
  if (!hasFullLeagueAccess()) return renderAccessGate("Mensajes");
  if (state.selectedConversation) return renderChat();
  const conversations = state.data.conversations;
  const unread = conversations.reduce((acc, c) => acc + c.unread, 0);
  return `
    ${topbar("Mensajes", `${unread} mensajes no leídos`)}
    <section class="glass-card">
      <div class="search-box"><span>⌕</span><input class="input" placeholder="Buscar jugadores o conversaciones" data-filter="message-search"></div>
      <p class="tiny">Usa el chat solo para coordinar partidos de la liga. Cualquier uso indebido puede ser reportado.</p>
    </section>
    <section class="card-stack">
      ${conversations.map(c => `<button class="conversation-card" data-action="open-chat" data-chat-id="${c.id}">
        <div class="row-between"><div class="row grow"><img class="avatar" src="${c.player.avatar}" alt="${c.player.name}"><div class="grow"><strong>${c.player.name}</strong><div class="tiny ellipsis">${c.last}</div></div></div>${c.unread ? `<span class="unread-dot">${c.unread}</span>` : `<span class="chip">OK</span>`}</div>
      </button>`).join("")}
    </section>`;
}

function renderChat() {
  const c = state.data.conversations.find(item => item.id === state.selectedConversation);
  if (!c) { state.selectedConversation = null; return renderMessages(); }
  return `<section class="chat-screen">
    <div class="chat-header"><div class="row-between"><button class="btn btn-ghost btn-small" data-action="back-messages">←</button><div class="row grow"><img class="avatar" src="${c.player.avatar}" alt="${c.player.name}"><div class="grow"><strong>${c.player.name}</strong><div class="tiny">Nivel ${c.player.level} · ${c.player.city}</div></div></div><button class="btn btn-ghost btn-small" data-action="view-player" data-chat-id="${c.id}">Perfil</button></div>
    <div class="pill-list"><button class="btn btn-danger btn-small" data-action="report-message" data-chat-id="${c.id}">Reportar</button><button class="btn btn-ghost btn-small" data-action="block-user" data-chat-id="${c.id}">${c.blocked ? "Bloqueado" : "Bloquear"}</button></div></div>
    <div class="messages-box">${c.messages.map(m => `<div class="bubble ${m.from}">${m.text}<span class="bubble-time">${m.time}</span></div>`).join("")}</div>
    <p class="tiny">Aviso: usa este chat solo para coordinar partidos de la liga. Cualquier uso indebido puede ser reportado.</p>
    <form class="chat-input" id="sendMessageForm" data-chat-id="${c.id}"><input class="input" name="message" placeholder="Escribe un mensaje" ${c.blocked ? "disabled" : ""} required><button class="btn btn-primary" ${c.blocked ? "disabled" : ""}>Enviar</button></form>
  </section>`;
}

function renderDiscounts() {
  const filtered = state.data.clubs.filter(club => {
    const province = !state.clubFilters.province || club.province === state.clubFilters.province;
    const city = !state.clubFilters.city || normalize(club.city).includes(normalize(state.clubFilters.city));
    const type = !state.clubFilters.type || club.type === state.clubFilters.type;
    const search = !state.clubFilters.search || normalize(`${club.name} ${club.city} ${club.discount}`).includes(normalize(state.clubFilters.search));
    return province && city && type && search;
  });
  const types = [...new Set(state.data.clubs.map(c => c.type))];
  return `
    ${topbar("Descuentos", "Clubs colaboradores y ventajas")}
    <section class="glass-card">
      <span class="kicker">Nuestros descuentos</span>
      <h2 class="h2">${state.data.clubs.length}+ partners deportivos</h2>
      <p class="tiny">Filtra por país, provincia, ciudad y tipo de descuento. Todos los datos son simulados para probar el MVP.</p>
    </section>
    <section class="filter-bar">
      <div class="search-box"><span>⌕</span><input class="input" data-filter="club-search" placeholder="Buscar club o descuento" value="${state.clubFilters.search}"></div>
      <div class="filter-grid"><select class="select"><option>España</option></select><select class="select" data-filter="club-province"><option value="">Provincia</option>${PROVINCES.map(p => `<option ${state.clubFilters.province === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
      <div class="filter-grid"><input class="input" data-filter="club-city" placeholder="Ciudad" value="${state.clubFilters.city}"><select class="select" data-filter="club-type"><option value="">Tipo de descuento</option>${types.map(t => `<option ${state.clubFilters.type === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    </section>
    <section class="card-stack">
      ${filtered.map(discountCard).join("") || `<div class="empty-state"><strong>No hay clubs con estos filtros</strong><p class="tiny">Prueba con otra provincia o tipo de descuento.</p></div>`}
    </section>`;
}

function discountCard(club) {
  return `<article class="discount-card">
    <div class="discount-cover" style="background-image:url('${club.image}')"></div>
    <div class="row-between"><div><strong>${club.name}</strong><div class="tiny">${club.city}, ${club.province} · ${club.distance} · ⭐ ${club.rating}</div></div><span class="chip chip-lime">${club.type}</span></div>
    <p class="discount-value">${club.discount}</p>
    <p class="tiny">${club.address}</p>
    <p class="tiny">Condiciones: ${club.conditions}</p>
    <div class="match-actions"><button class="btn btn-primary btn-small" data-action="view-discount" data-club-id="${club.id}">Ver descuento</button><button class="btn btn-secondary btn-small" data-action="directions" data-club-id="${club.id}">Cómo llegar</button></div>
  </article>`;
}

function renderProfile() {
  const u = state.user;
  const played = state.data.matches.filter(m => normalize(m.status).includes("jugado") || normalize(m.status).includes("confirmar")).length + 18;
  const wins = 13;
  const losses = 5;
  const winRate = Math.round((wins / (wins + losses)) * 100);
  return `
    ${topbar("Perfil", "Datos, historial y configuración")}
    <section class="profile-card profile-hero">
      <img class="avatar-lg" src="${u.avatar || avatar(8)}" alt="${u.name}">
      <h2 class="h2">${u.name} ${u.surname}</h2>
      <p class="tiny">${u.city}, ${u.province} · ${levelLabel(u)} · ${u.category}</p>
      <div class="pill-list" style="justify-content:center"><span class="chip chip-lime">${played} partidos</span><span class="chip chip-blue">${winRate}% victorias</span><span class="chip chip-gold">${state.data.incidents.length} incidencias</span></div>
    </section>
    <section class="grid-3 section">
      ${metricCard(played, "Jugados", "Histórico")}
      ${metricCard(wins, "Victorias", "Todas las fases")}
      ${metricCard(losses, "Derrotas", "Todas las fases")}
    </section>
    <section class="section glass-card">
      <h2 class="h2">Datos personales</h2>
      ${profileRow("Email", u.email)}${profileRow("Teléfono", u.phone)}${profileRow("Dirección", u.address)}${profileRow("Provincia", u.province)}${profileRow("Ciudad", u.city)}${profileRow("Nivel asignado", `${u.level || "—"}${u.levelScore !== null && u.levelScore !== undefined ? ` · ${u.levelScore}/20` : ""}`)}
      <button class="btn btn-primary btn-full section" data-action="edit-profile">Editar perfil</button>
    </section>
    <section class="section glass-card">
      <h2 class="h2">Historial de fases</h2>
      <div class="card-stack">${state.data.history.map(h => `<div class="glass-card" style="padding:12px;border-radius:18px"><div class="row-between"><strong>${h.phase}</strong><span class="chip chip-blue">Nivel ${h.level}</span></div><div class="tiny">${h.position} · ${h.result}</div></div>`).join("")}</div>
    </section>
    <section class="section glass-card">
      <h2 class="h2">Mis incidencias</h2>
      <div class="card-stack">${state.data.incidents.map(incidentCard).join("") || `<p class="tiny">No tienes incidencias abiertas.</p>`}</div>
      <button class="btn btn-danger btn-full section" data-action="new-incident">Abrir nueva incidencia</button>
    </section>
    <section class="section glass-card">
      <h2 class="h2">Configuración y ayuda</h2>
      <div class="setting-list">
        <button class="setting-item" data-action="help"><span>Ayuda y FAQ</span><strong>›</strong></button>
        <button class="setting-item" data-action="contact"><span>Contacto soporte</span><strong>›</strong></button>
        <button class="setting-item" data-action="terms"><span>Términos y condiciones</span><strong>›</strong></button>
        <button class="setting-item" data-action="privacy"><span>Política de privacidad</span><strong>›</strong></button>
        <button class="setting-item" data-action="logout"><span>Cerrar sesión</span><strong>⎋</strong></button>
      </div>
    </section>`;
}

function profileRow(label, value) {
  return `<div class="row-between" style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,.07)"><span class="tiny">${label}</span><strong style="font-size:.9rem;text-align:right">${value || "—"}</strong></div>`;
}

function incidentCard(i) {
  return `<div class="glass-card" style="padding:12px;border-radius:18px"><div class="row-between"><strong>${i.type}</strong><span class="chip ${i.status === "Resuelta" ? "chip-green" : i.status === "En revisión" ? "chip-gold" : "chip-red"}">${i.status}</span></div><div class="tiny">${i.match || "General"} · ${prettyDate(i.created)}</div><p class="tiny">${i.description}</p></div>`;
}

function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

function openModal(title, body) {
  const mount = document.getElementById("modalMount");
  if (!mount) return;
  mount.classList.add("open");
  mount.innerHTML = `<div class="modal-backdrop" data-action="close-modal"></div><div class="modal-panel"><div class="modal-head"><h2 class="modal-title">${title}</h2><button class="close-btn" data-action="close-modal">×</button></div>${body}</div>`;
}

function closeModal() {
  const mount = document.getElementById("modalMount");
  if (!mount) return;
  mount.classList.remove("open");
  mount.innerHTML = "";
}

function showToast(message) {
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>✅</span><strong>${message}</strong>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function howItWorksModal() {
  openModal("Cómo funciona la liga", `<div class="card-stack">
    <div class="glass-card"><p class="muted">Cada fase dura aproximadamente <strong>1 mes y medio</strong>. Los jugadores se dividen en <strong>grupos de 4</strong> dentro de su nivel y categoría. Cada jugador debe jugar <strong>3 partidos</strong>, uno contra cada rival. Al finalizar la fase, el primero sube de nivel, el último baja y los dos jugadores intermedios se mantienen.</p></div>
    <div class="grid-2">
      ${metricCard("1º", "Sube de nivel", "Ascenso automático")}
      ${metricCard("2º-3º", "Se mantiene", "Continúa en el nivel")}
      ${metricCard("4º", "Baja de nivel", "Descenso al nivel inferior")}
      ${metricCard("3", "Partidos", "Round robin simple")}
    </div>
  </div>`);
}

function resultModal(matchId) {
  const match = state.data.matches.find(m => m.id === matchId);
  if (!match) return;
  openModal("Registrar resultado", `<form class="form-grid" id="resultForm" data-match-id="${match.id}">
    <div class="row-start"><img class="avatar" src="${match.rival.avatar}" alt="${match.rival.name}"><div><strong>Partido vs ${match.rival.name}</strong><div class="tiny">${match.scheduled}</div></div></div>
    <div class="form-row"><label>Resultado por sets</label><input class="input" name="score" placeholder="Ej. 6-4 / 3-6 / 10-8" required></div>
    <div class="form-row"><label>Ganador</label><select class="select" name="winner" required><option>${state.user.name} ${state.user.surname}</option><option>${match.rival.name}</option></select></div>
    <div class="form-row"><label>Comentario opcional</label><textarea class="textarea" name="comment" rows="3" placeholder="Partido jugado correctamente, pista, observaciones..."></textarea></div>
    <button class="btn btn-primary btn-full" type="submit">Confirmar resultado</button>
  </form>`);
}

function proposeDateModal(matchId) {
  const match = state.data.matches.find(m => m.id === matchId);
  if (!match) return;
  openModal("Proponer fecha", `<form class="form-grid" id="dateForm" data-match-id="${match.id}">
    <div class="row-start"><img class="avatar" src="${match.rival.avatar}" alt="${match.rival.name}"><div><strong>${match.rival.name}</strong><div class="tiny">Coordina día, hora y club.</div></div></div>
    <div class="filter-grid"><div class="form-row"><label>Día</label><input class="input" type="date" name="date" required></div><div class="form-row"><label>Hora</label><input class="input" type="time" name="time" required></div></div>
    <div class="form-row"><label>Club propuesto</label><input class="input" name="club" placeholder="Ej. Club Ace Barcelona" required></div>
    <button class="btn btn-primary btn-full" type="submit">Enviar propuesta</button>
  </form>`);
}

function incidentModal(matchId = "") {
  const match = state.data.matches.find(m => m.id === matchId);
  openModal("Abrir incidencia", `<form class="form-grid" id="incidentForm" data-match-id="${matchId}">
    ${match ? `<div class="row-start"><img class="avatar" src="${match.rival.avatar}" alt="${match.rival.name}"><div><strong>Partido vs ${match.rival.name}</strong><div class="tiny">${match.status}</div></div></div>` : ""}
    <div class="form-row"><label>Motivo</label><select class="select" name="type" required><option>Rival no responde</option><option>No se ha presentado</option><option>Resultado incorrecto</option><option>Problema de comportamiento</option><option>Lesión</option><option>Otro</option></select></div>
    <div class="form-row"><label>Explicación</label><textarea class="textarea" name="description" rows="4" placeholder="Explica qué ha ocurrido" required></textarea></div>
    <button class="btn btn-danger btn-full" type="submit">Enviar incidencia</button>
  </form>`);
}

function reportMessageModal(chatId) {
  openModal("Reportar mensaje", `<form class="form-grid" id="messageReportForm" data-chat-id="${chatId}">
    <div class="form-row"><label>Motivo</label><select class="select" name="type" required><option>Lenguaje ofensivo</option><option>Acoso</option><option>Spam</option><option>Suplantación</option><option>No quiere jugar el partido</option><option>Otro</option></select></div>
    <div class="form-row"><label>Explicación</label><textarea class="textarea" name="description" rows="4" placeholder="Describe brevemente el problema" required></textarea></div>
    <button class="btn btn-danger btn-full" type="submit">Enviar reporte</button>
  </form>`);
}

function editProfileModal() {
  const u = state.user;
  openModal("Editar perfil", `<form class="form-grid" id="profileForm">
    <div class="filter-grid"><div class="form-row"><label>Nombre</label><input class="input" name="name" value="${u.name}" required></div><div class="form-row"><label>Apellidos</label><input class="input" name="surname" value="${u.surname}" required></div></div>
    <div class="form-row"><label>Foto / avatar URL</label><input class="input" name="avatar" value="${u.avatar || ""}" placeholder="https://..."></div>
    <div class="form-row"><label>Email</label><input class="input" name="email" type="email" value="${u.email}" required></div>
    <div class="form-row"><label>Teléfono</label><input class="input" name="phone" value="${u.phone}" required></div>
    <div class="form-row"><label>Dirección</label><input class="input" name="address" value="${u.address || ""}" required></div>
    <div class="filter-grid"><div class="form-row"><label>Provincia</label><select class="select" name="province">${PROVINCES.map(p => `<option ${u.province === p ? "selected" : ""}>${p}</option>`).join("")}</select></div><div class="form-row"><label>Ciudad</label><input class="input" name="city" value="${u.city}" required></div></div>
    <div class="filter-grid"><div class="form-row"><label>Nivel</label><select class="select" name="level">${LEVELS.map(l => `<option ${u.level === l ? "selected" : ""}>${l}</option>`).join("")}</select></div><div class="form-row"><label>Categoría</label><select class="select" name="category">${CATEGORIES.map(c => `<option ${u.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div></div>
    <button class="btn btn-primary btn-full" type="submit">Guardar cambios</button>
  </form>`);
}

function helpModal() {
  const faqs = [
    ["¿Cómo funciona la liga?", "Cada fase agrupa a 4 jugadores por nivel/categoría. Juegas 3 partidos y el ranking decide ascenso, permanencia o descenso."],
    ["¿Quién reserva la pista?", "Los jugadores coordinan el club y la reserva entre ellos. La plataforma solo conecta, ordena la liga y registra resultados."],
    ["¿Qué pasa si mi rival no responde?", "Puedes abrir una incidencia de rival no responde. Quedará guardada como abierta o en revisión."],
    ["¿Cómo se registran resultados?", "Desde Mis partidos, pulsa Registrar resultado. El sistema lo marca como pendiente de confirmar."],
    ["¿Cómo subo o bajo de nivel?", "El primero del grupo sube, el último baja y los dos jugadores del medio se mantienen."],
    ["¿Qué pasa si no juego mis partidos?", "En una app real se aplicarían reglas de penalización. En este MVP se muestra como incidencia o partido pendiente."],
    ["¿Puedo cambiar de provincia?", "Sí, desde Perfil puedes editar provincia y ciudad de forma simulada."],
    ["¿Puedo reportar un comportamiento inadecuado?", "Sí, desde chat o partido puedes abrir un reporte con motivo y explicación."],
  ];
  openModal("Ayuda y FAQ", `<div class="card-stack">${faqs.map(([q, a]) => `<div class="glass-card"><strong>${q}</strong><p class="tiny">${a}</p></div>`).join("")}</div>`);
}

function contactModal() {
  openModal("Contacto soporte", `<div class="card-stack"><div class="glass-card"><strong>Soporte RallyGo</strong><p class="tiny">Email: soporte@rallygo-league.app<br>Teléfono: +34 910 000 221</p></div><form class="form-grid" id="contactForm"><div class="form-row"><label>Motivo</label><input class="input" name="subject" placeholder="Ej. Duda sobre mi fase" required></div><div class="form-row"><label>Mensaje</label><textarea class="textarea" name="message" rows="4" required></textarea></div><button class="btn btn-primary btn-full">Enviar consulta</button></form></div>`);
}

function simpleInfoModal(title, text) {
  openModal(title, `<div class="glass-card"><p class="muted">${text}</p></div>`);
}

function viewDiscountModal(clubId) {
  const club = state.data.clubs.find(c => c.id === clubId);
  if (!club) return;
  openModal(club.name, `<div class="discount-card" style="padding:0;border:0;background:transparent;box-shadow:none"><div class="discount-cover" style="margin:0 0 14px;background-image:url('${club.image}')"></div><p class="discount-value">${club.discount}</p><p class="tiny">${club.address}</p><p class="tiny">Condiciones: ${club.conditions}</p><button class="btn btn-primary btn-full" data-action="close-modal">Guardar descuento</button></div>`);
}

function setView(view) {
  state.view = view;
  if (view !== "messages") state.selectedConversation = null;
  renderApp();
}

function validate(form) {
  let ok = true;
  const checkedRadioGroups = new Set();
  form.querySelectorAll("[required]").forEach(field => {
    let valid;
    if (field.type === "checkbox") {
      valid = field.checked;
      field.classList.toggle("invalid", !valid);
    } else if (field.type === "radio") {
      if (checkedRadioGroups.has(field.name)) return;
      checkedRadioGroups.add(field.name);
      const group = Array.from(form.querySelectorAll(`input[type="radio"][name="${field.name}"]`));
      valid = group.some(input => input.checked);
      group.forEach(input => input.closest(".assessment-question")?.classList.toggle("invalid", !valid));
    } else {
      valid = Boolean(String(field.value || "").trim());
      field.classList.toggle("invalid", !valid);
    }
    if (!valid) ok = false;
  });
  return ok;
}

function formDataObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

app.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-nav]");
  if (navButton) {
    setView(navButton.dataset.nav);
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "show-register") return renderAuth("register");
  if (action === "show-login") return renderAuth("login");
  if (action === "back-welcome") return renderWelcome();
  if (action === "demo-login") return demoLogin();
  if (action === "fake-recover") return showToast("Recuperación simulada enviada. Prueba el acceso demo.");
  if (action === "close-modal") return closeModal();
  if (action === "how-it-works") return howItWorksModal();
  if (action === "open-current-ranking") {
    state.selectedLeague = state.data.leagues.find(l => l.id === state.data.currentLeague.id) || state.data.leagues[0];
    state.rankingCategory = state.data.currentLeague.category;
    state.rankingLevel = state.data.currentLeague.level;
    state.view = "leagueDetail";
    return renderApp();
  }
  if (action === "view-league") {
    state.selectedLeague = state.data.leagues.find(l => l.id === button.dataset.leagueId);
    state.view = "leagueDetail";
    return renderApp();
  }
  if (action === "open-chat") {
    if (!hasFullLeagueAccess()) { state.view = "messages"; return renderApp(); }
    state.selectedConversation = button.dataset.chatId;
    const c = state.data.conversations.find(item => item.id === state.selectedConversation);
    if (c) c.unread = 0;
    persistData();
    state.view = "messages";
    return renderApp();
  }
  if (action === "back-messages") {
    state.selectedConversation = null;
    return renderView();
  }
  if (action === "register-result") return hasFullLeagueAccess() ? resultModal(button.dataset.matchId) : setView("matches");
  if (action === "propose-date") return hasFullLeagueAccess() ? proposeDateModal(button.dataset.matchId) : setView("matches");
  if (action === "report-match") return hasFullLeagueAccess() ? incidentModal(button.dataset.matchId) : setView("matches");
  if (action === "new-incident") return incidentModal();
  if (action === "report-message") return reportMessageModal(button.dataset.chatId);
  if (action === "block-user") return blockUser(button.dataset.chatId);
  if (action === "view-player") return viewPlayer(button.dataset.chatId);
  if (action === "view-discount") return viewDiscountModal(button.dataset.clubId);
  if (action === "directions") return showToast("Ruta simulada abierta. En producción se integraría con mapas.");
  if (action === "join-summer-reserve") {
    state.user.signupStatus = "summer-reserve";
    persistUser();
    return showToast("Te has apuntado como reserva. Te avisaremos cuando haya plaza.");
  }
  if (action === "edit-profile") return editProfileModal();
  if (action === "help") return helpModal();
  if (action === "contact") return contactModal();
  if (action === "terms") return simpleInfoModal("Términos y condiciones", "MVP simulado para pruebas. En una versión real se incluirían condiciones completas de participación, normas de conducta, protección de datos, reglas deportivas y responsabilidades sobre reservas externas.");
  if (action === "privacy") return simpleInfoModal("Política de privacidad", "Los datos de este MVP se guardan únicamente en localStorage de tu navegador. No se envían a ningún servidor ni se comparten con terceros.");
  if (action === "logout") return logout();
});

let filterRenderTimer = null;
app.addEventListener("input", (event) => {
  const field = event.target.closest("[data-filter]");
  if (!field) return;
  const key = field.dataset.filter;
  if (key === "league-search") state.leagueFilters.search = field.value;
  if (key === "club-search") state.clubFilters.search = field.value;
  if (key === "club-city") state.clubFilters.city = field.value;
  clearTimeout(filterRenderTimer);
  const activeKey = key;
  const caret = field.selectionStart || field.value.length;
  filterRenderTimer = setTimeout(() => {
    renderView();
    const next = document.querySelector(`[data-filter="${activeKey}"]`);
    if (next) {
      next.focus();
      try { next.setSelectionRange(caret, caret); } catch (_) {}
    }
  }, 180);
});

app.addEventListener("change", (event) => {
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    const key = filter.dataset.filter;
    if (key === "league-province") state.leagueFilters.province = filter.value;
    if (key === "league-sport") state.leagueFilters.sport = filter.value;
    if (key === "club-province") state.clubFilters.province = filter.value;
    if (key === "club-type") state.clubFilters.type = filter.value;
    if (key === "ranking-category") state.rankingCategory = filter.value;
    if (key === "ranking-level") state.rankingLevel = filter.value;
    renderView();
    return;
  }
  const tab = event.target.closest("[data-match-filter]");
  if (tab) {
    state.matchFilter = tab.dataset.matchFilter;
    renderView();
  }
});

app.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-match-filter]");
  if (!tab) return;
  state.matchFilter = tab.dataset.matchFilter;
  renderView();
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (form.id === "registerForm") {
    event.preventDefault();
    if (!validate(form)) return showToast("Revisa los campos obligatorios.");
    state.pendingRegistration = formDataObject(form);
    renderLevelAssessment();
    showToast("Cuenta preparada. Completa la nivelación para asignar tu nivel inicial.");
  }

  if (form.id === "levelAssessmentForm") {
    event.preventDefault();
    if (!validate(form)) return showToast("Responde las 5 preguntas de nivelación.");
    const pending = state.pendingRegistration;
    if (!pending) return renderAuth("register");
    const answers = formDataObject(form);
    const totalScore = Object.values(answers).reduce((sum, value) => sum + Number(value || 0), 0);
    const assignedLevel = calculateInitialLevel(totalScore);
    state.user = {
      name: pending.name,
      surname: pending.surname,
      email: pending.email,
      phone: pending.phone,
      address: pending.address,
      province: pending.province,
      city: pending.city,
      birth: pending.birth,
      gender: pending.gender,
      level: assignedLevel,
      category: pending.category,
      sport: "Pickleball",
      avatar: avatar(11),
      accessMode: "registered",
      leagueAccess: "none",
      signupStatus: "not_enrolled",
      levelSource: "nivelación inicial",
      levelScore: totalScore,
      levelAssessment: answers
    };
    state.data = createDefaultData(state.user);
    migrateToPickleballOnly();
    forcePickleballImages();
    state.pendingRegistration = null;
    persistUser();
    persistData();
    state.view = "inscriptions";
    renderApp();
    showToast(`Nivel asignado: ${assignedLevel}. Ya puedes inscribirte en una liga.`);
  }

  if (form.id === "loginForm") {
    event.preventDefault();
    if (!validate(form)) return showToast("Introduce email/teléfono y contraseña.");
    state.user = normalizeUser(readJSON(STORAGE.user, null)) || createDefaultUser();
    const savedData = readJSON(STORAGE.data, null);
    state.data = isValidData(savedData) ? savedData : createDefaultData(state.user);
    migrateToPickleballOnly();
    forcePickleballImages();
    persistUser();
    persistData();
    renderApp();
    showToast("Sesión iniciada correctamente.");
  }

  if (form.id === "resultForm") {
    event.preventDefault();
    if (!validate(form)) return showToast("Añade resultado y ganador.");
    const data = formDataObject(form);
    const match = state.data.matches.find(m => m.id === form.dataset.matchId);
    if (match) {
      match.status = "Resultado pendiente de confirmar";
      match.result = data.score;
      const c = state.data.conversations.find(conv => conv.id === match.chatId);
      if (c) {
        c.messages.push({ from: "me", text: `Resultado enviado: ${data.score}. Ganador: ${data.winner}.`, time: currentTime() });
        c.last = "Resultado enviado para confirmación.";
      }
    }
    state.data.currentLeague.phaseProgress = Math.min(100, state.data.currentLeague.phaseProgress + 18);
    persistData();
    closeModal();
    renderApp();
    showToast("Resultado enviado para confirmación.");
  }

  if (form.id === "dateForm") {
    event.preventDefault();
    if (!validate(form)) return showToast("Completa día, hora y club.");
    const data = formDataObject(form);
    const match = state.data.matches.find(m => m.id === form.dataset.matchId);
    if (match) {
      match.status = "Partido programado";
      match.scheduled = `${prettyDate(data.date)} · ${data.time} · ${data.club}`;
      const c = state.data.conversations.find(conv => conv.id === match.chatId);
      if (c) {
        c.messages.push({ from: "me", text: `Te propongo jugar el ${prettyDate(data.date)} a las ${data.time} en ${data.club}.`, time: currentTime() });
        c.last = "Nueva propuesta de fecha enviada.";
      }
    }
    persistData();
    closeModal();
    renderApp();
    showToast("Propuesta enviada al rival.");
  }

  if (form.id === "incidentForm") {
    event.preventDefault();
    if (!validate(form)) return showToast("Completa motivo y explicación.");
    const data = formDataObject(form);
    const match = state.data.matches.find(m => m.id === form.dataset.matchId);
    if (match) match.status = "Incidencia abierta";
    state.data.incidents.unshift({
      id: `i-${Date.now()}`,
      type: data.type,
      match: match ? match.rival.name : "General",
      status: "Abierta",
      created: todayISO(),
      description: data.description
    });
    persistData();
    closeModal();
    renderApp();
    showToast("Incidencia abierta y guardada localmente.");
  }

  if (form.id === "messageReportForm") {
    event.preventDefault();
    if (!validate(form)) return showToast("Completa el reporte.");
    const data = formDataObject(form);
    const c = state.data.conversations.find(conv => conv.id === form.dataset.chatId);
    state.data.incidents.unshift({
      id: `i-${Date.now()}`,
      type: data.type,
      match: c ? c.player.name : "Chat",
      status: "En revisión",
      created: todayISO(),
      description: data.description
    });
    persistData();
    closeModal();
    renderApp();
    showToast("Reporte enviado al equipo de liga.");
  }

  if (form.id === "sendMessageForm") {
    event.preventDefault();
    const input = form.elements.message;
    const text = input.value.trim();
    if (!text) return;
    const c = state.data.conversations.find(conv => conv.id === form.dataset.chatId);
    if (c && !c.blocked) {
      c.messages.push({ from: "me", text, time: currentTime() });
      c.last = text;
      persistData();
      input.value = "";
      renderView();
    }
  }

  if (form.id === "profileForm") {
    event.preventDefault();
    if (!validate(form)) return showToast("Revisa los campos del perfil.");
    state.user = { ...state.user, ...formDataObject(form), sport: "Pickleball" };
    state.data.currentLeague.province = state.user.province;
    state.data.currentLeague.city = state.user.city;
    state.data.currentLeague.level = state.user.level;
    state.data.currentLeague.category = state.user.category;
    persistUser();
    persistData();
    closeModal();
    renderApp();
    showToast("Perfil actualizado en localStorage.");
  }

  if (form.id === "winterSignupForm") {
    event.preventDefault();
    if (!validate(form)) return showToast("Elige categoría y provincia.");
    const data = formDataObject(form);
    state.user.category = data.category;
    state.user.province = data.province;
    state.user.leagueAccess = "active";
    state.user.signupStatus = "winter-paid";
    state.user.accessMode = state.user.accessMode || "registered";
    state.data.currentLeague = {
      ...state.data.currentLeague,
      id: "winter-league",
      name: `Liga de Invierno Pickleball ${data.province}`,
      province: data.province,
      city: state.user.city || data.province,
      category: data.category,
      level: state.user.level || "2.5",
      group: "Grupo pendiente",
      phase: "Inscripción confirmada",
      startDate: todayISO(21),
      deadline: todayISO(70),
      phaseProgress: 0,
      points: 0,
      groupPosition: "—"
    };
    persistUser();
    persistData();
    state.view = "matches";
    renderApp();
    showToast("Pago simulado confirmado. Funciones desbloqueadas y partidos próximamente.");
  }

  if (form.id === "contactForm") {
    event.preventDefault();
    closeModal();
    showToast("Consulta enviada de forma simulada.");
  }
});

function currentTime() {
  return new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function blockUser(chatId) {
  const c = state.data.conversations.find(conv => conv.id === chatId);
  if (!c) return;
  c.blocked = true;
  c.messages.push({ from: "me", text: "Usuario bloqueado. Ya no podrá contactar contigo en este chat.", time: currentTime() });
  c.last = "Usuario bloqueado.";
  persistData();
  renderApp();
  showToast("Usuario bloqueado. Ya no podrá contactar contigo.");
}

function viewPlayer(chatId) {
  const c = state.data.conversations.find(conv => conv.id === chatId);
  if (!c) return;
  openModal(`Perfil de ${c.player.name}`, `<div class="profile-card profile-hero"><img class="avatar-lg" src="${c.player.avatar}" alt="${c.player.name}"><h2 class="h2">${c.player.name}</h2><p class="tiny">${c.player.city} · Nivel ${c.player.level}</p><div class="pill-list" style="justify-content:center"><span class="chip chip-lime">Rival de fase</span><span class="chip chip-blue">Respuesta media 2h</span></div></div>`);
}

function logout() {
  localStorage.removeItem(STORAGE.user);
  state.user = null;
  state.view = "home";
  state.selectedConversation = null;
  renderWelcome();
  showToast("Sesión cerrada.");
}

window.addEventListener("error", event => {
  console.error("Runtime error", event.error || event.message);
  if (!document.getElementById("viewRoot") && app) {
    app.innerHTML = `<section class="auth-shell"><div class="auth-card"><div class="logo-mark">RG</div><h1 class="auth-title">RallyGo se ha reiniciado</h1><p class="auth-lead">Había datos locales antiguos o corruptos. Usa el modo demo para abrir una versión limpia con imágenes de pickleball.</p><button class="btn btn-primary btn-full" onclick="localStorage.clear(); location.reload();">Reiniciar demo local</button></div></section>`;
  }
});

init();
