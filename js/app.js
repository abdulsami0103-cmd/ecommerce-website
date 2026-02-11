/* ========================================
   REDSTONE E-COMMERCE - MAIN APP JS
======================================== */

// Global State
const Store = {
    products: [],
    categories: [],
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('wishlist')) || [],
    user: JSON.parse(localStorage.getItem('user')) || null,
    currency: localStorage.getItem('currency') || 'PKR',
    currencies: {
        PKR: { symbol: 'Rs.', rate: 1 },
        USD: { symbol: '$', rate: 0.0036 },
        EUR: { symbol: '€', rate: 0.0033 },
        GBP: { symbol: '£', rate: 0.0028 }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    initializeApp();
});

// Load Products from JSON
async function loadProducts() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        Store.products = data.products;
        Store.categories = data.categories;
        if (data.currencies) {
            Store.currencies = data.currencies;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        // Use fallback data
        Store.products = [];
        Store.categories = [];
    }
}

// Initialize App Components
function initializeApp() {
    updateCartCount();
    updateWishlistCount();
    initMobileMenu();
    initCurrencySwitcher();
    initSearch();

    // Page specific initializations
    const page = document.body.dataset.page;
    switch(page) {
        case 'home':
            renderFeaturedProducts();
            renderCategories();
            break;
        case 'products':
            initProductsPage();
            break;
        case 'product':
            initProductDetailPage();
            break;
        case 'cart':
            renderCart();
            break;
        case 'wishlist':
            renderWishlist();
            break;
        case 'checkout':
            initCheckout();
            break;
    }
}

// ========================================
// CURRENCY FUNCTIONS
// ========================================
function formatPrice(price) {
    const currency = Store.currencies[Store.currency];
    const converted = price * currency.rate;
    return `${currency.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function initCurrencySwitcher() {
    const switcher = document.querySelector('.currency-switcher');
    if (!switcher) return;

    const btn = switcher.querySelector('.currency-btn');
    const dropdown = switcher.querySelector('.currency-dropdown');

    btn.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!switcher.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    dropdown.querySelectorAll('.currency-option').forEach(option => {
        option.addEventListener('click', () => {
            const currency = option.dataset.currency;
            Store.currency = currency;
            localStorage.setItem('currency', currency);
            btn.querySelector('span').textContent = currency;
            dropdown.classList.remove('active');

            // Update all prices on page
            document.querySelectorAll('[data-price]').forEach(el => {
                const price = parseFloat(el.dataset.price);
                el.textContent = formatPrice(price);
            });

            // Re-render price dependent components
            if (document.body.dataset.page === 'cart') renderCart();
        });
    });
}

// ========================================
// MOBILE MENU
// ========================================
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');

    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuBtn.querySelector('i').classList.toggle('fa-bars');
            menuBtn.querySelector('i').classList.toggle('fa-times');
        });
    }
}

// ========================================
// SEARCH
// ========================================
function initSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                searchProducts(query);
            }
        }, 300);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                window.location.href = `products.html?search=${encodeURIComponent(query)}`;
            }
        }
    });
}

function searchProducts(query) {
    const results = Store.products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    // Could show search suggestions dropdown here
    console.log('Search results:', results);
}

// ========================================
// CART FUNCTIONS
// ========================================
function addToCart(productId, quantity = 1, variant = {}) {
    const product = Store.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = Store.cart.find(item =>
        item.productId === productId &&
        JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        Store.cart.push({
            productId,
            quantity,
            variant,
            addedAt: new Date().toISOString()
        });
    }

    saveCart();
    updateCartCount();
    showToast('Product added to cart!', 'success');
}

function removeFromCart(index) {
    Store.cart.splice(index, 1);
    saveCart();
    updateCartCount();
    renderCart();
    showToast('Product removed from cart', 'success');
}

function updateCartQuantity(index, quantity) {
    if (quantity <= 0) {
        removeFromCart(index);
        return;
    }
    Store.cart[index].quantity = quantity;
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(Store.cart));
}

function updateCartCount() {
    const count = Store.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

function getCartTotal() {
    return Store.cart.reduce((sum, item) => {
        const product = Store.products.find(p => p.id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const summaryContainer = document.getElementById('cart-summary');
    const emptyCart = document.getElementById('empty-cart');

    if (!cartContainer) return;

    if (Store.cart.length === 0) {
        cartContainer.innerHTML = '';
        if (emptyCart) emptyCart.style.display = 'block';
        if (summaryContainer) summaryContainer.style.display = 'none';
        return;
    }

    if (emptyCart) emptyCart.style.display = 'none';
    if (summaryContainer) summaryContainer.style.display = 'block';

    cartContainer.innerHTML = Store.cart.map((item, index) => {
        const product = Store.products.find(p => p.id === item.productId);
        if (!product) return '';

        const variantText = Object.entries(item.variant)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        return `
            <div class="cart-item animate-fade-in">
                <div class="cart-item-image">
                    <img src="${product.images[0]}" alt="${product.name}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${product.name}</h4>
                    ${variantText ? `<p class="cart-item-variant">${variantText}</p>` : ''}
                    <p class="cart-item-price" data-price="${product.price}">${formatPrice(product.price)}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateCartQuantity(${index}, ${item.quantity - 1})">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartQuantity(${index}, ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Update summary
    const subtotal = getCartTotal();
    const shipping = subtotal > 5000 ? 0 : 250;
    const total = subtotal + shipping;

    document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
    document.getElementById('cart-total').textContent = formatPrice(total);
}

