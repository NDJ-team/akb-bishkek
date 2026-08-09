/* ============================================================
   AKB Бишкек — логика админ-панели
   Работает с REST API через JWT-токен в localStorage.
   ============================================================ */

const API = '/api';
const TOKEN_KEY = 'akb_admin_token';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- helpers ---------- */
function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

const fmtPrice = (n) => new Intl.NumberFormat('ru-RU').format(n);
const fmtDate = (d) => {
  const date = new Date(d);
  return isNaN(date) ? '—' : date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
  });
};

async function api(url, options = {}) {
  const headers = options.headers || {};
  headers['Authorization'] = `Bearer ${getToken()}`;

  const res = await fetch(url, { ...options, headers });

  // токен недействителен — разлогиниваем
  if (res.status === 401) { showLogin(); throw new Error('Сессия истекла'); }

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
  el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- переключение экранов ---------- */
function showLogin() {
  clearToken();
  $('#loginScreen').classList.remove('hidden');
  $('#panel').classList.add('hidden');
}

function showPanel() {
  $('#loginScreen').classList.add('hidden');
  $('#panel').classList.remove('hidden');
  loadStats();
  loadOrders();
  loadProducts();
}

/* ============================================================
   АВТОРИЗАЦИЯ
   ============================================================ */
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const login = $('#lLogin').value.trim();
  const password = $('#lPassword').value;
  $('#loginError').textContent = '';

  if (!login || !password) {
    $('#loginError').textContent = 'Введите логин и пароль';
    return;
  }

  try {
    const data = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Ошибка входа');
      return d;
    });

    setToken(data.token);
    e.target.reset();
    showPanel();
    toast('Добро пожаловать!');
  } catch (err) {
    $('#loginError').textContent = err.message;
  }
});

$('#logoutBtn').addEventListener('click', () => {
  showLogin();
  toast('Вы вышли из системы');
});

/* ============================================================
   СТАТИСТИКА
   ============================================================ */
async function loadStats() {
  try {
    const s = await api(`${API}/stats`);
    $('#statProducts').textContent = s.productCount;
    $('#statOrders').textContent = s.orderCount;
    $('#statNew').textContent = s.newCount;
    $('#statDone').textContent = s.doneCount;
    $('#badgeOrders').textContent = s.newCount || '';
  } catch (err) {
    /* статистика не критична, заявки покажут ошибку */
  }
}

/* ============================================================
   ВКЛАДКИ
   ============================================================ */
$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.remove('active'));
    $$('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    $(`#panel-${tab.dataset.tab}`).classList.add('active');
  });
});

/* ============================================================
   ЗАЯВКИ
   ============================================================ */
async function loadOrders() {
  const statusFilter = $('#orderStatusFilter').value;
  try {
    const url = statusFilter
      ? `${API}/orders?status=${encodeURIComponent(statusFilter)}`
      : `${API}/orders`;
    const orders = await api(url);
    renderOrders(orders);
    $('#badgeOrders').textContent = orders.filter((o) => o.status === 'Новая').length || '';
  } catch (err) {
    $('#ordersBody').innerHTML =
      `<tr><td colspan="9" class="table-empty">${esc(err.message)}</td></tr>`;
  }
}

$('#orderStatusFilter').addEventListener('change', loadOrders);

