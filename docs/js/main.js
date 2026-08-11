/* ============================================================
   AKB Бишкек — логика главной страницы
   Работает и с сервером (API), и в демо-режиме без сервера:
   если /api недоступен, каталог и подбор берутся из локальных данных.
   ============================================================ */

const API = '/api';
let PRODUCTS = [];
let filtered = [];
let DEMO_MODE = false;

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* ---------- демо-данные (те же, что seed в БД) ---------- */
const DEMO_PRODUCTS = [
  { id: 1,  name: 'Bosch S4 Silver',      brand: 'Bosch',  capacity: 60, current: 540, price: 11500, polarity: 'прямая',   image: 'images/battery-bosch.svg'  },
  { id: 2,  name: 'Bosch S5 Silver',      brand: 'Bosch',  capacity: 70, current: 680, price: 13500, polarity: 'прямая',   image: 'images/battery-bosch.svg'  },
  { id: 3,  name: 'Varta Blue Dynamic',   brand: 'Varta',  capacity: 60, current: 540, price: 10800, polarity: 'прямая',   image: 'images/battery-varta.svg'  },
  { id: 4,  name: 'Varta Blue Dynamic',   brand: 'Varta',  capacity: 74, current: 680, price: 12600, polarity: 'прямая',   image: 'images/battery-varta.svg'  },
  { id: 5,  name: 'Mutlu Calcium Silver', brand: 'Mutlu',  capacity: 60, current: 540, price: 9400,  polarity: 'прямая',   image: 'images/battery-mutlu.svg'  },
  { id: 6,  name: 'Mutlu Calcium Silver', brand: 'Mutlu',  capacity: 72, current: 640, price: 10600, polarity: 'обратная', image: 'images/battery-mutlu.svg'  },
  { id: 7,  name: 'Topla Stop&Go',        brand: 'Topla',  capacity: 60, current: 620, price: 9900,  polarity: 'прямая',   image: 'images/battery-topla.svg'  },
  { id: 8,  name: 'Topla Energy',         brand: 'Topla',  capacity: 72, current: 640, price: 11000, polarity: 'прямая',   image: 'images/battery-topla.svg'  },
  { id: 9,  name: 'Exide Premium',        brand: 'Exide',  capacity: 60, current: 640, price: 11800, polarity: 'прямая',   image: 'images/battery-generic.svg'},
  { id: 10, name: 'Banner Power Bull',    brand: 'Banner', capacity: 60, current: 540, price: 12300, polarity: 'прямая',   image: 'images/battery-generic.svg'},
  { id: 11, name: 'Akom Standard',        brand: 'Akom',   capacity: 55, current: 460, price: 7900,  polarity: 'прямая',   image: 'images/battery-akom.svg'   },
  { id: 12, name: 'Akom Standard',        brand: 'Akom',   capacity: 62, current: 540, price: 8700,  polarity: 'прямая',   image: 'images/battery-akom.svg'   }
];