// ========================================
// WISHLIST FUNCTIONS
// ========================================
function toggleWishlist(productId) {
    const index = Store.wishlist.indexOf(productId);
    if (index === -1) {
        Store.wishlist.push(productId);
        showToast('Added to wishlist!', 'success');
    } else {
        Store.wishlist.splice(index, 1);
        showToast('Removed from wishlist', 'success');
    }
    localStorage.setItem('wishlist', JSON.stringify(Store.wishlist));
    updateWishlistCount();
    updateWishlistButtons();

    if (document.body.dataset.page === 'wishlist') {
        renderWishlist();
    }
}

function isInWishlist(productId) {
    return Store.wishlist.includes(productId);
}

function updateWishlistCount() {
    document.querySelectorAll('.wishlist-count').forEach(el => {
        el.textContent = Store.wishlist.length;
        el.style.display = Store.wishlist.length > 0 ? 'flex' : 'none';
    });
}

function updateWishlistButtons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const productId = parseInt(btn.dataset.productId);
        if (isInWishlist(productId)) {
            btn.classList.add('active');
            btn.querySelector('i').classList.remove('far');
            btn.querySelector('i').classList.add('fas');
        } else {
            btn.classList.remove('active');
            btn.querySelector('i').classList.remove('fas');
            btn.querySelector('i').classList.add('far');
        }
    });
}

function renderWishlist() {
    const container = document.getElementById('wishlist-items');
    const emptyWishlist = document.getElementById('empty-wishlist');

    if (!container) return;

    if (Store.wishlist.length === 0) {
        container.innerHTML = '';
        if (emptyWishlist) emptyWishlist.style.display = 'block';
        return;
    }

    if (emptyWishlist) emptyWishlist.style.display = 'none';

    const products = Store.products.filter(p => Store.wishlist.includes(p.id));
    container.innerHTML = products.map(product => createProductCard(product)).join('');
    updateWishlistButtons();
}