function renderOrders(orders) {
  const body = $('#ordersBody');
  if (!orders.length) {
    body.innerHTML = '<tr><td colspan="9" class="table-empty">Заявок нет</td></tr>';
    return;
  }

  body.innerHTML = orders.map((o) => `
    <tr>
      <td>#${o.id}</td>
      <td><b>${esc(o.customerName)}</b></td>
      <td><a href="tel:${esc(o.phone)}" style="color:var(--yellow)">${esc(o.phone)}</a></td>
      <td><div class="order-comment">${esc(o.car || o.comment || '—')}</div></td>
      <td>${o.total ? `<b>${fmtPrice(o.total)} сом</b>` : '—'}</td>
      <td>${paymentCell(o)}</td>
      <td>${fmtDate(o.createdAt)}</td>
      <td>
        <span class="status status--${esc(o.status.replace(' ', ''))}">${esc(o.status)}</span>
      </td>
      <td>
        <div class="actions">
          <select class="status-select" data-status="${o.id}">
            ${['Новая', 'В работе', 'Выполнена'].map((s) =>
              `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn--danger btn--sm" data-del-order="${o.id}">Удалить</button>
        </div>
      </td>
    </tr>
  `).join('');

  $$('[data-status]').forEach((sel) => {
    sel.addEventListener('change', () => updateOrderStatus(Number(sel.dataset.status), sel.value));
  });
  $$('[data-del-order]').forEach((btn) => {
    btn.addEventListener('click', () => deleteOrder(Number(btn.dataset.delOrder)));
  });
  $$('[data-pay-order]').forEach((btn) => {
    btn.addEventListener('click', () => sendPaymentLink(Number(btn.dataset.payOrder)));
  });
}

function paymentCell(o) {
  if (!o.total || o.total <= 0) return '—';
  if (o.paymentStatus === 'paid') {
    return '<span class="status status--paid">Оплачен</span>';
  }
  const label = o.paymentStatus === 'pending' ? 'Ожидает' : 'Не оплачен';
  return `<span class="status status--pending">${label}</span>
    <button class="btn btn--ghost btn--sm" data-pay-order="${o.id}">Ссылка на оплату</button>`;
}

async function sendPaymentLink(id) {
  try {
    const data = await api(`${API}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id })
    });
    if (data.alreadyPaid) {
      toast('Заказ уже оплачен');
      loadOrders();
      return;
    }
    if (!data.payUrl) throw new Error('Ссылка на оплату недоступна');
    try {
      await navigator.clipboard.writeText(data.payUrl);
      toast('Ссылка на оплату скопирована');
    } catch (e) {
      window.prompt('Ссылка на оплату:', data.payUrl);
    }
  } catch (err) {
    toast(err.message, true);
  }
}

