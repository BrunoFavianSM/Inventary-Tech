// scripts.js — CRUD de productos simple usando localStorage

const LS_KEY = 'inventary_products_v1'

// Selectores
const productsGrid = document.querySelector('.products__grid')
const productModal = document.getElementById('productModal')
const productForm = document.getElementById('productForm')
const modalTitle = document.getElementById('modalTitle')

// Estado local
let products = []
let editingId = null

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8)
}

function saveToStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(products))
}

function loadFromStorage() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.error('Error parsing products from storage', e)
    return null
  }
}

function seedIfEmpty() {
  const loaded = loadFromStorage()
  if (loaded && Array.isArray(loaded) && loaded.length) {
    products = loaded
    return
  }
  products = [
    { id: uid(), name: 'Laptop Dell Inspiron 15', sku: 'IT-004', price: 750, stock: 12, image: 'https://cdn.thewirecutter.com/wp-content/media/2024/11/cheapgaminglaptops-2048px-7981.jpg' },
    { id: uid(), name: 'Monitor Samsung 24"', sku: 'IT-005', price: 220, stock: 7, image: 'https://cdn.memorykings.pe/files/2024/02/10/349429-MK036274C.jpg' },
    { id: uid(), name: 'Teclado Mecánico Logitech', sku: 'IT-006', price: 95, stock: 15, image: 'https://oechsle.vteximg.com.br/arquivos/ids/16243426-1000-1000/image-a69ce9ae0b50449bac51e931b0c859ed.jpg?v=638305099450370000' },
    { id: uid(), name: 'Mouse Inalámbrico HP', sku: 'IT-007', price: 35, stock: 3, image: 'https://media.falabella.com/falabellaPE/125240618_01/w=1500,h=1500,fit=pad' },
    { id: uid(), name: 'Audífonos Bluetooth Sony', sku: 'IT-008', price: 60, stock: 18, image: 'https://oechsle.vteximg.com.br/arquivos/ids/19773632/imageUrl_1.jpg?v=638673304281300000' }
  ]
  saveToStorage()
}

function formatMoney(n){
  return new Intl.NumberFormat('es-ES',{style:'currency',currency:'USD'}).format(n)
}

function render() {
  productsGrid.innerHTML = ''
  if (!products.length) {
    productsGrid.innerHTML = '<p class="muted">No hay productos. Agrega uno nuevo.</p>'
    return
  }

  products.forEach(p => {
    const el = document.createElement('article')
    el.className = 'card'
    el.innerHTML = `
      <div class="card__media" style="background-image: url('${p.image || ''}'); background-color: ${p.image ? 'transparent' : '#f3f4f6'}"></div>
      <div class="card__body">
        <h4 class="card__title">${escapeHtml(p.name)}</h4>
        <p class="muted">SKU: ${escapeHtml(p.sku || '-')}</p>
        <div class="card__meta">
          <span class="price">${formatMoney(p.price)}</span>
          <span class="stock ${stockClass(p.stock)}">${p.stock} en stock</span>
        </div>
        <div class="card__actions">
          <button class="btn btn-sm" data-action="view" data-id="${p.id}">Ver</button>
          <button class="btn btn-outline btn-sm" data-action="edit" data-id="${p.id}">Editar</button>
          <button class="btn btn-outline btn-sm" data-action="delete" data-id="${p.id}">Borrar</button>
        </div>
      </div>
    `
    productsGrid.appendChild(el)
  })
}

function stockClass(n){
  if (n <= 0) return 'low'
  if (n <= 5) return 'warning'
  return 'in-stock'
}

function escapeHtml(s){
  if (!s) return ''
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c])
}

// Modal helpers
function openModal(editProduct){
  productModal.setAttribute('aria-hidden','false')
  if (editProduct) {
    modalTitle.textContent = 'Editar producto'
    productForm.id.value = editProduct.id
    productForm.name.value = editProduct.name
    productForm.sku.value = editProduct.sku
    productForm.price.value = editProduct.price
    productForm.stock.value = editProduct.stock
    productForm.image.value = editProduct.image
    editingId = editProduct.id
  } else {
    modalTitle.textContent = 'Nuevo producto'
    productForm.reset()
    productForm.id.value = ''
    editingId = null
  }
  // focus first input
  setTimeout(()=> productForm.name.focus(), 50)
}

function closeModal(){
  productModal.setAttribute('aria-hidden','true')
}

// Form submit
productForm.addEventListener('submit', function(e){
  e.preventDefault()
  const fd = new FormData(productForm)
  const data = {
    id: fd.get('id') || uid(),
    name: fd.get('name').trim(),
    sku: fd.get('sku').trim(),
    price: parseFloat(fd.get('price')) || 0,
    stock: parseInt(fd.get('stock')) || 0,
    image: fd.get('image').trim()
  }

  if (!data.name) return alert('El nombre es obligatorio')

  const exists = products.findIndex(x=>x.id === data.id)
  if (exists >= 0) {
    products[exists] = data
  } else {
    products.unshift(data)
  }
  saveToStorage()
  render()
  closeModal()
})

// Delegación de eventos en grid
productsGrid.addEventListener('click', function(e){
  const btn = e.target.closest('button')
  if (!btn) return
  const action = btn.dataset.action
  const id = btn.dataset.id
  const prod = products.find(p=>p.id===id)
  if (action === 'edit') {
    openModal(prod)
  } else if (action === 'delete') {
    if (!confirm('¿Borrar este producto?')) return
    products = products.filter(p=>p.id!==id)
    saveToStorage()
    render()
  } else if (action === 'view') {
    alert(`${prod.name}\n\nPrecio: ${formatMoney(prod.price)}\nStock: ${prod.stock}`)
  }
})

// Modal close clicks
productModal.addEventListener('click', function(e){
  const target = e.target
  if (target.matches('[data-close]') || target.classList.contains('modal__close')) closeModal()
})

// Add listener to products__controls for the "Nuevo" button
const controls = document.querySelector('.products__controls')
if (controls) {
  controls.addEventListener('click', function(e){
    const t = e.target.closest('button')
    if (!t) return
    if (t.dataset.action === 'new') {
      openModal(null)
    }
  })
}

// Polyfill for querySelector button by text (since :contains isn't supported)
// Add a global listener for the "Nuevo" button by checking data-action attribute isn't present

// Close modal with Escape
window.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal() })

// Init
seedIfEmpty()
render()

/* Note:
 - This is a lightweight implementation meant for demo/local use.
 - For production consider sanitizing/validating inputs, handling images properly and improving UX.
*/