/* ---------- данные для подбора по авто ---------- */
const CARS = {
  'Toyota': {
    'Camry 30/40':      { cap: 60, cur: 540 },
    'Camry 50/70':      { cap: 75, cur: 720 },
    'Corolla':          { cap: 55, cur: 480 },
    'RAV4':             { cap: 65, cur: 600 },
    'Land Cruiser 200': { cap: 95, cur: 850 },
    'Prius (гибрид)':   { cap: 45, cur: 400 },
    'Hilux':            { cap: 80, cur: 700 }
  },
  'Hyundai': {
    'Accent':           { cap: 55, cur: 460 },
    'Sonata':           { cap: 60, cur: 540 },
    'Elantra':          { cap: 60, cur: 540 },
    'Tucson':           { cap: 70, cur: 660 },
    'Santa Fe':         { cap: 80, cur: 700 },
    'Creta':            { cap: 60, cur: 540 }
  },
  'Kia': {
    'Rio':              { cap: 60, cur: 520 },
    'Sportage':         { cap: 60, cur: 540 },
    'K5':               { cap: 70, cur: 660 },
    'Sorento':          { cap: 80, cur: 760 }
  },
  'Lexus': {
    'RX':               { cap: 80, cur: 760 },
    'LX':               { cap: 95, cur: 850 },
    'ES':               { cap: 75, cur: 720 },
    'NX':               { cap: 70, cur: 660 }
  },
  'Mercedes-Benz': {
    'E-Class':          { cap: 74, cur: 700 },
    'C-Class':          { cap: 70, cur: 660 },
    'GLC':              { cap: 80, cur: 760 },
    'GLE':              { cap: 92, cur: 850 }
  },
  'BMW': {
    '3 серия':          { cap: 70, cur: 660 },
    '5 серия':          { cap: 80, cur: 720 },
    'X5':               { cap: 92, cur: 850 },
    'X3':               { cap: 80, cur: 720 }
  },
  'Volkswagen': {
    'Polo':             { cap: 60, cur: 540 },
    'Passat':           { cap: 70, cur: 660 },
    'Tiguan':           { cap: 70, cur: 680 },
    'Golf':             { cap: 60, cur: 540 }
  },
  'Nissan': {
    'X-Trail':          { cap: 70, cur: 660 },
    'Teana':            { cap: 65, cur: 600 },
    'Note':             { cap: 45, cur: 420 },
    'Patrol':           { cap: 95, cur: 850 }
  },
  'Honda': {
    'Accord':           { cap: 65, cur: 600 },
    'Fit / Jazz':       { cap: 45, cur: 420 },
    'CR-V':             { cap: 65, cur: 600 },
    'Pilot':            { cap: 80, cur: 700 }
  },
  'Lada / ВАЗ': {
    'Priora':           { cap: 55, cur: 460 },
    'Granta':           { cap: 55, cur: 460 },
    'Niva 4x4':         { cap: 65, cur: 520 },
    'Vesta':            { cap: 60, cur: 520 }
  },
  'Газель': {
    'Бизнес (бензин)':  { cap: 65, cur: 560 },
    'Бизнес (дизель)':  { cap: 75, cur: 680 }
  }
};

/* ---------- helpers ---------- */
const fmt = (n) => new Intl.NumberFormat('ru-RU').format(n);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const okPhone = (v) => /^[+\d][\d\s()-]{6,19}$/.test(v.trim());

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.style.borderColor = isError ? 'rgba(255,77,77,.6)' : 'rgba(46,204,113,.5)';
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3500);
}

/* ============================================================
   ЗАГРУЗКА КАТАЛОГА
   ============================================================ */
async function loadCatalog() {
  try {
    PRODUCTS = await api(`${API}/products`);
  } catch (e) {
    DEMO_MODE = true;
    PRODUCTS = DEMO_PRODUCTS;
    $('#demoNote').classList.remove('hidden');
  }
  fillBrandFilter();
  applyFilters();
}

function fillBrandFilter() {
  const sel = $('#fBrand');
  [...new Set(PRODUCTS.map((p) => p.brand))].sort().forEach((b) => {
    const o = document.createElement('option');
    o.value = b;
    o.textContent = b;
    sel.appendChild(o);
  });
}

/* ============================================================
   ФИЛЬТРЫ + ПОИСК + СОРТИРОВКА
   ============================================================ */
function applyFilters() {
  const min = parseInt($('#fPriceMin').value, 10) || 0;
  const max = parseInt($('#fPriceMax').value, 10) || Infinity;
  const q = $('#fSearch').value.trim().toLowerCase();
  const sort = $('#fSort').value;

  filtered = PRODUCTS.filter((p) =>
    (!$('#fBrand').value || p.brand === $('#fBrand').value) &&
    (p.price >= min && p.price <= max) &&
    (!$('#fCapacity').value || p.capacity === Number($('#fCapacity').value)) &&
    (!$('#fPolarity').value || p.polarity === $('#fPolarity').value) &&
    (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || String(p.capacity).includes(q))
  );

  if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (sort === 'capacity') filtered.sort((a, b) => a.capacity - b.capacity || b.current - a.current);
  else if (sort === 'brand') filtered.sort((a, b) => a.brand.localeCompare(b.brand, 'ru'));

  renderCatalog();
}

function resetFilters() {
  ['fBrand', 'fCapacity', 'fPolarity', 'fSort'].forEach((id) => { $(`#${id}`).value = ''; });
  $('#fSearch').value = '';
  $('#fPriceMin').value = '';
  $('#fPriceMax').value = '';
  applyFilters();
}

/* ============================================================
   КАТАЛОГ
   ============================================================ */
