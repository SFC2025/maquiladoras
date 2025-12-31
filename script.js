// script.js
// Cambiar:
// - WHATSAPP_NUMBER: acá abajo
// - CHAT_WIDGET_ID: en el bloque Live Chat (Tawk.to/Crisp) más abajo
// - CONTACT_EMAIL: en index.html, atributo action del <form id="quote-form">

// ===== CONFIG =====
const WHATSAPP_NUMBER = "5490000000000"; // <- Número en formato internacional sin espacios ni signos
const WHATSAPP_MSG = "Hola, quiero más información sobre los productos.";

// ===== WHATSAPP ENLACES =====
const waDigits = WHATSAPP_NUMBER.replace(/\D/g, ""); // asegura sólo dígitos
const waLink = (msg) =>
  `https://wa.me/${waDigits}?text=${encodeURIComponent(msg)}`;

const waBtn = document.getElementById("whatsapp-btn"); // FAB flotante
const ctaWa = document.getElementById("cta-whatsapp"); // CTA en Contacto

function updateWaLinks(producto = "") {
  const baseFabMsg = producto
    ? `${WHATSAPP_MSG}\nProducto: ${producto}`
    : WHATSAPP_MSG;

  const baseCtaMsg = producto
    ? `Quiero solicitar una cotización de: ${producto}`
    : "Quiero solicitar una cotización.";

  if (waBtn) waBtn.href = waLink(baseFabMsg);
  if (ctaWa) ctaWa.href = waLink(baseCtaMsg);
}

// ===== ABRIR MODAL DESDE CUALQUIER BOTÓN =====
document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-open-modal]");
  if (!trigger) return;

  e.preventDefault();

  const fromAttr =
    trigger.dataset.product ||
    trigger.closest("[data-product]")?.dataset.product ||
    "";

  let product = fromAttr;
  if (!product) {
    const card = trigger.closest(".card");
    const title = card?.querySelector(".card-title")?.textContent?.trim();
    if (title) product = title;
  }

  openModal(product);
});

// estado inicial (sin producto)
updateWaLinks();

// ===== NAV RESPONSIVE =====
const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("nav-menu");
if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

// ===== MODAL CON ENFOQUE ACCESIBLE =====
const modal = document.getElementById("modal");
const form = document.getElementById("quote-form");
let lastFocused = null;

function openModal(producto = "") {
  if (!modal) return;
  lastFocused = document.activeElement;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  // Precargar el textarea con el producto si corresponde
  if (producto && form) {
    const ta = form.querySelector("textarea[name='mensaje']");
    if (ta) ta.value = `Quiero cotizar: ${producto}`;
  }
  // >>> NUEVO: actualiza los enlaces de WhatsApp con el producto
  updateWaLinks(producto);
  // Enfoque inicial en el primer input
  const firstInput = modal.querySelector("input, textarea, button");
  if (firstInput) firstInput.focus();

  // Atrapar foco dentro del modal
  function trap(e) {
    const focusables = modal.querySelectorAll(
      "a[href], button, textarea, input, select, [tabindex]:not([tabindex='-1'])"
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    if (e.key === "Escape") closeModal();
  }
  modal.addEventListener("keydown", trap);
  modal._trap = trap;
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (modal._trap) modal.removeEventListener("keydown", modal._trap);
  if (lastFocused) lastFocused.focus();
  // >>> NUEVO: restablece los enlaces sin producto
  updateWaLinks();
}

// Cerrar al hacer click fuera del diálogo
window.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
window.openModal = openModal;
window.closeModal = closeModal;

// ===== VALIDACIÓN SIMPLE DEL FORM =====
if (form) {
  form.addEventListener("submit", (e) => {
    const email = form.querySelector("input[type='email']");
    if (email && !/^\S+@\S+\.\S+$/.test(email.value)) {
      e.preventDefault();
      alert("Por favor, ingresá un email válido.");
      email.focus();
    }
  });
}

// ===== LIVE CHAT (Tawk.to o Crisp) =====
// Tawk.to (ejemplo): reemplazá "CHAT_WIDGET_ID" por tu ID real o dejá comentado si aún no tenés.
// var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
// (function(){
//   var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
//   s1.async=true;
//   s1.src='https://embed.tawk.to/CHAT_WIDGET_ID/1';
//   s1.charset='UTF-8';
//   s1.setAttribute('crossorigin','*');
//   s0.parentNode.insertBefore(s1,s0);
// })();

// Crisp (alternativa):
// window.$crisp = [];
// window.CRISP_WEBSITE_ID = "CHAT_WIDGET_ID";
// (function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();

// ===== MEJORAS SUAVES =====
const cards = document.querySelectorAll(".card");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("in");
    });
  },
  { threshold: 0.15 }
);
cards.forEach((c) => io.observe(c));

// ===== BUSCAR + CATEGORÍAS RÁPIDAS =====
const search = document.getElementById("search");
const searchForm = document.getElementById("search-form");
const chips = document.querySelectorAll(".chip");
const crumb = document.getElementById("crumb-cat");
const cardsAll = [...document.querySelectorAll(".products-grid .card")];

searchForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  runFilters();
  document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
});

function debounce(fn, wait = 160) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}

