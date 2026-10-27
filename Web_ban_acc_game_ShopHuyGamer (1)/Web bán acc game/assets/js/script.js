/* =========================
   ShopHuyGamer - script.js
   Xu ly loc, tim kiem, gio hang, giao dien va form demo
   ========================= */

const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const themeToggle = document.getElementById("themeToggle");
const cartButton = document.getElementById("cartButton");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const toast = document.getElementById("toast");

let selectedCategory = "all";
const CART_STORAGE_KEY = "shopHuyCart";
const CART_OPEN_KEY = "shopHuyOpenCart";
let cart = loadCart();
let toastTimer;

function loadCart() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.warn("Không thể đọc giỏ hàng từ localStorage.", error);
    return [];
  }
}

function persistCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Không thể lưu giỏ hàng vào localStorage.", error);
  }
}

window.addEventListener("storage", () => {
  cart = loadCart();
  renderCart();
});

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    body.classList.toggle("light-mode");
    const isLight = body.classList.contains("light-mode");
    themeToggle.textContent = isLight ? "☾" : "☼";
    themeToggle.setAttribute("aria-label", isLight ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng");
  });
}

const filterButtons = document.querySelectorAll(".filter-button");
const searchInput = document.getElementById("searchInput");
const productCards = document.querySelectorAll(".product-card");
const emptyState = document.getElementById("emptyState");

function filterProducts() {
  if (!searchInput || productCards.length === 0) return;

  const keyword = searchInput.value.trim().toLocaleLowerCase("vi");
  let visibleCount = 0;

  productCards.forEach(card => {
    const categoryMatches = selectedCategory === "all" || card.dataset.category === selectedCategory;
    const text = (card.dataset.name + " " + card.innerText).toLocaleLowerCase("vi");
    const keywordMatches = text.includes(keyword);
    const isVisible = categoryMatches && keywordMatches;

    card.classList.toggle("hidden", !isVisible);
    if (isVisible) visibleCount++;
  });

  if (emptyState) {
    emptyState.classList.toggle("hidden", visibleCount > 0);
  }
}

if (filterButtons.length) {
  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      filterButtons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      selectedCategory = button.dataset.filter;
      filterProducts();
    });
  });
}

if (searchInput) {
  searchInput.addEventListener("input", filterProducts);
}

const addButtons = document.querySelectorAll(".add-button");
addButtons.forEach(button => {
  button.addEventListener("click", () => {
    const id = button.dataset.id;
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id,
        title: button.dataset.title,
        price: Number(button.dataset.price),
        quantity: 1
      });
    }

    renderCart();
    showToast("Đã thêm sản phẩm vào giỏ hàng!");
  });
});