function renderCatalog() {
  const grid = $('#catalogGrid');
  $('#emptyState').classList.toggle('hidden', filtered.length > 0);
  $('#catalogCount').textContent = filtered.length
    ? `Показано ${fmt(filtered.length)} из ${fmt(PRODUCTS.length)}`
    : '';

  if (!filtered.length) { grid.innerHTML = ''; return; }

  grid.innerHTML = filtered.map((p) => `
    <article class="card" data-order="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)} — подробнее">
      <div class="card__img">
        <span class="card__brand">${esc(p.brand)}</span>
        <span class="card__stock">В наличии</span>
        <img src="${esc(p.image || 'images/battery-generic.svg')}" alt="${esc(p.name)} — аккумулятор ${p.capacity} Ач" loading="lazy" onerror="this.src='images/battery-generic.svg'">
      </div>
      <div class="card__body">
        <h3 class="card__name">${esc(p.name)}</h3>
        <div class="card__specs">
          <div class="card__spec"><span>Ёмкость</span><b>${p.capacity} Ач</b></div>
          <div class="card__spec"><span>Пусковой ток</span><b>${p.current} А</b></div>
          <div class="card__spec"><span>Полярность</span><b>${esc(p.polarity)}</b></div>
        </div>
        <div class="card__bottom">
          <div class="card__price">${fmt(p.price)} <small>сом</small></div>
          <button class="btn btn--yellow btn--sm" data-order="${p.id}">Заказать</button>
        </div>
      </div>
    </article>
  `).join('');
}

/* делегирование: клик по карточке/кнопке → детальная карточка */
const gridEl = $('#catalogGrid');

gridEl.addEventListener('click', (e) => {
  const el = e.target.closest('[data-order]');
  if (el) openProductModal(Number(el.dataset.order));
});

gridEl.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'BUTTON') return;
  if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.order) {
    e.preventDefault();
    openProductModal(Number(e.target.dataset.order));
  }
});

/* ============================================================
   ПОДБОР ПО АВТО
   ============================================================ */
const brandSel = $('#fCarBrand');
const modelSel = $('#fCarModel');

Object.keys(CARS).forEach((b) => {
  const o = document.createElement('option');
  o.value = b;
  o.textContent = b;
  brandSel.appendChild(o);
});

brandSel.addEventListener('change', () => {
  modelSel.innerHTML = '';
  modelSel.disabled = !brandSel.value;
  $('#finderResult').classList.remove('show');
  if (!brandSel.value) return;
  modelSel.innerHTML = '<option value="">Выберите модель…</option>';
  Object.keys(CARS[brandSel.value]).forEach((m) => {
    const o = document.createElement('option');
    o.value = m;
    o.textContent = m;
    modelSel.appendChild(o);
  });
});

$('#finderGo').addEventListener('click', runFinder);
modelSel.addEventListener('change', runFinder);

function runFinder() {
  const brand = brandSel.value;
  const model = modelSel.value;
  const box = $('#finderResult');
  if (!brand || !model) return;

  const need = CARS[brand][model];
  const fits = PRODUCTS
    .filter((p) => p.capacity >= need.cap - 6 && p.capacity <= need.cap + 10 && p.current >= need.cur - 40)
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);

  if (!fits.length) {
    box.innerHTML = `<div class="finder__hint">Для ${esc(brand)} ${esc(model)} подберите АКБ от ${need.cap} Ач — позвоните, подберём вручную.</div>`;
    box.classList.add('show');
    return;
  }

  box.innerHTML = `
    <div class="finder__hint">Для <b>${esc(brand)} ${esc(model)}</b> подходят: от ${need.cap} Ач, пусковой ток от ${need.cur} А</div>
    ${fits.map((p) => `
      <div class="card finder-card">
        <div class="card__img">
          <span class="card__brand">${esc(p.brand)}</span>
          <img src="${esc(p.image || 'images/battery-generic.svg')}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='images/battery-generic.svg'">
        </div>
        <div class="card__body">
          <h3 class="card__name">${esc(p.name)}</h3>
          <div class="card__specs">
            <div class="card__spec"><span>Ёмкость</span><b>${p.capacity} Ач</b></div>
            <div class="card__spec"><span>Пусковой ток</span><b>${p.current} А</b></div>
          </div>
          <div class="card__bottom">
            <div class="card__price">${fmt(p.price)} <small>сом</small></div>
            <button class="btn btn--yellow btn--sm" data-order="${p.id}">Заказать</button>
          </div>
        </div>
      </div>`).join('')}`;
  box.classList.add('show');

  box.querySelectorAll('[data-order]').forEach((b) =>
    b.addEventListener('click', () => openProductModal(Number(b.dataset.order))));
}

