const API_URL = "https://dummyjson.com/products";
const productTableBody = document.getElementById('product-table-body');
const loadingSpinner = document.getElementById('loading-spinner');
const productForm = document.getElementById('productForm');

let currentProducts = []; 
let isAscending = true;
let searchTimer;

// 1. INITIAL LOAD: Logic to check local storage first
async function init() {
    const saved = localStorage.getItem('shopManage_data');
    if (saved) {
        currentProducts = JSON.parse(saved);
        renderTable(currentProducts);
    } else {
        await fetchInitialData();
    }
}

async function fetchInitialData() {
    try {
        loadingSpinner.style.display = 'block'; 
        const response = await fetch(`${API_URL}?limit=10`); 
        if (!response.ok) throw new Error("Fetch failed");
        const data = await response.json();
        saveAndRender(data.products); 
    } catch (e) { 
        console.error("Initial load failed", e); 
    } finally { 
        loadingSpinner.style.display = 'none'; 
    }
}

// 2. UI RENDERER
function renderTable(products) {
    document.getElementById('productCount').innerText = `Items: ${products.length}`;
    productTableBody.innerHTML = products.map(p => `
        <tr id="product-${p.id}">
            <td><img src="${p.thumbnail || 'https://via.placeholder.com/50'}" class="product-img-td"></td>
            <td class="fw-bold">${p.title}</td>
            <td><span class="badge bg-light text-dark border">${p.category}</span></td>
            <td class="text-success fw-bold">$${p.price}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary border-0" onclick="editProduct(${p.id})"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteProduct(${p.id})"><i class="bi bi-trash3"></i></button>
            </td>
        </tr>
    `).join('');
}

// 9. HELPERS
function saveAndRender(data) {
    localStorage.setItem('shopManage_data', JSON.stringify(data));
    renderTable(data);
}

function clearAllData() { 
    localStorage.removeItem('shopManage_data'); 
    location.reload(); 
}

// 3. IMAGE PREVIEW
function updatePreview(url) {
    const img = document.getElementById('imagePreview');
    const text = document.getElementById('previewText');
    if (url && url.trim() !== "") {
        img.src = url;
        img.style.display = "block";
        text.style.display = "none";
    } else {
        img.style.display = "none";
        text.style.display = "block";
    }
}

// 4. CREATE & UPDATE
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const isEdit = id !== "";

    const payload = {
        title: document.getElementById('productTitle').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        thumbnail: document.getElementById('productImage').value
    };

    try {
        const url = isEdit ? `${API_URL}/${id}` : `${API_URL}/add`;
        const res = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (isEdit) {
            currentProducts = currentProducts.map(p => p.id == id ? { ...p, ...payload } : p);
        } else {
            result.id = Date.now(); 
            currentProducts.unshift({...result, ...payload});
        }

        saveAndRender(currentProducts);
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        alert(`Product ${isEdit ? 'Updated' : 'Added'} Successfully!`);
    } catch (e) { alert("Operation failed"); }
});

// 6. DELETE
async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.status === 200) {
            currentProducts = currentProducts.filter(p => p.id != id);
            saveAndRender(currentProducts);
            alert("Deleted Successfully");
        }
    } catch (e) { console.error(e); }
}

// 7. EDIT PRE-FILL
function editProduct(id) {
    const p = currentProducts.find(item => item.id == id);
    if (!p) return;
    document.getElementById('productId').value = p.id;
    document.getElementById('productTitle').value = p.title;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productImage').value = p.thumbnail || "";
    updatePreview(p.thumbnail || "");
    document.getElementById('modalTitle').innerText = "Edit Product Details";
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

// 5. SEARCH & FILTER
function handleSearch(query) {
    clearTimeout(searchTimer);
    if (!query.trim()) { init(); return; }
    searchTimer = setTimeout(() => {
        fetch(`${API_URL}/search?q=${query}`).then(res => res.json()).then(data => renderTable(data.products));
    }, 500);
}

function changeCategory(cat) {
    if (cat === 'all') { init(); return; }
    fetch(`${API_URL}/category/${cat}`).then(res => res.json()).then(data => renderTable(data.products));
}

// 8. PRICE SORTING
function toggleSort() {
    currentProducts.sort((a, b) => isAscending ? a.price - b.price : b.price - a.price);
    isAscending = !isAscending;
    document.getElementById('sortIcon').className = isAscending ? "bi bi-sort-numeric-down" : "bi bi-sort-numeric-up-alt";
    renderTable(currentProducts);
}

function resetForm() {
    productForm.reset();
    document.getElementById('productId').value = "";
    document.getElementById('modalTitle').innerText = "Add New Product";
    updatePreview("");
}

// Run the application
init();