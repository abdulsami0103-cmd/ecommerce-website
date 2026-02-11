/* ========================================
   REDSTONE E-COMMERCE - ADMIN PANEL JS
======================================== */

// Admin State
const AdminStore = {
    products: [],
    orders: JSON.parse(localStorage.getItem('orders')) || [],
    users: JSON.parse(localStorage.getItem('users')) || [],
    admin: JSON.parse(localStorage.getItem('admin')) || null
};

// Initialize Admin
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    initAdmin();
});

// Load Products
async function loadProducts() {
    try {
        const response = await fetch('../data/products.json');
        const data = await response.json();
        AdminStore.products = data.products;

        // Merge with localStorage products
        const localProducts = JSON.parse(localStorage.getItem('adminProducts')) || [];
        localProducts.forEach(p => {
            if (!AdminStore.products.find(prod => prod.id === p.id)) {
                AdminStore.products.push(p);
            }
        });
    } catch (error) {
        console.error('Error loading products:', error);
        AdminStore.products = JSON.parse(localStorage.getItem('adminProducts')) || [];
    }
}

// Initialize Admin Components
function initAdmin() {
    initSidebar();
    updateStats();

    const page = document.body.dataset.page;
    switch(page) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'products':
            renderProducts();
            break;
        case 'orders':
            renderOrders();
            break;
        case 'customers':
            renderCustomers();
            break;
    }
}

// Sidebar Toggle
function initSidebar() {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.admin-sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Close sidebar on outside click (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
}

// Update Stats
function updateStats() {
    // Total Revenue
    const revenue = AdminStore.orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const revenueEl = document.getElementById('total-revenue');
    if (revenueEl) revenueEl.textContent = formatCurrency(revenue);

    // Total Orders
    const ordersEl = document.getElementById('total-orders');
    if (ordersEl) ordersEl.textContent = AdminStore.orders.length;

    // Total Products
    const productsEl = document.getElementById('total-products');
    if (productsEl) productsEl.textContent = AdminStore.products.length;

    // Total Customers
    const customersEl = document.getElementById('total-customers');
    if (customersEl) customersEl.textContent = AdminStore.users.length;
}

// Format Currency
function formatCurrency(amount) {
    return 'Rs.' + amount.toLocaleString();
}

// ========================================
// DASHBOARD
// ========================================
function renderDashboard() {
    renderRecentOrders();
    renderRecentActivity();
    renderTopProducts();
}

function renderRecentOrders() {
    const container = document.getElementById('recent-orders');
    if (!container) return;

    const recentOrders = AdminStore.orders.slice(-5).reverse();

    if (recentOrders.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 30px;">No orders yet</td></tr>';
        return;
    }

    container.innerHTML = recentOrders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.shipping?.name || order.user || 'Guest'}</td>
            <td>${formatCurrency(order.total)}</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${order.status || 'pending'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    const activities = [];

    // Add order activities
    AdminStore.orders.slice(-3).forEach(order => {
        activities.push({
            type: 'order',
            title: `New order #${order.id}`,
            description: `${order.items?.length || 0} items - ${formatCurrency(order.total)}`,
            time: new Date(order.createdAt).toLocaleDateString()
        });
    });

    // Add user activities
    AdminStore.users.slice(-2).forEach(user => {
        activities.push({
            type: 'user',
            title: 'New customer registered',
            description: user.email,
            time: 'Recently'
        });
    });

    container.innerHTML = activities.map(activity => `
        <li class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.type === 'order' ? 'shopping-cart' : 'user'}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <span class="activity-time">${activity.time}</span>
        </li>
    `).join('');
}

function renderTopProducts() {
    const container = document.getElementById('top-products');
    if (!container) return;

    const topProducts = AdminStore.products
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 5);

    container.innerHTML = topProducts.map(product => `
        <li class="activity-item">
            <img src="${product.images[0]}" alt="${product.name}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;">
            <div class="activity-content">
                <h4>${product.name}</h4>
                <p>${formatCurrency(product.price)}</p>
            </div>
            <span class="activity-time">${product.reviews} sales</span>
        </li>
    `).join('');
}