/* ============================================================
   ДЕТАЛЬНАЯ КАРТОЧКА ТОВАРА
   ============================================================ */
let CURRENT_PRODUCT = null;

const WARRANTY = {
  'Bosch': 3, 'Varta': 3, 'Banner': 3,
  'Topla': 2, 'Exide': 2, 'Mutlu': 2, 'Akom': 2
};

function openProductModal(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  CURRENT_PRODUCT = p;

  $('#mImg').src = p.image || 'images/battery-generic.svg';
  $('#mBrand').textContent = p.brand;
  $('#mStock').textContent = 'В наличии';
  $('#mName').textContent = p.name;
  $('#mDesc').textContent = p.description ||
    `Аккумулятор ${p.brand} ${p.capacity} Ач — уверенный холодный пуск и длительный срок службы.`;
  $('#mPrice').innerHTML = `${fmt(p.price)} <small>сом</small>`;

  const warranty = WARRANTY[p.brand] || 2;
  $('#mSpecs').innerHTML = [
    ['Ёмкость', `${p.capacity} Ач`],
    ['Пусковой ток', `${p.current} А`],
    ['Полярность', esc(p.polarity)],
    ['Напряжение', '12 В'],
    ['Гарантия', `${warranty} года`],
    ['Выкуп б/у', 'до 1500 сом']
  ].map(([k, v]) => `<div class="spec"><span>${k}</span><b>${v}</b></div>`).join('');

  $('#modalWarranty').textContent = `Гарантия ${warranty} года. При заводском дефекте заменим бесплатно — проверяем каждый АКБ перед продажей.`;

  const m = $('#orderModal');
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#mNameField').focus(), 300);
}

function closeModal() {
  const m = $('#orderModal');
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  $('#modalForm').reset();
}

/* ============================================================
   ОТПРАВКА ЗАЯВОК
   ============================================================ */
async function sendOrder(data) {
  if (DEMO_MODE) return; // демо: сервера нет
  return api(`${API}/orders`, { method: 'POST', body: JSON.stringify(data) });
}

function showOrderSuccess(form) {
  form.classList.add('hidden');
  const s = $('#formSuccess');
  s.classList.remove('hidden');
  s.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

$('#orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  clearErrors(form);

  const name = form.customerName.value.trim();
  const phone = form.phone.value.trim();
  if (!validate(form, 'customerName', name.length >= 2)) return;
  if (!validate(form, 'phone', okPhone(phone))) return;

  try {
    await sendOrder({ customerName: name, phone, car: form.car.value.trim(), comment: form.comment.value.trim() });
    showOrderSuccess(form);
    toast(DEMO_MODE ? 'Демо: заявка принята' : 'Заявка отправлена');
  } catch (err) {
    toast(err.message || 'Ошибка отправки', true);
  }
});

$('#modalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  clearErrors(form);

  const name = $('#mNameField').value.trim();
  const phone = $('#mPhoneField').value.trim();
  if (!validate(form, 'customerName', name.length >= 2)) return;
  if (!validate(form, 'phone', okPhone(phone))) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Оформляем…';
  }

  try {
    const prod = CURRENT_PRODUCT
      ? `${CURRENT_PRODUCT.name}, ${CURRENT_PRODUCT.capacity} Ач`
      : '';
    const res = await sendOrder({
      customerName: name,
      phone,
      car: prod || '',
      comment: prod ? `Заказ: ${prod}` : '',
      productName: prod || null,
      total: CURRENT_PRODUCT ? CURRENT_PRODUCT.price : 0
    });

    closeModal();
    toast(DEMO_MODE ? 'Демо: заказ принят' : 'Заказ принят! Перезвоним в течение 5 минут');

    if (!DEMO_MODE && res.order && res.order.total > 0) {
      try {
        const pay = await api(`${API}/payments`, {
          method: 'POST',
          body: JSON.stringify({ orderId: res.order.id })
        });
        if (pay.payUrl) window.location.href = pay.payUrl;
      } catch (err) {
        toast('Заказ принят. Ссылку на оплату пришлём отдельно.');
      }
    }
  } catch (err) {
    toast(err.message || 'Ошибка отправки', true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Подтвердить заказ';
    }
  }
});