function renderCart() {
  if (!cartCount || !cartTotal || !cartItems) return;

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cartCount) cartCount.textContent = totalQuantity;
  if (cartTotal) cartTotal.textContent = formatMoney(totalPrice);

  persistCart();

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Giỏ hàng đang trống. Hãy chọn một sản phẩm nhé!</p>';
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-row">
      <div>
        <h3>${escapeHTML(item.title)}</h3>
        <small>${formatMoney(item.price)} / sản phẩm</small>
        <div class="quantity-controls">
          <button type="button" data-action="decrease" data-id="${item.id}" aria-label="Giảm số lượng">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="increase" data-id="${item.id}" aria-label="Tăng số lượng">+</button>
          <button type="button" class="remove-item" data-action="remove" data-id="${item.id}">Xóa</button>
        </div>
      </div>
      <div class="cart-row-price">${formatMoney(item.price * item.quantity)}</div>
    </div>
  `).join("");
}

function openCartIfRequested() {
  if (!cartModal || !cartButton || localStorage.getItem(CART_OPEN_KEY) !== "1") return;
  localStorage.removeItem(CART_OPEN_KEY);
  renderCart();
  openCart();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

if (cartItems) {
  cartItems.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const item = cart.find(product => product.id === button.dataset.id);
    if (!item) return;

    if (button.dataset.action === "increase") item.quantity++;
    if (button.dataset.action === "decrease") item.quantity--;
    if (button.dataset.action === "remove") item.quantity = 0;

    cart = cart.filter(product => product.quantity > 0);
    renderCart();
  });
}

function openCart() {
  if (!cartModal || !closeCart || !body) return;
  cartModal.classList.remove("hidden");
  body.style.overflow = "hidden";
  closeCart.focus();
}

function hideCart() {
  if (!cartModal || !body) return;
  cartModal.classList.add("hidden");
  body.style.overflow = "";
}

if (cartButton && cartModal) {
  cartButton.addEventListener("click", openCart);
}

if (closeCart && cartModal) {
  closeCart.addEventListener("click", hideCart);
  cartModal.addEventListener("click", event => {
    if (event.target === cartModal) hideCart();
  });
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && cartModal && !cartModal.classList.contains("hidden")) hideCart();
});

const checkoutButton = document.getElementById("checkoutButton");
if (checkoutButton) {
  checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("Giỏ hàng đang trống!");
      return;
    }

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderSummary = cart.map(item => `${item.title} x${item.quantity}`).join(", ");

    cart = [];
    renderCart();
    hideCart();

    const customerMessage = document.getElementById("customerMessage");
    if (customerMessage) {
      customerMessage.value = `Tôi đã thanh toán thành công cho đơn hàng: ${orderSummary}. Tổng giá trị: ${formatMoney(totalPrice)}. Vui lòng xác nhận đơn hàng đã được xử lý.`;
    }

    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }

    const customerName = document.getElementById("customerName");
    if (customerName) {
      customerName.focus({ preventScroll: true });
    }

    showToast("Thanh toán thành công! Giỏ hàng đã được xóa.");
  });
}

const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const contact = document.getElementById("customerContact").value.trim();
    const message = document.getElementById("customerMessage").value.trim();
    const formMessage = document.getElementById("formMessage");

    if (!name || !contact || !message) {
      if (formMessage) formMessage.textContent = "Vui lòng điền đầy đủ thông tin.";
      return;
    }

    if (formMessage) {
      formMessage.textContent = "Đã kiểm tra thông tin thành công. Đây là bản demo nên dữ liệu chưa được gửi đi.";
    }
    showToast("Biểu mẫu demo đã được kiểm tra!");
  });
}

const currentYear = document.getElementById("currentYear");
if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

function formatMoney(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function addProductToCart(button) {
  const productName = button.dataset.product || "Sản phẩm";
  const productPrice = Number(button.dataset.price || 0);

  if (!productPrice) {
    showToast("Sản phẩm chưa có giá để thêm vào giỏ hàng.");
    return;
  }

  const existingItem = cart.find(item => item.title === productName);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productName,
      title: productName,
      price: productPrice,
      quantity: 1
    });
  }

  persistCart();
  renderCart();

  if (cartModal && cartButton) {
    openCart();
    showToast("Đã thêm vào giỏ hàng!");
    return;
  }

  try {
    localStorage.setItem(CART_OPEN_KEY, "1");
  } catch (error) {
    console.warn("Không thể lưu trạng thái giỏ hàng mở.", error);
  }

  showToast("Đã thêm vào giỏ hàng! Chuyển sang trang chính...");
  const redirectPath = window.location.pathname.includes("/pages/") ? "../index.html" : "index.html";
  window.location.href = redirectPath;
}

function ensureServiceModal() {
  if (document.getElementById("serviceOrderModal")) return document.getElementById("serviceOrderModal");

  const modal = document.createElement("div");
  modal.id = "serviceOrderModal";
  modal.className = "modal-backdrop hidden";
  modal.innerHTML = `
    <div class="service-modal" role="dialog" aria-modal="true" aria-labelledby="serviceOrderTitle">
      <div class="modal-heading">
        <div>
          <div class="eyebrow">SERVICE REQUEST</div>
          <h2 id="serviceOrderTitle">Đặt dịch vụ</h2>
        </div>
        <button class="close-modal" type="button" data-close-service="true" aria-label="Đóng">×</button>
      </div>
      <form id="serviceForm" class="service-form">
        <div class="service-summary">
          <span id="serviceNameLabel">Dịch vụ</span>
          <strong id="servicePriceLabel">0đ</strong>
        </div>
        <label for="serviceUsername">Tài khoản</label>
        <input id="serviceUsername" name="username" type="text" placeholder="Nhập tài khoản game" required>
        <label for="servicePassword">Mật khẩu</label>
        <input id="servicePassword" name="password" type="password" placeholder="Nhập mật khẩu" required>
        <button class="button button-primary service-submit" type="submit">Xác nhận đặt dịch vụ</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeButton = modal.querySelector("[data-close-service]");
  closeButton.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.add("hidden");
  });

  const form = modal.querySelector("#serviceForm");
  form.addEventListener("submit", event => {
    event.preventDefault();
    const username = modal.querySelector("#serviceUsername").value.trim();
    const password = modal.querySelector("#servicePassword").value.trim();
    const serviceName = modal.dataset.serviceName || "Dịch vụ";

    if (!username || !password) {
      showToast("Vui lòng nhập tài khoản và mật khẩu.");
      return;
    }

    const customerMessage = document.getElementById("customerMessage");
    if (customerMessage) {
      customerMessage.value = `Mình muốn đặt dịch vụ: ${serviceName}. Tài khoản: ${username}. Mật khẩu: ${password}. Vui lòng xác nhận hướng dẫn xử lý.`;
    }

    const successMessage = document.createElement("p");
    successMessage.className = "service-success-message";
    successMessage.textContent = "Đã đặt dịch vụ thành công!";

    form.replaceChildren(successMessage);
    showToast("Đã đặt dịch vụ thành công!");

    setTimeout(() => {
      modal.classList.add("hidden");
      const contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 800);
  });

  return modal;
}

function openServiceModal(button) {
  const modal = ensureServiceModal();
  const serviceName = button.dataset.product || "Dịch vụ";
  const price = Number(button.dataset.price || 0);

  modal.dataset.serviceName = serviceName;
  modal.querySelector("#serviceNameLabel").textContent = serviceName;
  modal.querySelector("#servicePriceLabel").textContent = formatMoney(price);
  modal.querySelector("#serviceForm").reset();
  modal.classList.remove("hidden");
}

renderCart();
openCartIfRequested();

const detailBuyButtons = document.querySelectorAll(".detail-buy-button");
if (detailBuyButtons.length) {
  detailBuyButtons.forEach(button => {
    const isService = button.classList.contains("service-button") || button.dataset.type === "service";
    button.textContent = isService ? "Đặt dịch vụ" : "Thêm vào giỏ hàng";

    button.addEventListener("click", () => {
      if (isService) {
        openServiceModal(button);
        return;
      }

      addProductToCart(button);
    });
  });
}

const selectedProduct = (() => {
  try {
    return localStorage.getItem("shophuy_selected_product");
  } catch (error) {
    return null;
  }
})();

if (selectedProduct && document.getElementById("customerMessage")) {
  const messageInput = document.getElementById("customerMessage");
  const contactSection = document.getElementById("contact");
  messageInput.value = `Mình muốn tư vấn về ${selectedProduct}. Vui lòng hỗ trợ chi tiết và báo giá trước khi giao dịch.`;
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  try {
    localStorage.removeItem("shophuy_selected_product");
  } catch (error) {
    console.warn("Không thể xóa lựa chọn sản phẩm sau khi dùng.", error);
  }
}