async function updateOrderStatus(id, status) {
  try {
    await api(`${API}/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    toast('Статус обновлён');
    loadOrders();
    loadStats();
  } catch (err) {
    toast(err.message, true);
    loadOrders();
  }
}

async function deleteOrder(id) {
  if (!confirm('Удалить заявку #' + id + '?')) return;
  try {
    await api(`${API}/orders/${id}`, { method: 'DELETE' });
    toast('Заявка удалена');
    loadOrders();
    loadStats();
  } catch (err) {
    toast(err.message, true);
  }
}

/* ============================================================
   ТОВАРЫ
   ============================================================ */
async function loadProducts() {
  try {
    const products = await api(`${API}/products`);
    renderProducts(products);
    $('#badgeProducts').textContent = products.length || '';
  } catch (err) {
    $('#productsBody').innerHTML =
      `<tr><td colspan="9" class="table-empty">${esc(err.message)}</td></tr>`;
  }
}

function renderProducts(products) {
  const body = $('#productsBody');
  if (!products.length) {
    body.innerHTML = '<tr><td colspan="9" class="table-empty">Товаров нет. Добавьте первый.</td></tr>';
    return;
  }

  body.innerHTML = products.map((p) => `
    <tr>
      <td>#${p.id}</td>
      <td><img src="${esc(p.image || '/images/battery-generic.svg')}" alt="" loading="lazy"
        onerror="this.src='/images/battery-generic.svg'"></td>
      <td><b>${esc(p.name)}</b></td>
      <td>${esc(p.brand)}</td>
      <td>${p.capacity} Ач</td>
      <td>${p.current} А</td>
      <td>${esc(p.polarity)}</td>
      <td><b style="color:var(--yellow)">${fmtPrice(p.price)} сом</b></td>
      <td>
        <div class="actions">
          <button class="btn btn--ghost btn--sm" data-edit-product="${p.id}">Изменить</button>
          <button class="btn btn--danger btn--sm" data-del-product="${p.id}">Удалить</button>
        </div>
      </td>
    </tr>
  `).join('');

  $$('[data-edit-product]').forEach((btn) => {
    btn.addEventListener('click', () => openProductModal(Number(btn.dataset.editProduct)));
  });
  $$('[data-del-product]').forEach((btn) => {
    btn.addEventListener('click', () => deleteProduct(Number(btn.dataset.delProduct)));
  });
}

/* ---------- модалка товара ---------- */
let editingProductId = null;

$('#addProductBtn').addEventListener('click', () => openProductModal(null));

function openProductModal(productId) {
  editingProductId = productId;
  $('#productError').textContent = '';
  $('#productForm').reset();
  $('#pImagePreview').src = '/images/battery-generic.svg';

  if (productId) {
    $('#productModalTitle').textContent = 'Редактировать товар';
    fetch(`${API}/products/${productId}`)
      .then((r) => r.json())
      .then((p) => {
        $('#pName').value = p.name;
        $('#pBrand').value = p.brand;
        $('#pCapacity').value = p.capacity;
        $('#pCurrent').value = p.current;
        $('#pPrice').value = p.price;
        $('#pPolarity').value = p.polarity;
        $('#pDescription').value = p.description || '';
        $('#pImagePreview').src = p.image || '/images/battery-generic.svg';
      })
      .catch(() => toast('Не удалось загрузить товар', true));
  } else {
    $('#productModalTitle').textContent = 'Добавить товар';
  }

  $('#productModal').classList.add('open');
  $('#productModal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  $('#productModal').classList.remove('open');
  $('#productModal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  editingProductId = null;
}

// предпросмотр фото
$('#pImage').addEventListener('change', () => {
  const file = $('#pImage').files[0];
  if (file) $('#pImagePreview').src = URL.createObjectURL(file);
});

$('#productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#productError').textContent = '';

  const name = $('#pName').value.trim();
  const brand = $('#pBrand').value.trim();
  const capacity = Number($('#pCapacity').value);
  const current = Number($('#pCurrent').value);
  const price = Number($('#pPrice').value);

  // простая валидация перед отправкой
  if (name.length < 2) return failProduct('Название — минимум 2 символа');
  if (!brand) return failProduct('Укажите бренд');
  if (!capacity || capacity < 10 || capacity > 300) return failProduct('Ёмкость от 10 до 300 Ач');
  if (!current || current < 100 || current > 1500) return failProduct('Пусковой ток от 100 до 1500 А');
  if (!price || price < 1) return failProduct('Укажите цену');

  const formData = new FormData();
  formData.append('name', name);
  formData.append('brand', brand);
  formData.append('capacity', capacity);
  formData.append('current', current);
  formData.append('price', price);
  formData.append('polarity', $('#pPolarity').value);
  formData.append('description', $('#pDescription').value.trim());
  if ($('#pImage').files[0]) formData.append('image', $('#pImage').files[0]);

  const method = editingProductId ? 'PUT' : 'POST';
  const url = editingProductId
    ? `${API}/products/${editingProductId}`
    : `${API}/products`;

  try {
    await api(url, { method, body: formData });
    toast(editingProductId ? 'Товар обновлён' : 'Товар добавлен');
    closeProductModal();
    loadProducts();
    loadStats();
  } catch (err) {
    $('#productError').textContent = err.message;
  }
});

function failProduct(msg) {
  $('#productError').textContent = msg;
  return false;
}

async function deleteProduct(id) {
  if (!confirm('Удалить товар #' + id + '?')) return;
  try {
    await api(`${API}/products/${id}`, { method: 'DELETE' });
    toast('Товар удалён');
    loadProducts();
    loadStats();
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------- закрытие модалки ---------- */
$$('#productModal [data-close]').forEach((el) => el.addEventListener('click', closeProductModal));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProductModal();
});

/* ============================================================
   СТАРТ
   ============================================================ */
// если токен есть — сразу в панель, иначе на экран входа
if (getToken()) {
  api(`${API}/stats`).then(showPanel).catch(() => showLogin());
} else {
  showLogin();
}