function validate(form, field, valid) {
  const input = form.querySelector(`[name="${field}"]`) || form.querySelector(`#${field}`);
  const msg = form.querySelector(`[data-for="${field}"]`);
  if (valid) {
    input.classList.remove('invalid');
    if (msg) msg.textContent = '';
  } else {
    input.classList.add('invalid');
    if (msg) msg.textContent = 'Поле заполнено неверно';
  }
  return valid;
}

function clearErrors(form) {
  form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  form.querySelectorAll('.err').forEach((el) => (el.textContent = ''));
}

/* ============================================================
   ИНТЕРФЕЙС
   ============================================================ */
/* прогресс чтения */
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
  $('#progress').style.width = pct + '%';
  $('#header').classList.toggle('scrolled', h.scrollTop > 10);
}, { passive: true });

/* бургер + мобильное меню (drawer) */
const burger = $('#burger');
const mobileMenu = $('#mobileMenu');

function setMobileMenu(open) {
  mobileMenu.classList.toggle('open', open);
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
  mobileMenu.setAttribute('aria-hidden', String(!open));
  document.body.style.overflow = open ? 'hidden' : '';
}

burger.addEventListener('click', () => setMobileMenu(!mobileMenu.classList.contains('open')));
mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMobileMenu(false)));
$$('#mobileMenu [data-mobile-close]').forEach((el) => el.addEventListener('click', () => setMobileMenu(false)));

/* закрытие модалки и меню */
$$('#orderModal [data-close]').forEach((el) => el.addEventListener('click', closeModal));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (mobileMenu.classList.contains('open')) setMobileMenu(false);
    closeModal();
  }
});

/* фильтры + поиск + сортировка */
['fBrand', 'fCapacity', 'fPolarity', 'fSort'].forEach((id) => $(`#${id}`).addEventListener('change', applyFilters));
$('#fPriceMin').addEventListener('input', applyFilters);
$('#fPriceMax').addEventListener('input', applyFilters);
$('#fSearch').addEventListener('input', applyFilters);
$('#resetFilters').addEventListener('click', resetFilters);

/* FAQ */
$$('.faq-q').forEach((q) => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    $$('.faq-item.open').forEach((i) => {
      i.classList.remove('open');
      i.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!wasOpen) {
      item.classList.add('open');
      item.querySelector('.faq-a').style.maxHeight = item.querySelector('.faq-a').scrollHeight + 'px';
    }
  });
});

/* магнитные кнопки отключены в серьёзной версии */

/* ============================================================
   БРЕНДЫ
   ============================================================ */
(function () {
  const m = $('#marquee');
  m.innerHTML = `<div class="marquee__track">${m.innerHTML}</div>`;
})();

/* ============================================================
   СЧЁТЧИКИ + ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ
   ============================================================ */
const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('in'); revealIO.unobserve(entry.target); }
  });
}, { threshold: 0.12 });

document.addEventListener('DOMContentLoaded', () => {
  $$('.reveal').forEach((el) => revealIO.observe(el));
});

const counterIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    counterIO.unobserve(entry.target);
    const el = entry.target.querySelector('b');
    const end = Number(entry.target.dataset.count);
    const suffix = entry.target.dataset.suffix || '';
    const t0 = performance.now();
    const dur = 1400;
    (function tick(t) {
      const k = Math.min((t - t0) / dur, 1);
      const v = Math.round(end * (1 - Math.pow(1 - k, 3)));
      el.textContent = v.toLocaleString('ru-RU') + suffix;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  });
}, { threshold: 0.6 });

$$('.stat').forEach((s) => counterIO.observe(s));

/* ============================================================
   СТАРТ
   ============================================================ */
// возврат с оплаты: показываем результат
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get('paid') === '1') toast('Оплата получена! Готовим заказ к выдаче');
  else if (params.get('cancel') === '1') toast('Оплата отменена. Можете оплатить позже или наличными при получении');
})();

loadCatalog();
