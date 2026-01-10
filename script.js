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