// ========================================
// PRODUCT RENDERING
// ========================================
function createProductCard(product) {
    const discount = product.originalPrice
        ? Math.round((1 - product.price / product.originalPrice) * 100)
        : 0;

    const stars = Array(5).fill(0).map((_, i) =>
        i < Math.floor(product.rating)
            ? '<i class="fas fa-star"></i>'
            : '<i class="fas fa-star empty"></i>'
    ).join('');

    return `
        <div class="card product-card animate-fade-in">
            <div class="product-image">
                <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                <div class="product-badges">
                    ${discount > 0 ? `<span class="badge badge-sale">-${discount}%</span>` : ''}
                    ${product.isNew ? '<span class="badge badge-new">New</span>' : ''}
                    ${product.type === 'digital' ? '<span class="badge badge-digital">Digital</span>' : ''}
                </div>
                <div class="product-actions">
                    <button class="product-action-btn wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}"
                            data-product-id="${product.id}"
                            onclick="toggleWishlist(${product.id})">
                        <i class="${isInWishlist(product.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <button class="product-action-btn" onclick="quickView(${product.id})">
                        <i class="far fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <h3 class="product-title">
                    <a href="product.html?id=${product.id}">${product.name}</a>
                </h3>
                <div class="product-rating">
                    <div class="stars">${stars}</div>
                    <span class="rating-count">(${product.reviews})</span>
                </div>
                <div class="product-price">
                    <span class="current-price" data-price="${product.price}">${formatPrice(product.price)}</span>
                    ${product.originalPrice ? `<span class="original-price" data-price="${product.originalPrice}">${formatPrice(product.originalPrice)}</span>` : ''}
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
}

function renderFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;

    const featured = Store.products.filter(p => p.isFeatured).slice(0, 8);
    container.innerHTML = featured.map(product => createProductCard(product)).join('');
}

function renderCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    container.innerHTML = Store.categories.map(category => `
        <a href="products.html?category=${category.slug}" class="card category-card">
            <div class="category-icon">
                <i class="${category.icon}"></i>
            </div>
            <h3 class="category-name">${category.name}</h3>
            <p class="category-count">${category.count} Products</p>
        </a>
    `).join('');
}

// ========================================
// PRODUCTS PAGE
// ========================================
function initProductsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const search = urlParams.get('search');

    let products = [...Store.products];

    // Apply filters from URL
    if (category) {
        products = products.filter(p => p.category === category);
        document.getElementById('page-title').textContent = category.charAt(0).toUpperCase() + category.slice(1);
    }

    if (search) {
        products = products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
        );
        document.getElementById('page-title').textContent = `Search: "${search}"`;
    }

    renderProductsGrid(products);
    initFilters(products);
}

function renderProductsGrid(products) {
    const container = document.getElementById('products-grid');
    if (!container) return;

    document.getElementById('products-count').textContent = `${products.length} Products`;

    if (products.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No products found.</p>';
        return;
    }

    container.innerHTML = products.map(product => createProductCard(product)).join('');
    updateWishlistButtons();
}

function initFilters(allProducts) {
    // Price filter
    const applyPriceFilter = document.getElementById('apply-price-filter');
    if (applyPriceFilter) {
        applyPriceFilter.addEventListener('click', () => {
            const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
            const maxPrice = parseFloat(document.getElementById('max-price').value) || Infinity;

            const filtered = allProducts.filter(p => p.price >= minPrice && p.price <= maxPrice);
            renderProductsGrid(filtered);
        });
    }

    // Category checkboxes
    document.querySelectorAll('.filter-option input[name="category"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const selected = Array.from(document.querySelectorAll('.filter-option input[name="category"]:checked'))
                .map(cb => cb.value);

            const filtered = selected.length > 0
                ? allProducts.filter(p => selected.includes(p.category))
                : allProducts;

            renderProductsGrid(filtered);
        });
    });

    // Sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            let sorted = [...allProducts];
            switch(e.target.value) {
                case 'price-low':
                    sorted.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    sorted.sort((a, b) => b.price - a.price);
                    break;
                case 'rating':
                    sorted.sort((a, b) => b.rating - a.rating);
                    break;
                case 'newest':
                    sorted.sort((a, b) => b.isNew - a.isNew);
                    break;
            }
            renderProductsGrid(sorted);
        });
    }
}

// ========================================
// PRODUCT DETAIL PAGE
// ========================================
function initProductDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    const product = Store.products.find(p => p.id === productId);
    if (!product) {
        document.body.innerHTML = '<h1 class="text-center mt-4">Product not found</h1>';
        return;
    }

    renderProductDetail(product);
}

function renderProductDetail(product) {
    // Update page title
    document.title = `${product.name} - Redstone Store`;

    // Main image
    document.getElementById('main-image').src = product.images[0];

    // Thumbnails
    const thumbnailsContainer = document.getElementById('thumbnails');
    if (thumbnailsContainer && product.images.length > 1) {
        thumbnailsContainer.innerHTML = product.images.map((img, i) => `
            <img src="${img}" alt="Thumbnail ${i + 1}"
                 class="${i === 0 ? 'active' : ''}"
                 onclick="changeMainImage('${img}', this)">
        `).join('');
    }

    // Product info
    document.getElementById('product-title').textContent = product.name;
    document.getElementById('product-category').textContent = product.category;
    document.getElementById('product-description').textContent = product.description;

    // Price
    document.getElementById('product-price').innerHTML = `
        <span class="current-price" data-price="${product.price}">${formatPrice(product.price)}</span>
        ${product.originalPrice ? `<span class="original-price" data-price="${product.originalPrice}">${formatPrice(product.originalPrice)}</span>` : ''}
    `;

    // Rating
    const stars = Array(5).fill(0).map((_, i) =>
        i < Math.floor(product.rating)
            ? '<i class="fas fa-star"></i>'
            : '<i class="fas fa-star empty"></i>'
    ).join('');
    document.getElementById('product-rating').innerHTML = `
        <div class="stars">${stars}</div>
        <span class="rating-count">${product.rating} (${product.reviews} reviews)</span>
    `;

    // Stock
    const stockElement = document.getElementById('product-stock');
    if (product.type === 'digital') {
        stockElement.innerHTML = '<span class="text-success"><i class="fas fa-download"></i> Instant Download</span>';
    } else if (product.stock > 0) {
        stockElement.innerHTML = `<span class="text-success"><i class="fas fa-check"></i> In Stock (${product.stock} available)</span>`;
    } else {
        stockElement.innerHTML = '<span class="text-danger"><i class="fas fa-times"></i> Out of Stock</span>';
    }

    // Variants
    const variantsContainer = document.getElementById('product-variants');
    if (variantsContainer && product.variants) {
        let variantsHTML = '';

        if (product.variants.colors) {
            variantsHTML += `
                <div class="variant-group">
                    <label>Color:</label>
                    <div class="variant-options">
                        ${product.variants.colors.map((color, i) => `
                            <button class="variant-btn ${i === 0 ? 'active' : ''}"
                                    data-variant="color" data-value="${color}"
                                    onclick="selectVariant(this)">${color}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (product.variants.sizes) {
            variantsHTML += `
                <div class="variant-group">
                    <label>Size:</label>
                    <div class="variant-options">
                        ${product.variants.sizes.map((size, i) => `
                            <button class="variant-btn ${i === 0 ? 'active' : ''}"
                                    data-variant="size" data-value="${size}"
                                    onclick="selectVariant(this)">${size}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        variantsContainer.innerHTML = variantsHTML;
    }

    // Features
    const featuresContainer = document.getElementById('product-features');
    if (featuresContainer && product.features) {
        featuresContainer.innerHTML = product.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('');
    }

    // Add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('quantity-input').value) || 1;
            const variant = getSelectedVariants();
            addToCart(product.id, quantity, variant);
        };
    }

    // Wishlist button
    const wishlistBtn = document.getElementById('wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.dataset.productId = product.id;
        if (isInWishlist(product.id)) {
            wishlistBtn.classList.add('active');
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
        }
        wishlistBtn.onclick = () => toggleWishlist(product.id);
    }
}

function changeMainImage(src, thumbnail) {
    document.getElementById('main-image').src = src;
    document.querySelectorAll('#thumbnails img').forEach(img => img.classList.remove('active'));
    thumbnail.classList.add('active');
}

function selectVariant(btn) {
    const group = btn.closest('.variant-options');
    group.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function getSelectedVariants() {
    const variants = {};
    document.querySelectorAll('.variant-btn.active').forEach(btn => {
        variants[btn.dataset.variant] = btn.dataset.value;
    });
    return variants;
}

function updateQuantity(change) {
    const input = document.getElementById('quantity-input');
    const newValue = Math.max(1, parseInt(input.value) + change);
    input.value = newValue;
}

function quickView(productId) {
    // Could implement a modal quick view
    window.location.href = `product.html?id=${productId}`;
}

// ========================================
// CHECKOUT
// ========================================
function initCheckout() {
    renderCheckoutSummary();

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
}

function renderCheckoutSummary() {
    const container = document.getElementById('checkout-items');
    if (!container) return;

    container.innerHTML = Store.cart.map(item => {
        const product = Store.products.find(p => p.id === item.productId);
        if (!product) return '';

        return `
            <div class="checkout-item">
                <img src="${product.images[0]}" alt="${product.name}">
                <div>
                    <h4>${product.name}</h4>
                    <p>Qty: ${item.quantity}</p>
                </div>
                <span data-price="${product.price * item.quantity}">${formatPrice(product.price * item.quantity)}</span>
            </div>
        `;
    }).join('');

    const subtotal = getCartTotal();
    const shipping = subtotal > 5000 ? 0 : 250;
    const total = subtotal + shipping;

    document.getElementById('checkout-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
    document.getElementById('checkout-total').textContent = formatPrice(total);
}

function handleCheckout(e) {
    e.preventDefault();

    if (!Store.user) {
        showToast('Please login to continue', 'warning');
        window.location.href = 'login.html?redirect=checkout';
        return;
    }

    // Collect form data
    const formData = new FormData(e.target);
    const orderData = {
        id: Date.now(),
        user: Store.user.email,
        items: Store.cart,
        shipping: Object.fromEntries(formData),
        total: getCartTotal(),
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart
    Store.cart = [];
    saveCart();
    updateCartCount();

    // Redirect to success page
    showToast('Order placed successfully!', 'success');
    setTimeout(() => {
        window.location.href = `order-success.html?id=${orderData.id}`;
    }, 1500);
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================
function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="toast-icon fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
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
    document.body.appendChild(container);
    return container;
}

// ========================================
// AUTHENTICATION
// ========================================
function login(email, password) {
    // Simple demo login
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        Store.user = { email: user.email, name: user.name };
        localStorage.setItem('user', JSON.stringify(Store.user));
        return true;
    }
    return false;
}

function register(name, email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email already exists' };
    }

    users.push({ name, email, password });
    localStorage.setItem('users', JSON.stringify(users));

    // Auto login after register
    Store.user = { email, name };
    localStorage.setItem('user', JSON.stringify(Store.user));

    return { success: true };
}

function logout() {
    Store.user = null;
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function isLoggedIn() {
    return Store.user !== null;
}

// Export for use in other scripts
window.Store = Store;
window.formatPrice = formatPrice;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.toggleWishlist = toggleWishlist;
window.showToast = showToast;
window.login = login;
window.register = register;
window.logout = logout;
window.changeMainImage = changeMainImage;
window.selectVariant = selectVariant;
window.updateQuantity = updateQuantity;
window.quickView = quickView;