// ========================================
// PRODUCTS MANAGEMENT
// ========================================
function renderProducts() {
    const container = document.getElementById('products-table');
    if (!container) return;

    if (AdminStore.products.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 30px;">No products found</td></tr>';
        return;
    }

    container.innerHTML = AdminStore.products.map(product => `
        <tr>
            <td>
                <div class="product-cell">
                    <img src="${product.images[0]}" alt="${product.name}">
                    <div>
                        <h4>${product.name}</h4>
                        <p>${product.category}</p>
                    </div>
                </div>
            </td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>${product.type}</td>
            <td><span class="status-badge ${product.stock > 0 ? 'success' : 'danger'}">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="editProduct(${product.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn danger" onclick="deleteProduct(${product.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('modal-title');

    if (productId) {
        const product = AdminStore.products.find(p => p.id === productId);
        if (product) {
            title.textContent = 'Edit Product';
            form.elements['product-id'].value = product.id;
            form.elements['product-name'].value = product.name;
            form.elements['product-price'].value = product.price;
            form.elements['product-original-price'].value = product.originalPrice || '';
            form.elements['product-category'].value = product.category;
            form.elements['product-type'].value = product.type;
            form.elements['product-stock'].value = product.stock;
            form.elements['product-description'].value = product.description;
            form.elements['product-image'].value = product.images[0];
        }
    } else {
        title.textContent = 'Add New Product';
        form.reset();
        form.elements['product-id'].value = '';
    }

    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

function saveProduct(e) {
    e.preventDefault();
    const form = e.target;

    const productData = {
        id: form.elements['product-id'].value ? parseInt(form.elements['product-id'].value) : Date.now(),
        name: form.elements['product-name'].value,
        slug: form.elements['product-name'].value.toLowerCase().replace(/\s+/g, '-'),
        price: parseFloat(form.elements['product-price'].value),
        originalPrice: form.elements['product-original-price'].value ? parseFloat(form.elements['product-original-price'].value) : null,
        category: form.elements['product-category'].value,
        type: form.elements['product-type'].value,
        stock: parseInt(form.elements['product-stock'].value),
        description: form.elements['product-description'].value,
        images: [form.elements['product-image'].value || 'https://via.placeholder.com/500'],
        rating: 4.5,
        reviews: 0,
        isNew: true,
        isFeatured: false,
        tags: [],
        variants: {},
        features: []
    };

    const existingIndex = AdminStore.products.findIndex(p => p.id === productData.id);
    if (existingIndex !== -1) {
        AdminStore.products[existingIndex] = { ...AdminStore.products[existingIndex], ...productData };
        showToast('Product updated successfully!', 'success');
    } else {
        AdminStore.products.push(productData);
        showToast('Product added successfully!', 'success');
    }

    // Save to localStorage
    localStorage.setItem('adminProducts', JSON.stringify(AdminStore.products));

    closeProductModal();
    renderProducts();
    updateStats();
}

function editProduct(productId) {
    openProductModal(productId);
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        AdminStore.products = AdminStore.products.filter(p => p.id !== productId);
        localStorage.setItem('adminProducts', JSON.stringify(AdminStore.products));
        showToast('Product deleted successfully!', 'success');
        renderProducts();
        updateStats();
    }
}

// ========================================
// ORDERS MANAGEMENT
// ========================================
function renderOrders() {
    const container = document.getElementById('orders-table');
    if (!container) return;

    if (AdminStore.orders.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 30px;">No orders found</td></tr>';
        return;
    }

    container.innerHTML = AdminStore.orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>
                <div>
                    <h4 style="font-size: 0.95rem; margin-bottom: 3px;">${order.shipping?.name || 'Guest'}</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">${order.user || order.shipping?.email || 'N/A'}</p>
                </div>
            </td>
            <td>${order.items?.length || 0} items</td>
            <td>${formatCurrency(order.total)}</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${order.status || 'pending'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn" onclick="updateOrderStatus(${order.id})"><i class="fas fa-edit"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    switch(status) {
        case 'completed': return 'success';
        case 'processing': return 'info';
        case 'shipped': return 'info';
        case 'cancelled': return 'danger';
        default: return 'warning';
    }
}

function viewOrder(orderId) {
    const order = AdminStore.orders.find(o => o.id === orderId);
    if (!order) return;

    alert(`Order #${order.id}\n\nCustomer: ${order.shipping?.name || 'Guest'}\nEmail: ${order.user || order.shipping?.email}\nTotal: ${formatCurrency(order.total)}\nStatus: ${order.status || 'pending'}\nItems: ${order.items?.length || 0}`);
}

function updateOrderStatus(orderId) {
    const order = AdminStore.orders.find(o => o.id === orderId);
    if (!order) return;

    const newStatus = prompt('Enter new status (pending, processing, shipped, completed, cancelled):', order.status || 'pending');
    if (newStatus && ['pending', 'processing', 'shipped', 'completed', 'cancelled'].includes(newStatus)) {
        order.status = newStatus;
        localStorage.setItem('orders', JSON.stringify(AdminStore.orders));
        showToast('Order status updated!', 'success');
        renderOrders();
    }
}

// ========================================
// CUSTOMERS MANAGEMENT
// ========================================
function renderCustomers() {
    const container = document.getElementById('customers-table');
    if (!container) return;

    if (AdminStore.users.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 30px;">No customers found</td></tr>';
        return;
    }

    container.innerHTML = AdminStore.users.map((user, index) => {
        const userOrders = AdminStore.orders.filter(o => o.user === user.email);
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        return `
            <tr>
                <td>
                    <div class="product-cell">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-weight: 700;">
                            ${user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h4>${user.name || 'User'}</h4>
                            <p>${user.email}</p>
                        </div>
                    </div>
                </td>
                <td>${userOrders.length}</td>
                <td>${formatCurrency(totalSpent)}</td>
                <td><span class="status-badge success">Active</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" onclick="viewCustomer('${user.email}')"><i class="fas fa-eye"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewCustomer(email) {
    const user = AdminStore.users.find(u => u.email === email);
    if (!user) return;

    const userOrders = AdminStore.orders.filter(o => o.user === email);
    alert(`Customer: ${user.name}\nEmail: ${user.email}\nTotal Orders: ${userOrders.length}`);
}

// ========================================
// TOAST NOTIFICATION
// ========================================
function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="toast-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    toast.style.cssText = `
        background: var(--card-bg);
        border: 1px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'};
        border-radius: 12px;
        padding: 15px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        animation: slideIn 0.3s ease;
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(container);
    return container;
}

// ========================================
// ADMIN AUTH
// ========================================
function adminLogin(email, password) {
    // Demo admin credentials
    if (email === 'admin@redstone.com' && password === 'admin123') {
        AdminStore.admin = { email, name: 'Admin' };
        localStorage.setItem('admin', JSON.stringify(AdminStore.admin));
        return true;
    }
    return false;
}

function adminLogout() {
    AdminStore.admin = null;
    localStorage.removeItem('admin');
    window.location.href = 'login.html';
}

function isAdminLoggedIn() {
    return AdminStore.admin !== null;
}

// Export functions
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.viewCustomer = viewCustomer;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.showToast = showToast;