function activeCategory() {
  const act = document.querySelector(".chip.is-active")?.dataset.cat || "*";
  if (crumb) crumb.textContent = act === "*" ? "Todos" : act;
  return act;
}

function getCheckedValues(selector) {
  return new Set(
    [...document.querySelectorAll(selector)]
      .filter((el) => el.checked)
      .map((el) => el.value)
  );
}

function runFilters() {
  const term = (search?.value || "").toLowerCase().trim();
  const chipCat = activeCategory(); // "*" o "Guantes" etc.

  // Filtros laterales (si existen)
  const checkedCats = getCheckedValues('#filters input[name="cat"]');
  const checkedBrands = getCheckedValues('#filters input[name="brand"]');

  cardsAll.forEach((card) => {
    const title =
      card.querySelector(".card-title")?.textContent?.toLowerCase().trim() ||
      "";

    const attrs = [...card.querySelectorAll(".card-attrs li")]
      .map((li) => li.textContent?.toLowerCase().trim())
      .join(" ");

    const sku = (card.dataset.sku || "").toLowerCase().trim();
    const catTxt = (card.dataset.category || "").toLowerCase().trim();
    const brandTxt = (card.dataset.brand || "").toLowerCase().trim();
    const prodTxt = (card.dataset.product || "").toLowerCase().trim();

    // Todo lo “buscable” en un solo string
    const haystack =
      `${title} ${attrs} ${sku} ${catTxt} ${brandTxt} ${prodTxt}`.trim();

    // Ahora sí: si escribís "guantes" matchea por data-category
    const byTerm = !term || haystack.includes(term);

    // Chip: si no es "*", obliga esa categoría
    const byChipCat = chipCat === "*" || card.dataset.category === chipCat;

    // Sidebar: si no hay nada tildado en una dimensión, NO muestra nada
    const catBoxes = document.querySelectorAll('#filters input[name="cat"]');
    const brandBoxes = document.querySelectorAll(
      '#filters input[name="brand"]'
    );

    const bySideCat = !catBoxes.length
      ? true
      : checkedCats.size > 0 && checkedCats.has(card.dataset.category);

    const bySideBrand = !brandBoxes.length
      ? true
      : checkedBrands.size > 0 && checkedBrands.has(card.dataset.brand);

    card.dataset.hidden = !(byTerm && byChipCat && bySideCat && bySideBrand);
  });

  applyPaging(true); // reinicia paginación tras filtrar
}

search?.addEventListener(
  "input",
  debounce(() => {
    runFilters();

    // Si hay texto, baja a la sección productos para que se vea el filtro
    const termNow = (search?.value || "").trim();
    if (termNow) {
      document
        .getElementById("productos")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  })
);
// Botón "Buscar" (submit del form)
searchForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  runFilters();
  document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    runFilters();
  });
});

// ===== FILTROS LATERALES (checkboxes) =====
const filters = document.getElementById("filters");
document
  .getElementById("toggle-filters")
  ?.addEventListener("click", () => filters?.classList.toggle("open"));

filters?.addEventListener("change", () => {
  runFilters();
});

document.getElementById("clear-filters")?.addEventListener("click", () => {
  // 1) DESTILDAR todos los filtros laterales (queda todo en blanco)
  document
    .querySelectorAll('#filters input[type="checkbox"]')
    .forEach((cb) => (cb.checked = false));

  // 2) Volver chip a "Todas"
  chips.forEach((c) => c.classList.remove("is-active"));
  document.querySelector('.chip[data-cat="*"]')?.classList.add("is-active");

  // 3) Limpiar búsqueda
  if (search) search.value = "";

  // 4) Refiltrar + paginar
  runFilters();
});

// ===== PAGINACIÓN "Cargar más" / "Mostrar menos" =====
const PAGE = 8;
let visible = PAGE;

const loadMoreBtn = document.getElementById("load-more");
const loadLessBtn = document.getElementById("load-less");

function applyPaging(reset = false) {
  if (reset) visible = PAGE;

  const visibles = cardsAll.filter((c) => c.dataset.hidden !== "true");
  const total = visibles.length;

  // Mostrar sólo las 'visible' primeras
  visibles.forEach((c, i) => (c.style.display = i < visible ? "" : "none"));
  cardsAll
    .filter((c) => c.dataset.hidden === "true")
    .forEach((c) => (c.style.display = "none"));

  // Alternar botones
  if (visible >= total) {
    // si ya muestro todos, solo habilito "Mostrar menos"
    loadMoreBtn.hidden = true;
    loadLessBtn.hidden = false;
  } else if (visible > PAGE) {
    // si estoy en una página intermedia, muestro "Mostrar menos"
    loadMoreBtn.hidden = true;
    loadLessBtn.hidden = false;
  } else {
    // estado inicial (solo primera página)
    loadMoreBtn.hidden = false;
    loadLessBtn.hidden = true;
  }
}

// Cargar más: suma un bloque
loadMoreBtn?.addEventListener("click", () => {
  visible += PAGE;
  applyPaging();
});

// Mostrar menos: vuelve al inicio
loadLessBtn?.addEventListener("click", () => {
  visible = PAGE;
  applyPaging();

  // scroll suave al inicio
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const productos = document.getElementById("productos");
  if (productos) {
    window.scrollTo({
      top: productos.offsetTop - 80,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  }
});

// init
applyPaging(true);
