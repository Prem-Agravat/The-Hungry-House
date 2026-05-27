// ==================== GLOBAL VARIABLES ====================
let database = {
  users: [],
  foodItems: [],
  offers: [],
  tables: [],
  orders: [],
};

let appState = {
  isLoggedIn: false,
  isAdmin: false,
  currentUser: null,
  cart: [],
  currentSection: "home",
  currentCategory: "all",
  isSearching: false,
  searchTerm: "",
  orderType: null,
  dineInDetails: null,
  appliedOffer: null,
  discountAmount: 0,
  discountPercent: 0,
};
let forgotPasswordState = {
  email: "",
};
let resendOtpTimer = null;
let profileOrdersRefreshTimer = null;
let menuRatingRefreshTimer = null;
let profileOrdersCache = [];
const autoOpenedRatingOrders = new Set();

function setLoadingState(buttonSelector, isLoading, loadingText = 'Loading...') {
  const btn = $(buttonSelector);
  if (!btn.length) return;
  if (isLoading) {
    if (!btn.data('original-text')) {
      btn.data('original-text', btn.html());
    }
    btn.prop('disabled', true).addClass('disabled');
    btn.html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${loadingText}`);
  } else {
    btn.prop('disabled', false).removeClass('disabled');
    if (btn.data('original-text')) {
      btn.html(btn.data('original-text'));
    }
  }
}


// ==================== UTILITY FUNCTIONS ====================
function saveToLocalStorage() {
  localStorage.setItem("hungryHouseDB", JSON.stringify(database));
  localStorage.setItem("hungryHouseAppState", JSON.stringify(appState));
}

async function loadFromLocalStorage() {
  // Load AppState from LocalStorage
  const savedState = localStorage.getItem("hungryHouseAppState");
  if (savedState) {
    try {
      let parsed = JSON.parse(savedState);
      appState = { ...appState, ...parsed };
    } catch (e) {
      console.log("Error parsing appState", e);
    }
  }

  // Fetch Database from PHP API
  await fetchDatabase();

  setTimeout(() => {
    updateUIAfterLogin();
  }, 100);
}

async function fetchDatabase() {
  try {
    const userId = appState.currentUser ? appState.currentUser.id : 0;
    const response = await fetch(`api.php?action=get_all&userId=${userId}`);
    const data = await response.json();
    if (data.error) {
      console.error(data.error);
    } else {
      database = data;
    }
  } catch (e) {
    console.error("Failed to fetch database", e);
  }
}

function generateId(array) {
  if (!array || array.length === 0) return 1;
  return Math.max(...array.map((item) => item.id || 0)) + 1;
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(2)}`;
}

function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentDateTime() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function getFormattedDate(dateStr) {
  if (!dateStr) return "";

  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const normalizedDate = typeof dateStr === "string"
    ? dateStr.replace(" ", "T")
    : dateStr;
  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) return String(dateStr);

  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameLocalDate(dateValue, dateString) {
  return String(dateValue || "").slice(0, 10) === dateString;
}

async function populateAvailableTablesDropdown() {
  const tableSelect = $("#tableNumber");
  if (!tableSelect.length) return;

  const selectedValue = tableSelect.val();
  tableSelect.empty();
  tableSelect.append('<option value="">Select Table</option>');

  // Sync table statuses from server to get real-time availability
  try {
    const syncResponse = await fetch("api.php?action=sync_table_status");
    const syncResult = await syncResponse.json();
    if (syncResult.success && syncResult.tables) {
      database.tables = syncResult.tables;
      saveToLocalStorage();
    }
  } catch (e) {
    console.error("Failed to sync table status for dropdown", e);
  }

  if (!database.tables || database.tables.length === 0) {
    tableSelect.append('<option value="" disabled>No tables available</option>');
    return;
  }

  database.tables
    .filter((t) => t && t.status !== "occupied")
    .sort((a, b) => Number(a.number || 0) - Number(b.number || 0))
    .forEach((table) => {
      tableSelect.append(
        `<option value="${table.number}">Table ${table.number} (${table.seats} Seats)</option>`,
      );
    });

  if (selectedValue && tableSelect.find(`option[value="${selectedValue}"]`).length) {
    tableSelect.val(selectedValue);
  }
}

// ==================== COPY OFFER CODE ====================
function copyOfferCode(code) {
  navigator.clipboard.writeText(code).then(
    function () {
      showNotification(`Code ${code} copied to clipboard!`);
    },
    function () {
      alert("Failed to copy code");
    },
  );
}

// ==================== OFFER CODE FUNCTIONS ====================
function applyOfferCode(code) {
  const offer = database.offers.find(
    (o) => o && o.code === code && (o.isActive === true || o.isActive == 1),
  );

  if (!offer) {
    $("#offerMessage").html(
      '<span class="text-danger">Invalid offer code!</span>',
    );
    return false;
  }

  const subtotal = appState.cart.reduce(
    (total, item) => total + (item.quantity || 0) * (item.price || 0),
    0,
  );

  if (code === "WEEKEND20" && subtotal < 500) {
    $("#offerMessage").html(
      '<span class="text-danger">This offer requires minimum order of ₹500!</span>',
    );
    return false;
  }

  if (code === "FAMILY30" && subtotal < 1000) {
    $("#offerMessage").html(
      '<span class="text-danger">This offer requires minimum order of ₹1000!</span>',
    );
    return false;
  }

  appState.appliedOffer = offer;
  appState.discountPercent = offer.discount;
  appState.discountAmount = (subtotal * offer.discount) / 100;

  $("#appliedOfferCode").text(offer.code);
  $("#discountPercent").text(`${offer.discount}%`);
  $("#appliedOffer").removeClass("d-none");
  $("#offerCodeInput").val("").prop("disabled", true);
  $("#applyOfferBtn").prop("disabled", true);
  $("#offerMessage").html(
    '<span class="text-success">Offer applied successfully!</span>',
  );

  loadCartItems();
  return true;
}

function removeOffer(shouldReload = true) {
  appState.appliedOffer = null;
  appState.discountAmount = 0;
  appState.discountPercent = 0;

  $("#appliedOffer").addClass("d-none");
  $("#offerCodeInput").prop("disabled", false).val("");
  $("#applyOfferBtn").prop("disabled", false);
  $("#offerMessage").empty();
  $("#discountRow").hide();

  if (shouldReload) {
    loadCartItems();
  }
}

// ==================== SECTION NAVIGATION ====================
function showSection(section) {
  // If the section doesn't exist on this page, redirect to the correct page
  if ($(`#${section}Section`).length === 0) {
    const pageMap = {
      home: "index.php",
      menu: "menu.php",
      offers: "offers.php",
      about: "about.php",
      booking: "booking.php",
    };
    if (pageMap[section]) {
      window.location.href = pageMap[section];
      return;
    }
  }

  appState.currentSection = section;

  // Only hide/show if the sections actually exist on this page
  const sections = ["home", "menu", "offers", "about", "booking"];
  sections.forEach((s) => {
    $(`#${s}Section`).hide();
  });

  if ($(`#${section}Section`).length) {
    $(`#${section}Section`).show();
  }

  $(".nav-link").removeClass("active");
  // Update both data-section and href based path matching
  $(`.nav-link[data-section="${section}"]`).addClass("active");
  $(`.nav-link[href="${section}.php"]`).addClass("active");
  if (section === "home") $('.nav-link[href="index.php"]').addClass("active");

  if (section === "menu") {
    loadFoodItems();
    startMenuRatingPromptRefresh();
  } else if (menuRatingRefreshTimer) {
    clearInterval(menuRatingRefreshTimer);
    menuRatingRefreshTimer = null;
  }
  if (section === "offers") loadOffers();

  window.scrollTo(0, 0);
}

function detectCurrentSection() {
  const path = window.location.pathname;
  const page = window.location.pathname.split("/").pop();
  if (page === "menu.php") return "menu";
  if (page === "offers.php") return "offers";
  if (page === "about.php") return "about";
  if (page === "booking.php") return "booking";
  if (page === "profile.php") return "profile";
  if (page === "admin.php") return "admin";
  return "home"; // default to home for index.php or /
}

// ==================== INITIALIZATION ====================
$(document).ready(async function () {
  await loadFromLocalStorage();
  initializeApp();
});

function initializeApp() {
  const currentSection = detectCurrentSection();

  // Sync search input with state
  if (appState.isSearching && appState.searchTerm) {
    $("#searchFood").val(appState.searchTerm);
  }

  showSection(currentSection);

  if (currentSection === "admin" && appState.isAdmin) {
    if (typeof showAdminPanel === "function") showAdminPanel();
  }

  if (currentSection === "profile") {
    loadProfilePage();
  }

  // Global counts
  updateCartCount();
  setupEventListeners();

  setTimeout(() => {
    if (!appState.isLoggedIn) {
      // Small check to not show welcome every single page load if they are just navigating
      if (!sessionStorage.getItem("welcomeShown")) {
        showNotification(
          "Welcome to The Hungry House! Login to start ordering.",
        );
        sessionStorage.setItem("welcomeShown", "true");
      }
    }
  }, 1000);
}

function setupEventListeners() {
  $(".nav-link, [data-section]")
    .off("click")
    .click(function (e) {
      // If it has a real href that isn't "#", let it navigate naturally
      const href = $(this).attr("href");
      if (href && href !== "#") {
        return; // Allow natural navigation
      }

      e.preventDefault();
      const section = $(this).data("section");
      if (section) {
        if (section === "menu") {
          appState.isSearching = false;
          appState.searchTerm = "";
          $("#searchFood").val("");
          saveToLocalStorage();
        }
        showSection(section);
      }
    });

  // Also handle real link clicks to clear search when going to menu
  $('.nav-link[href="menu.php"]').on("click", function () {
    appState.isSearching = false;
    appState.searchTerm = "";
    saveToLocalStorage();
  });

  $("#homeLink")
    .off("click")
    .click(function (e) {
      e.preventDefault();
      showSection("home");
    });

  $("#loginBtn")
    .off("click")
    .click(() => {
      $("#loginModal").modal("show");
    });

  $("#logoutBtn")
    .off("click")
    .click(() => {
      logout();
    });

  $("#showRegister")
    .off("click")
    .click((e) => {
      e.preventDefault();
      $("#loginForm").addClass("d-none");
      $("#registerForm").removeClass("d-none");
    });

  $("#forgotPasswordLink")
    .off("click")
    .click((e) => {
      e.preventDefault();
      forgotPasswordState.email = "";
      $("#forgotEmail, #forgotOtp").val("");
      $("#forgotStepOtp").addClass("d-none");
      $("#forgotStepEmail").removeClass("d-none");
      $("#forgotEmailError, #forgotOtpError").hide();
      if (resendOtpTimer) {
        clearInterval(resendOtpTimer);
        resendOtpTimer = null;
      }
      $("#resendOtpBtn").removeClass("disabled").text("Resend OTP");
      $("#loginModal").modal("hide");
      $("#forgotPasswordModal").modal("show");
    });

  $("#showLogin")
    .off("click")
    .click((e) => {
      e.preventDefault();
      $("#registerForm").addClass("d-none");
      $("#loginForm").removeClass("d-none");
    });

  $("#loginUserForm")
    .off("submit")
    .submit((e) => {
      e.preventDefault();
      loginUser();
    });

  $("#registerUserForm")
    .off("submit")
    .submit((e) => {
      e.preventDefault();
      registerUser();
    });

  $("#sendOtpBtn")
    .off("click")
    .click(sendForgotOtp);

  $("#verifyOtpBtn")
    .off("click")
    .click(verifyForgotOtp);

  $("#resendOtpBtn")
    .off("click")
    .click((e) => {
      e.preventDefault();
      resendForgotOtp();
    });

  $("#resetForgotPasswordBtn")
    .off("click")
    .click(resetPasswordWithOtp);

  // Clear errors on input
  $("input").on("input", function () {
    const id = $(this).attr("id");
    $(`#${id}Error`).hide();
  });
  // ================================== cart ===================================
  $("#cartBtn")
    .off("click")
    .click(() => {
      if (!appState.isLoggedIn) {
        showLoginAlert();
        return;
      }

      openCart();
    });

  $("#closeCart, #cartOverlay").off("click").click(closeCart);

  $("#applyOfferBtn")
    .off("click")
    .click(() => {
      const code = $("#offerCodeInput").val().trim().toUpperCase();
      if (code) {
        applyOfferCode(code);
      } else {
        $("#offerMessage").html(
          '<span class="text-danger">Please enter an offer code!</span>',
        );
      }
    });

  $("#removeOfferBtn")
    .off("click")
    .click(() => {
      removeOffer();
    });

  $("#categoryFilter")
    .off("click")
    .on("click", ".category-btn", function () {
      const category = $(this).data("category");
      appState.currentCategory = category;
      appState.isSearching = false;
      appState.searchTerm = "";
      $("#searchFood").val("");
      loadFoodItems();
      $(".category-btn").removeClass("active");
      $(this).addClass("active");
    });

  $("#checkoutBtn")
    .off("click")
    .click(() => {
      if (appState.cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      if (!appState.orderType) {
        $("#orderTypeModal").modal("show");
        return;
      }

      closeCart();
      prepareCheckout();
      $("#checkoutModal").modal("show");
    });

  $("#dineInOption")
    .off("click")
    .click(() => {
      $("#orderTypeModal").modal("hide");
      $("#dineInModal").modal("show");
    });

  $("#dineInModal")
    .off("show.bs.modal")
    .on("show.bs.modal", function () {
      populateAvailableTablesDropdown();
    });

  $("#guestName, #guestPhone")
    .off("input")
    .on("input", function () {
      const fieldId = $(this).attr("id");
      $(`#${fieldId}Error`).hide();
    });

  $("#tableNumber")
    .off("change")
    .on("change", function () {
      $("#tableNumberError").hide();
    });

  $("#deliveryOption")
    .off("click")
    .click(() => {
      appState.orderType = "delivery";
      appState.dineInDetails = null;
      $("#orderTypeModal").modal("hide");
      setTimeout(() => {
        $("#checkoutBtn").click();
      }, 100);
    });

  $("#saveDineInBtn")
    .off("click")
    .click(() => {
      const guestName = $("#guestName").val().trim();
      const guestPhone = $("#guestPhone").val().trim();
      const tableNumber = $("#tableNumber").val();
      const numberOfGuests = $("#numberOfGuests").val();

      let isValid = true;

      if (!guestName) {
        $("#guestNameError").text("✕ Guest name is required").show();
        isValid = false;
      } else if (guestName.length < 2) {
        $("#guestNameError")
          .text("✕ Guest name must be at least 2 characters")
          .show();
        isValid = false;
      } else {
        $("#guestNameError").hide();
      }

      if (!guestPhone) {
        $("#guestPhoneError").text("✕ Phone number is required").show();
        isValid = false;
      } else if (!/^[0-9]{10}$/.test(guestPhone)) {
        $("#guestPhoneError")
          .text("✕ Please enter a valid 10-digit phone number")
          .show();
        isValid = false;
      } else {
        $("#guestPhoneError").hide();
      }

      if (!tableNumber) {
        $("#tableNumberError").text("✕ Table number is required").show();
        isValid = false;
      } else {
        $("#tableNumberError").hide();
      }

      if (!isValid) return;

      const table = database.tables.find((t) => t.number == tableNumber);
      if (table && table.status !== "available") {
        $("#tableNumberError")
          .text("✕ This table is currently occupied. Please select another table.")
          .show();
        return;
      }

      appState.orderType = "dine-in";
      appState.dineInDetails = {
        guestName: guestName,
        guestPhone: guestPhone,
        tableNumber: tableNumber,
        numberOfGuests: numberOfGuests,
      };

      $("#dineInModal").modal("hide");
      setTimeout(() => {
        $("#checkoutBtn").click();
      }, 100);
      showNotification(`Welcome! Please order from Table ${tableNumber}`);
    });

  $("#placeOrderBtn").off("click").click(placeOrder);

  $('input[name="paymentMethod"]')
    .off("change")
    .change(function () {
      const method = $(this).val();
      if (method === 'razorpay') {
        $('#placeOrderBtn').html('<i class="fas fa-lock me-2"></i>Pay & Confirm Order');
      } else {
        $('#placeOrderBtn').html('Confirm Order');
      }
    });

  $("#downloadBillBtn").off("click").click(downloadBill);

  $("#backToHomeBtn")
    .off("click")
    .click(() => {
      $("#billModal").modal("hide");
      clearCart();
      updateCartCount();
      appState.orderType = null;
      appState.dineInDetails = null;
      appState.appliedOffer = null;
      appState.discountAmount = 0;
      appState.discountPercent = 0;
      showSection("home");
    });

  $("#orderNowBtn")
    .off("click")
    .click(() => {
      showSection("menu");
    });

  $("#searchBtn").off("click").click(performSearch);

  $("#searchFood")
    .off("keyup")
    .keyup(function (e) {
      if ($(this).val().trim() === "") {
        clearSearch();
      } else if (e.which === 13) {
        performSearch();
      }
    });

  $("#clearSearchBtn").off("click").click(clearSearch);

  $("#adminPanelBtn")
    .off("click")
    .click(() => {
      if (typeof showAdminPanel === "function") showAdminPanel();
    });

  $("#profileBtn")
    .off("click")
    .click(() => {
      window.location.href = "profile.php";
    });

  $("#backToSiteBtn")
    .off("click")
    .click(() => {
      if (typeof hideAdminPanel === "function") hideAdminPanel();
    });

  $("[data-admin-section]")
    .off("click")
    .click(function (e) {
      e.preventDefault();
      const section = $(this).data("admin-section");
      if (typeof showAdminSection === "function") showAdminSection(section);
      $("[data-admin-section]").removeClass("active");
      $(this).addClass("active");
    });

  if (typeof showUserModal === "function") {
    $("#addUserBtn")
      .off("click")
      .click(() => showUserModal());
  }
  if (typeof showFoodModal === "function") {
    $("#addFoodBtn")
      .off("click")
      .click(() => showFoodModal());
  }
  if (typeof showOfferModal === "function") {
    $("#addOfferBtn")
      .off("click")
      .click(() => showOfferModal());
  }
  if (typeof showTableModal === "function") {
    $("#addTableBtn")
      .off("click")
      .click(() => showTableModal());
  }

  if (typeof generateSalesReport === "function") {
    $("#generateSalesReport").off("click").click(generateSalesReport);
  }
  if (typeof viewPopularItems === "function") {
    $("#viewPopularItems").off("click").click(viewPopularItems);
  }
  if (typeof viewOccupancy === "function") {
    $("#viewOccupancy").off("click").click(viewOccupancy);
  }
}

async function loadProfilePage() {
  if (!window.location.pathname.includes("profile.php")) return;

  if (!appState.isLoggedIn || !appState.currentUser) {
    showNotification("Please login to access your profile.");
    window.location.href = "index.php";
    return;
  }

  fillProfileDetails();
  fillProfileForm();

  $("#editProfileBtn")
    .off("click")
    .on("click", function () {
      fillProfileForm();
      const modalEl = document.getElementById("editProfileModal");
      if (modalEl) new bootstrap.Modal(modalEl).show();
      $("#profileName").trigger("focus");
    });

  $("#editProfileModal")
    .off("hidden.bs.modal")
    .on("hidden.bs.modal", function () {
      $("#profileCurrentPassword, #profileNewPassword").val("");
      $(
        "#profileNameError, #profilePhoneError, #profileCurrentPasswordError, #profileNewPasswordError",
      ).hide();
    });

  $("#profileForm input")
    .off("input")
    .on("input", function () {
      const fieldId = $(this).attr("id");
      $(`#${fieldId}Error`).hide();
    });

  $("#profileForm")
    .off("submit")
    .on("submit", function (e) {
      e.preventDefault();
      updateProfile();
    });

  await loadUserOrders();

  if (profileOrdersRefreshTimer) clearInterval(profileOrdersRefreshTimer);
  profileOrdersRefreshTimer = setInterval(() => {
    if (!document.hidden) loadUserOrders();
  }, 15000);
}

function fillProfileDetails() {
  if (!appState.currentUser) return;
  $("#profileNameText").text(appState.currentUser.name || "-");
  $("#profileEmailText").text(appState.currentUser.email || "-");
  $("#profilePhoneText").text(appState.currentUser.phone || "-");
}

function fillProfileForm() {
  if (!appState.currentUser) return;
  $("#profileName").val(appState.currentUser.name || "");
  $("#profileEmail").val(appState.currentUser.email || "");
  $("#profilePhone").val(appState.currentUser.phone || "");
}

async function loadUserOrders() {
  if (!appState.currentUser) return;

  try {
    const response = await fetch(
      `api.php?action=get_user_orders&userId=${appState.currentUser.id}`,
    );
    const result = await response.json();

    const orders = result.success && Array.isArray(result.orders) ? result.orders : [];
    profileOrdersCache = orders;
    $("#profileOrdersCount").text(orders.length);

    if (orders.length === 0) {
      $("#profileOrdersList").html(
        '<div class="text-center text-muted py-4">No orders found yet.</div>',
      );
      return;
    }

    const ordersHtml = orders
      .map((order) => {
        const statusClass =
          {
            pending: "warning",
            preparing: "info",
            ready: "primary",
            delivered: "success",
            cancelled: "danger",
          }[order.status] || "secondary";
        const rating = parseInt(order.rating || 0, 10);
        const ratingFood = getPrimaryOrderFood(order);
        const ratingFoodHtml = buildRatingFoodPreview(ratingFood, order);
        const ratingHtml =
          order.status === "delivered"
            ? rating > 0
              ? `<div class="order-rating mt-3">
                  ${ratingFoodHtml}
                  <span class="text-warning">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>
                  <span class="small text-muted ms-2">You rated this order</span>
                  ${order.ratingComment ? `<div class="small text-muted mt-1">${order.ratingComment}</div>` : ""}
                </div>`
              : `<div class="order-rating mt-3">
                  ${ratingFoodHtml}
                  <button class="btn btn-sm btn-warning rate-order-btn" data-order-id="${order.id}">
                    <i class="fas fa-star me-1"></i>Rate Your Order
                  </button>
                </div>`
            : "";

        return `
          <div class="card border-0 bg-light">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Order #ORD-${String(order.id || 0).padStart(3, "0")}</h6>
                <span class="badge bg-${statusClass}">${order.status || "pending"}</span>
              </div>
              <div class="small text-muted mb-2">${order.date ? getFormattedDate(order.date) : "N/A"}</div>
              <div class="small mb-2"><strong>Type:</strong> ${order.type || "N/A"}</div>
              <div class="small mb-2"><strong>Items:</strong> ${order.items_summary || "-"}</div>
              <div class="fw-bold text-primary">Total: ${formatCurrency(order.total || 0)}</div>
              ${ratingHtml}
            </div>
          </div>
        `;
      })
      .join("");
//================rate button event================================ 
    $("#profileOrdersList").html(ordersHtml);
    $(".rate-order-btn")
      .off("click")
      .on("click", function () {
        showRateOrderModal($(this).data("order-id"));
      });

    openPendingRatingModal(orders);
  } catch (e) {
    console.error("Error loading user orders", e);
    $("#profileOrdersList").html(
      '<div class="text-danger">Failed to load orders. Please try again.</div>',
    );
  }
}
//===================== ORDER RATING FUNCTIONS ================================================
function openPendingRatingModal(orders) {
  if ($("#rateOrderModal.show").length || $(".modal.show").length) return;

  const pendingRatingOrder = orders.find((order) => {
    const orderId = String(order && order.id ? order.id : "");
    return (
      orderId &&
      order.status === "delivered" &&
      !parseInt(order.rating || 0, 10) &&
      !autoOpenedRatingOrders.has(orderId)
    );
  });

  if (!pendingRatingOrder) return;

  const orderId = String(pendingRatingOrder.id);
  autoOpenedRatingOrders.add(orderId);
  setTimeout(() => {
    if (!$(".modal.show").length) {
      showRateOrderModal(orderId);
    }
  }, 400);
}

function startMenuRatingPromptRefresh() {
  if (!appState.isLoggedIn || !appState.currentUser) return;

  loadPendingRatingOrdersForMenu();
  if (menuRatingRefreshTimer) clearInterval(menuRatingRefreshTimer);

  menuRatingRefreshTimer = setInterval(() => {
    if (!document.hidden && detectCurrentSection() === "menu") {
      loadPendingRatingOrdersForMenu();
    }
  }, 15000);
}

async function loadPendingRatingOrdersForMenu() {
  if (!appState.isLoggedIn || !appState.currentUser) return;

  try {
    const response = await fetch(
      `api.php?action=get_user_orders&userId=${appState.currentUser.id}`,
    );
    const result = await response.json();
    const orders = result.success && Array.isArray(result.orders) ? result.orders : [];
    profileOrdersCache = orders;
    openPendingRatingModal(orders);
  } catch (e) {
    console.error("Error checking pending menu ratings", e);
  }
}

function getPrimaryOrderFood(order) {
  const firstItem = order && Array.isArray(order.items) ? order.items[0] : null;
  const food = firstItem && Array.isArray(database.foodItems)
    ? database.foodItems.find(
        (item) =>
          item &&
          ((firstItem.foodId && parseInt(item.id, 10) === parseInt(firstItem.foodId, 10)) ||
            (firstItem.name && item.name === firstItem.name)),
      )
    : null;

  return {
    name: (food && food.name) || (firstItem && firstItem.name) || "Your order",
    image:
      (food && food.image) ||
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80",
    description:
      (food && food.description) ||
      `${Array.isArray(order.items) ? order.items.length : 0} item${Array.isArray(order.items) && order.items.length === 1 ? "" : "s"} in this order`,
    extraCount: Array.isArray(order.items) && order.items.length > 1 ? order.items.length - 1 : 0,
  };
}

function buildRatingFoodPreview(food, order) {
  const itemNames = Array.isArray(order.items)
    ? order.items.map((item) => item.name).filter(Boolean).join(", ")
    : "";

  return `
    <div class="rating-food-preview mb-3">
      <img src="${food.image}" alt="${food.name}">
      <div class="min-w-0">
        <div class="fw-semibold text-dark">${food.name}${food.extraCount ? ` +${food.extraCount} more` : ""}</div>
        <div class="small text-muted text-truncate">${itemNames || food.description}</div>
      </div>
    </div>
  `;
}


//===================== END OF ORDER RATING FUNCTIONS =================================================================
function showRateOrderModal(orderId) {
  const order = profileOrdersCache.find(
    (cachedOrder) => cachedOrder && parseInt(cachedOrder.id, 10) === parseInt(orderId, 10),
  );
  const food = getPrimaryOrderFood(order || {});
  const foodPreview = buildRatingFoodPreview(food, order || { items: [] });
//
  $("#rateOrderModal").remove();
  $("body").append(`
    <div class="modal fade" id="rateOrderModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
          <div class="modal-header">
            <h5 class="modal-title">Rate Your Order</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            ${foodPreview}
            <div class="rating-stars d-flex justify-content-center gap-2 mb-3" data-rating="0">
              ${[1, 2, 3, 4, 5]
                .map(
                  (value) =>
                    `<button type="button" class="rating-star" data-rating="${value}" aria-label="${value} star"><i class="fas fa-star"></i></button>`,
                )
                .join("")}
            </div>
            <textarea class="form-control" id="ratingComment" rows="3" maxlength="300" placeholder="Add a short note (optional)"></textarea>
            <div id="ratingError" class="text-danger small mt-2" style="display:none;"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-warning" id="submitRatingBtn">Submit Rating</button>
          </div>
        </div>
      </div>
    </div>
  `);

  const modal = new bootstrap.Modal(document.getElementById("rateOrderModal"));
  modal.show();

  $(".rating-star").on("click", function () {
    const rating = parseInt($(this).data("rating"), 10);
    $(".rating-stars").attr("data-rating", rating);
    $(".rating-star").each(function () {
      $(this).toggleClass("active", parseInt($(this).data("rating"), 10) <= rating);
    });
    $("#ratingError").hide();
  });

  $("#submitRatingBtn").on("click", function () {
    submitOrderRating(orderId);
  });
}

async function submitOrderRating(orderId) {
  const rating = parseInt($(".rating-stars").attr("data-rating") || "0", 10);
  if (!rating) {
    $("#ratingError").text("Please select a star rating.").show();
    return;
  }

  setLoadingState("#submitRatingBtn", true, "Submitting...");
  try {
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("rating", rating);
    formData.append("comment", $("#ratingComment").val() || "");

    const response = await fetch("api.php?action=rate_order", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (result.success) {
      showNotification("Thanks for rating your order!");
      const modalInstance = bootstrap.Modal.getInstance(document.getElementById("rateOrderModal"));
      if (modalInstance) modalInstance.hide();
      await loadUserOrders();
    } else {
      $("#ratingError").text(result.message || "Failed to save rating").show();
    }
  } catch (e) {
    console.error("Error rating order", e);
    $("#ratingError").text("An error occurred while saving your rating.").show();
  } finally {
    setLoadingState("#submitRatingBtn", false);
  }
}

async function updateProfile() {
  if (!appState.currentUser) return;

  const name = ($("#profileName").val() || "").trim();
  const phone = ($("#profilePhone").val() || "").trim();
  const currentPassword = $("#profileCurrentPassword").val() || "";
  const newPassword = $("#profileNewPassword").val() || "";

  let isValid = true;

  if (!name) {
    $("#profileNameError").text("✕ Name is required").show();
    isValid = false;
  } else if (name.length < 2) {
    $("#profileNameError").text("✕ Name must be at least 2 characters").show();
    isValid = false;
  } else {
    $("#profileNameError").hide();
  }

  if (!phone) {
    $("#profilePhoneError").text("✕ Phone number is required").show();
    isValid = false;
  } else if (!/^[0-9]{10}$/.test(phone)) {
    $("#profilePhoneError")
      .text("✕ Please enter a valid 10-digit phone number")
      .show();
    isValid = false;
  } else {
    $("#profilePhoneError").hide();
  }

  if (newPassword && !currentPassword) {
    $("#profileCurrentPasswordError")
      .text("✕ Current password is required to set a new password")
      .show();
    isValid = false;
  } else {
    $("#profileCurrentPasswordError").hide();
  }

  if (newPassword && newPassword.length < 6) {
    $("#profileNewPasswordError")
      .text("✕ New password must be at least 6 characters")
      .show();
    isValid = false;
  } else {
    $("#profileNewPasswordError").hide();
  }

  if (!isValid) return;

  setLoadingState('#profileForm button[type="submit"]', true, 'Updating...');
  try {
    const formData = new FormData();
    formData.append("userId", appState.currentUser.id);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);

    const response = await fetch("api.php?action=update_profile", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (result.success) {
      appState.currentUser = {
        ...appState.currentUser,
        ...result.user,
      };
      saveToLocalStorage();
      showNotification("Profile updated successfully!");
      $("#profileCurrentPassword").val("");
      $("#profileNewPassword").val("");
      fillProfileForm();
      fillProfileDetails();
      const modalEl = document.getElementById("editProfileModal");
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }
    } else {
      if (result.message === "Current password is incorrect") {
        $("#profileCurrentPasswordError")
          .text("✕ Current password is incorrect")
          .show();
      } else {
        alert(result.message || "Failed to update profile");
      }
    }
  } catch (e) {
    console.error("Error updating profile", e);
    alert("An error occurred while updating profile.");
  } finally {
    setLoadingState('#profileForm button[type="submit"]', false);
  }
}

// ==================== FOOD ITEMS FUNCTIONS ====================
function loadFoodItems() {
  const foodItemsContainer = $("#foodItems");
  const noResultsMessage = $("#noResultsMessage");

  noResultsMessage.addClass("d-none");
  foodItemsContainer.empty();

  if (!database.foodItems) database.foodItems = [];

  let filteredItems = database.foodItems.filter(
    (item) => item && item.isAvailable !== false,
  );

  if (!appState.isSearching && appState.currentCategory !== "all") {
    filteredItems = filteredItems.filter(
      (item) => item && item.category === appState.currentCategory,
    );
  }

  if (appState.isSearching && appState.searchTerm) {
    const searchTerm = appState.searchTerm.toLowerCase();
    filteredItems = filteredItems.filter(
      (item) =>
        item &&
        ((item.name && item.name.toLowerCase().includes(searchTerm)) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTerm))),
    );
  }

  if (filteredItems.length === 0 && appState.isSearching) {
    foodItemsContainer.hide();
    noResultsMessage.removeClass("d-none");
    return;
  }

  foodItemsContainer.show();

  filteredItems.forEach((food) => {
    if (!food) return;
    const price = food.offerPrice || food.price || 0;
    const originalPrice = food.offerPrice
      ? `<del class="text-muted">${formatCurrency(food.price)}</del>`
      : "";
    const avgRating = Number(food.avgRating || 0);
    const ratingCount = Number(food.ratingCount || 0);
    const roundedRating = Math.round(avgRating);
    const ratingHtml = `
      <div class="food-card-rating mb-2">
        <span class="text-warning">${"★".repeat(roundedRating)}${"☆".repeat(5 - roundedRating)}</span>
        <span class="small text-muted ms-2">
          ${ratingCount ? `${avgRating.toFixed(1)} (${ratingCount})` : "No ratings yet"}
        </span>
      </div>
    `;

    foodItemsContainer.append(`
            <div class="col-lg-4 col-md-6 mb-4" data-category="${food.category || ""}">
                <div class="card food-card h-100">
                    ${food.isOffer ? '<span class="badge-offer">OFFER</span>' : ""}
                    <img src="${food.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"}" class="card-img-top food-img" alt="${food.name || "Food"}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${food.name || "Food Item"}</h5>
                        ${ratingHtml}
                        <p class="card-text text-muted">${food.description || "Delicious food"}</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <span class="fs-4 fw-bold text-primary rupee-symbol">${Number(price).toFixed(2)}</span>
                                    ${originalPrice}
                                </div>
                                <span class="badge ${getCategoryBadgeClass(food.category)}">
                                    ${getCategoryDisplayName(food.category)}
                                </span>
                            </div>
                            ${appState.isLoggedIn
        ? `<button class="btn btn-primary w-100 add-to-cart" data-food-id="${food.id}">
                                    <i class="fas fa-cart-plus me-2"></i>Add to Cart
                                </button>`
        : `<button class="btn btn-outline-secondary w-100" disabled>
                                    Login to Order
                                </button>`
      }
                        </div>
                    </div>
                </div>
            </div>
        `);
  });

  $(".add-to-cart")
    .off("click")
    .click(function () {
      const foodId = $(this).data("food-id");
      addToCart(foodId);
    });
}

function getCategoryBadgeClass(category) {
  const classes = {
    starters: "bg-info",
    "main-course": "bg-success",
    breads: "bg-warning text-dark",
    desserts: "bg-danger",
  };
  return classes[category] || "bg-secondary";
}

function getCategoryDisplayName(category) {
  const names = {
    starters: "Starters",
    "main-course": "Main Course",
    breads: "Breads",
    desserts: "Desserts",
  };
  return names[category] || category || "Other";
}

function performSearch() {
  const searchTerm = $("#searchFood").val().toLowerCase().trim();
  if (!searchTerm) {
    clearSearch();
    return;
  }

  appState.isSearching = true;
  appState.searchTerm = searchTerm;
  appState.currentCategory = "all";

  saveToLocalStorage();

  if (detectCurrentSection() !== "menu") {
    window.location.href = "menu.php";
    return;
  }

  $(".category-btn").removeClass("active");
  $('.category-btn[data-category="all"]').addClass("active");
  loadFoodItems();
}

function clearSearch() {
  appState.isSearching = false;
  appState.searchTerm = "";
  $("#searchFood").val("");
  $("#noResultsMessage").addClass("d-none");
  saveToLocalStorage();
  loadFoodItems();
}

// ==================== OFFERS FUNCTIONS =====================================================
function loadOffers() {
  const offerItemsContainer = $("#offerItems").empty();

  if (!database.offers) database.offers = [];

  database.offers
    .filter((offer) => offer && offer.isActive)
    .forEach((offer) => {
      if (!offer) return;
      offerItemsContainer.append(`
            <div class="col-md-4 mb-4">
                <div class="offer-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title text-warning">${offer.title || "Offer"}</h5>
                        <span class="badge bg-warning text-dark fs-6">${offer.discount || 0}% OFF</span>
                    </div>
                    <p class="card-text">${offer.description || "Special offer"}</p>
                    <div class="mt-3">
                        <div class="d-flex align-items-center justify-content-between">
                            <p class="mb-1"><strong>Code: <span class="text-primary">${offer.code || "CODE"}</span></strong></p>
                            <button class="copy-code-btn" data-code="${offer.code || ""}"><i class="fas fa-copy me-1"></i>Copy</button>
                        </div>
                        <p class="text-muted small"><i class="far fa-calendar-alt me-1"></i>Valid until: ${getFormattedDate(offer.validUntil) || "N/A"}</p>
                    </div>
                </div>
            </div>
        `);
    });

  $(".copy-code-btn")
    .off("click")
    .click(function () {
      const code = $(this).data("code");
      copyOfferCode(code);
    });
}

// ==================== CART FUNCTIONS =======================================================
function addToCart(foodId) {
  if (!database.foodItems) database.foodItems = [];
  const food = database.foodItems.find((item) => item && item.id === foodId);
  if (!food) return;

  const existingItem = appState.cart.find((item) => item.foodId === foodId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    appState.cart.push({
      foodId: foodId,
      quantity: 1,
      price: food.offerPrice || food.price || 0,
      name: food.name || "Food Item",
    });
  }

  if (appState.appliedOffer) {
    removeOffer();
  }

  updateCartCount();
  saveToLocalStorage();
  showNotification(`${food.name || "Item"} added to cart!`);
}

function updateCartCount() {
  $("#cartCount").text(
    appState.cart.reduce((total, item) => total + (item.quantity || 0), 0),
  );
}

function openCart() {
  $("#cartSidebar, #cartOverlay").addClass("active");
  loadCartItems();
}

function closeCart() {
  $("#cartSidebar, #cartOverlay").removeClass("active");
}

function loadCartItems() {
  if (appState.cart.length === 0) {
    $("#cartItems").html(
      `<div class="text-center py-5"><i class="fas fa-shopping-cart fa-4x text-muted mb-3"></i><p class="text-muted">Your cart is empty</p></div>`,
    );
    $("#cartSubtotal, #cartTax, #cartTotal").text("0.00");
    $("#cartDelivery").text(
      appState.orderType === "delivery" ? "49.00" : "0.00",
    );
    $("#discountRow").hide();
    removeOffer(false);
    return;
  }

  let cartHTML = "",
    subtotal = 0;

  appState.cart.forEach((cartItem, index) => {
    if (!cartItem) return;
    const food = database.foodItems
      ? database.foodItems.find((item) => item && item.id === cartItem.foodId)
      : null;
    if (!food) return;

    const itemTotal = (cartItem.quantity || 0) * (cartItem.price || 0);
    subtotal += itemTotal;

    cartHTML += `
            <div class="card mb-3 border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title mb-1">${food.name || "Item"}</h6>
                            <p class="card-text text-muted small mb-2 rupee-symbol">${Number(cartItem.price || 0).toFixed(2)} each</p>
                            <div class="d-flex align-items-center">
                                <button class="btn btn-sm btn-outline-secondary decrease-quantity" data-index="${index}"><i class="fas fa-minus"></i></button>
                                <span class="mx-3 fw-bold">${cartItem.quantity || 0}</span>
                                <button class="btn btn-sm btn-outline-secondary increase-quantity" data-index="${index}"><i class="fas fa-plus"></i></button>
                                <button class="btn btn-sm btn-outline-danger ms-3 remove-item" data-index="${index}"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold rupee-symbol text-primary">${Number(itemTotal).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  });

  $("#cartItems").html(cartHTML);

  let discountAmount = 0;
  if (appState.appliedOffer) {
    discountAmount = (subtotal * appState.appliedOffer.discount) / 100;
    $("#discountRow").show();
    $("#cartDiscount").text(Number(discountAmount).toFixed(2));
  } else {
    $("#discountRow").hide();
  }

  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * 0.18;
  const delivery = appState.orderType === "delivery" ? 49 : 0;
  const total = taxableAmount + tax + delivery;

  $("#cartSubtotal").text(Number(subtotal).toFixed(2));
  $("#cartTax").text(Number(tax).toFixed(2));
  $("#cartDelivery").text(Number(delivery).toFixed(2));
  $("#cartTotal").text(Number(total).toFixed(2));

  $(".increase-quantity")
    .off("click")
    .click(function () {
      const index = $(this).data("index");
      if (appState.cart[index]) {
        appState.cart[index].quantity =
          (appState.cart[index].quantity || 1) + 1;
        if (appState.appliedOffer) removeOffer();
        loadCartItems();
        updateCartCount();
        saveToLocalStorage();
      }
    });

  $(".decrease-quantity")
    .off("click")
    .click(function () {
      const index = $(this).data("index");
      if (appState.cart[index]) {
        if (appState.cart[index].quantity > 1) {
          appState.cart[index].quantity -= 1;
        } else {
          appState.cart.splice(index, 1);
        }
        if (appState.appliedOffer) removeOffer();
        loadCartItems();
        updateCartCount();
        saveToLocalStorage();
      }
    });

  $(".remove-item")
    .off("click")
    .click(function () {
      const index = $(this).data("index");
      appState.cart.splice(index, 1);
      if (appState.appliedOffer) removeOffer(false);
      loadCartItems();
      updateCartCount();
      saveToLocalStorage();
    });
}

function prepareCheckout() {
  $("#checkoutOrderType").text(
    appState.orderType === "dine-in" ? "Dine-In" : "Delivery",
  );

  // Render cart items in the checkout summary
  let summaryHTML = "";
  appState.cart.forEach((cartItem) => {
    if (!cartItem) return;
    const itemTotal = (cartItem.quantity || 0) * (cartItem.price || 0);
    summaryHTML += `
      <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
        <div>
          <span class="fw-semibold">${cartItem.name || "Item"}</span>
          <span class="text-muted small ms-2">x${cartItem.quantity || 0}</span>
        </div>
        <span class="rupee-symbol fw-bold">${Number(itemTotal).toFixed(2)}</span>
      </div>`;
  });
  $("#checkoutSummary").html(
    summaryHTML || "<p class='text-muted'>No items</p>",
  );

  if (appState.orderType === "dine-in" && appState.dineInDetails) {
    $("#checkoutDeliveryDetails").addClass("d-none");
    $("#checkoutDineInDetails").removeClass("d-none").html(`
            <div class="card mt-3 border-primary">
                <div class="card-body">
                    <h6 class="text-primary"><i class="fas fa-chair me-2"></i>Dine-In Details</h6>
                    <p class="mb-1"><strong>Name:</strong> ${appState.dineInDetails.guestName || ""}</p>
                    <p class="mb-1"><strong>Phone:</strong> ${appState.dineInDetails.guestPhone || ""}</p>
                    <p class="mb-1"><strong>Table:</strong> ${appState.dineInDetails.tableNumber || ""}</p>
                    <p class="mb-0"><strong>Guests:</strong> ${appState.dineInDetails.numberOfGuests || ""}</p>
                </div>
            </div>
        `);
  } else {
    $("#checkoutDineInDetails").addClass("d-none");
    $("#checkoutDeliveryDetails").removeClass("d-none").html(`
            <div class="mt-3">
                <div class="mb-3">
                    <label for="deliveryAddress" class="form-label">Delivery Address</label>
                    <textarea class="form-control" id="deliveryAddress" rows="2" required></textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="deliveryCity" class="form-label">City</label>
                        <input type="text" class="form-control" id="deliveryCity" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="deliveryPincode" class="form-label">Pincode</label>
                        <input type="text" class="form-control" id="deliveryPincode" pattern="[0-9]{6}" required>
                    </div>
                </div>
            </div>
        `);
  }

  const subtotal = appState.cart.reduce(
    (total, item) => total + (item.quantity || 0) * (item.price || 0),
    0,
  );
  const discount = appState.discountAmount;
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * 0.18;
  const delivery = appState.orderType === "delivery" ? 49 : 0;
  const total = taxableAmount + tax + delivery;

  $("#checkoutSubtotal").text(Number(subtotal).toFixed(2));

  if (discount > 0) {
    $("#checkoutDiscountRow").show();
    $("#checkoutDiscount").text(Number(discount).toFixed(2));
  } else {
    $("#checkoutDiscountRow").hide();
  }

  $("#checkoutTax").text(Number(tax).toFixed(2));
  $("#checkoutDelivery").text(Number(delivery).toFixed(2));
  $("#checkoutTotal").text(Number(total).toFixed(2));
}

function clearCart() {
  appState.cart = [];
  saveToLocalStorage();
}

// ==================== ORDER FUNCTIONS ====================
async function placeOrder() {
  if (!appState.isLoggedIn) {
    alert("Please login to place an order!");
    document.activeElement.blur();
    $("#checkoutModal").modal("hide");
    $("#loginModal").modal("show");
    return;
  }

  if (appState.cart.length === 0) {
    alert("Your cart is empty!");
    $("#checkoutModal").modal("hide");
    return;
  }

  const subtotal = appState.cart.reduce(
    (total, item) => total + (item.quantity || 0) * (item.price || 0),
    0,
  );
  const discount = appState.discountAmount;
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * 0.18;
  const delivery =
    taxableAmount > 0 && appState.orderType === "delivery" ? 49 : 0;
  const totalAmount = taxableAmount + tax + delivery;

  let orderData = {
    userId: appState.currentUser ? appState.currentUser.id : 0,
    type: appState.orderType,
    items: appState.cart.map((item) => ({ ...item })),
    subtotal: subtotal,
    tax: tax,
    delivery: delivery,
    total: totalAmount,
    status: appState.orderType === "dine-in" ? "preparing" : "pending",
    date: getCurrentDateTime(),
    customerName: appState.currentUser ? appState.currentUser.name : "Guest",
    customerPhone: appState.currentUser ? appState.currentUser.phone : "",
    paymentMethod: $('input[name="paymentMethod"]:checked').val(),
    appliedOfferId: appState.appliedOffer ? appState.appliedOffer.id : null,
  };

  if (appState.orderType === "dine-in" && appState.dineInDetails) {
    orderData.tableNumber = appState.dineInDetails.tableNumber;
    orderData.numberOfGuests = appState.dineInDetails.numberOfGuests;
  } else {
    const address = $("#deliveryAddress").val();
    const city = $("#deliveryCity").val();
    const pincode = $("#deliveryPincode").val();

    if (!address || !city || !pincode) {
      alert("Please fill all delivery details");
      return;
    }

    orderData.address = `${address}, ${city} - ${pincode}`;
  }

  // ---- RAZORPAY PAYMENT FLOW ----=========================================================
  if (orderData.paymentMethod === 'razorpay') {
    setLoadingState('#placeOrderBtn', true, 'Initiating Payment...');
    try {
      // Step 1: Create Razorpay Order on server
      const rzpResponse = await fetch('api.php?action=create_razorpay_order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          receipt: 'rcpt_' + Date.now()
        })
      });
      const rzpResult = await rzpResponse.json();

      if (!rzpResult.success) {
        alert('Payment initiation failed: ' + (rzpResult.message || 'Unknown error'));
        setLoadingState('#placeOrderBtn', false);
        return;
      }

      setLoadingState('#placeOrderBtn', false);

      // Step 2: Open Razorpay Checkout
      const razorpayOptions = {
        key: rzpResult.keyId,
        amount: rzpResult.amount,
        currency: rzpResult.currency,
        name: 'The Hungry House',
        description: `Order - ${appState.cart.map(i => i.name).join(', ').substring(0, 100)}`,
        order_id: rzpResult.orderId,
        prefill: {
          name: appState.currentUser ? appState.currentUser.name : '',
          email: appState.currentUser ? appState.currentUser.email : '',
          contact: appState.currentUser ? appState.currentUser.phone : ''
        },
        theme: {
          color: '#0d9e71'
        },
        handler: async function (response) {
          // Payment successful — verify on server
          setLoadingState('#placeOrderBtn', true, 'Verifying Payment...');
          try {
            const verifyRes = await fetch('api.php?action=verify_razorpay_payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyResult = await verifyRes.json();

            if (!verifyResult.success) {
              alert('Payment verification failed: ' + verifyResult.message);
              setLoadingState('#placeOrderBtn', false);
              return;
            }

            // Attach payment ID to order
            orderData.razorpayPaymentId = response.razorpay_payment_id;
            orderData.paymentMethod = 'razorpay';

            // Step 3: Place the order in our system
            await submitOrderToServer(orderData);
          } catch (e) {
            console.error('Payment verification error', e);
            alert('Payment verification failed. Please contact support.');
            setLoadingState('#placeOrderBtn', false);
          }
        },
        modal: {
          ondismiss: function () {
            showNotification('Payment was cancelled.');
          }
        }
      };

      const rzpCheckout = new Razorpay(razorpayOptions);
      rzpCheckout.on('payment.failed', function (response) {
        alert('Payment failed: ' + (response.error.description || 'Please try again'));
      });
      rzpCheckout.open();
    } catch (e) {
      console.error('Razorpay error', e);
      alert('An error occurred while initiating payment.');
      setLoadingState('#placeOrderBtn', false);
    }
    return;
  }

  // ---- CASH PAYMENT FLOW ----
  setLoadingState('#placeOrderBtn', true, 'Processing...');
  await submitOrderToServer(orderData);
}

async function submitOrderToServer(orderData) {
  try {
    const response = await fetch("api.php?action=place_order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const result = await response.json();

    if (result.success) {
      orderData.id = result.orderId;
      await fetchDatabase(); // Refresh local database

      // Refresh admin panel views if open (so table turns red immediately)
      if (typeof loadAdminDashboard === "function") loadAdminDashboard();
      if (typeof loadAdminTables === "function") loadAdminTables();

      document.activeElement.blur();
      $("#checkoutModal")
        .one("hidden.bs.modal", () => {
          showBillReceipt(orderData);
          clearCart();
          updateCartCount();
          appState.orderType = null;
          appState.dineInDetails = null;
          appState.appliedOffer = null;
          appState.discountAmount = 0;
          appState.discountPercent = 0;
        })
        .modal("hide");
    } else {
      alert("Failed to place order: " + result.message);
    }
  } catch (e) {
    console.error("Error placing order", e);
    alert("An error occurred while placing your order.");
  } finally {
    setLoadingState('#placeOrderBtn', false);
  }
}
//===============bill receipt functions ====================================================
function showBillReceipt(order) {
  if (!order) return;

  const orderId = `#ORD-${String(order.id || 1).padStart(3, "0")}`;

  $("#receiptOrderId").text(orderId);
  $("#receiptDate, #receiptDateDetail").text(
    getFormattedDate(order.date || new Date()),
  );
  $("#receiptOrderType").text(
    order.type === "dine-in" ? "Dine-In" : "Delivery",
  );

  if (order.type === "dine-in") {
    $("#receiptAddressInfo").addClass("d-none");
    $("#receiptTableInfo").removeClass("d-none");
    $("#receiptTableNumber").text(order.tableNumber || "1");
    $("#receiptDeliveryRow").hide();
    $("#orderTypeMessage").text(
      `Your order for Table ${order.tableNumber || "1"} has been placed.`,
    );
  } else {
    $("#receiptTableInfo").addClass("d-none");
    $("#receiptAddressInfo").removeClass("d-none");
    $("#receiptAddress").text(order.address || "N/A");
    $("#receiptDeliveryRow").show();
    $("#orderTypeMessage").text("Your delivery order has been placed.");
  }

  let receiptItemsHTML = "";
  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      if (!item) return;
      receiptItemsHTML += `
                <div class="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <div><div>${item.name || "Item"} x${item.quantity || 0}</div><small class="text-muted rupee-symbol">${Number(item.price || 0).toFixed(2)} each</small></div>
                    <div class="rupee-symbol fw-bold">${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</div>
                </div>
            `;
    });
  }

  $("#receiptItems").html(
    receiptItemsHTML || '<p class="text-center">No items</p>',
  );
  $("#receiptSubtotal").text(Number(order.subtotal || 0).toFixed(2));
  $("#receiptDiscount").text(Number(order.discount || 0).toFixed(2));
  $("#receiptTax").text(Number(order.tax || 0).toFixed(2));
  $("#receiptDelivery").text(Number(order.delivery || 0).toFixed(2));
  $("#receiptTotal").text(Number(order.total || 0).toFixed(2));

  if (order.discount && order.discount > 0) {
    $("#receiptDiscountRow").show();
  } else {
    $("#receiptDiscountRow").hide();
  }

  // Display payment method on receipt
  const paymentDisplay = order.paymentMethod === 'razorpay'
    ? 'ONLINE (RAZORPAY) ✓'
    : (order.paymentMethod || 'CASH').toUpperCase();
  $("#receiptPayment").text(paymentDisplay);

  $("#billModal").modal("show");
}

function downloadBill() {
  const element = document.getElementById("billReceipt");
  if (element) {
    html2pdf()
      .set({
        margin: 0.5,
        filename: `hungry-House-receipt-${$("#receiptOrderId").text()}.pdf`,
      })
      .from(element)
      .save();
  }
}

// ==================== AUTHENTICATION ====================
async function loginUser() {
  const email = ($("#loginEmail").val() || "").trim();
  const password = $("#loginPassword").val() || "";
  const isAdmin = $("#loginAsAdmin").is(":checked");

  let isValid = true;

  if (!email) {
    $("#loginEmailError").text("✕ Email address is required").show();
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $("#loginEmailError").text("✕ Please enter a valid email address").show();
    isValid = false;
  } else {
    $("#loginEmailError").hide();
  }

  if (!password) {
    $("#loginPasswordError").text("✕ Password is required").show();
    isValid = false;
  } else if (password.length < 6) {
    $("#loginPasswordError")
      .text("✕ Password must be at least 6 characters")
      .show();
    isValid = false;
  } else {
    $("#loginPasswordError").hide();
  }

  if (!isValid) return;

  setLoadingState('#loginUserForm button[type="submit"]', true);
  try {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const response = await fetch("api.php?action=login", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (result.success) {
      const user = result.user;
      if (isAdmin && user.role !== "admin") {
        alert("You are not registered as an admin!");
        return;
      }

      appState.isLoggedIn = true;
      appState.isAdmin = isAdmin && user.role === "admin";
      appState.currentUser = user;
      saveToLocalStorage();
      document.activeElement.blur();
      await fetchDatabase(); // Refresh data with user context
      updateUIAfterLogin();
      $("#loginModal").modal("hide");
      showNotification(`Welcome back, ${user.name}!`);

      if (!window.location.pathname.includes("admin.php") && appState.isAdmin) {
        if (!confirm("Admin logged in. Go to Admin Panel?")) return;
        window.location.href = "admin.php";
      }
    } else {
      alert(result.message || "Invalid email or password!");
    }
  } catch (e) {
    console.error("Login error", e);
    alert("An error occurred during login.");
  } finally {
    setLoadingState('#loginUserForm button[type="submit"]', false);
  }
}

async function registerUser() {
  const name = ($("#registerName").val() || "").trim();
  const email = ($("#registerEmail").val() || "").trim();
  const phone = ($("#registerPhone").val() || "").trim();
  const password = $("#registerPassword").val() || "";
  const confirmPassword = $("#registerConfirmPassword").val() || "";

  let isValid = true;

  if (!name) {
    $("#registerNameError").text("✕ Name is required").show();
    isValid = false;
  } else if (name.length < 2) {
    $("#registerNameError").text("✕ Name must be at least 2 characters").show();
    isValid = false;
  } else {
    $("#registerNameError").hide();
  }

  if (!email) {
    $("#registerEmailError").text("✕ Email is required").show();
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $("#registerEmailError")
      .text("✕ Please enter a valid email address")
      .show();
    isValid = false;
  } else {
    $("#registerEmailError").hide();
  }

  if (!phone) {
    $("#registerPhoneError").text("✕ Phone number is required").show();
    isValid = false;
  } else if (!/^[0-9]{10}$/.test(phone)) {
    $("#registerPhoneError")
      .text("✕ Please enter a valid 10-digit phone number")
      .show();
    isValid = false;
  } else {
    $("#registerPhoneError").hide();
  }

  if (!password) {
    $("#registerPasswordError").text("✕ Password is required").show();
    isValid = false;
  } else if (password.length < 6) {
    $("#registerPasswordError")
      .text("✕ Password must be at least 6 characters")
      .show();
    isValid = false;
  } else {
    $("#registerPasswordError").hide();
  }

  if (!confirmPassword) {
    $("#registerConfirmPasswordError")
      .text("✕ Please confirm your password")
      .show();
    isValid = false;
  } else if (password !== confirmPassword) {
    $("#registerConfirmPasswordError").text("✕ Passwords do not match").show();
    isValid = false;
  } else {
    $("#registerConfirmPasswordError").hide();
  }

  if (!isValid) return;

  setLoadingState('#registerUserForm button[type="submit"]', true);
  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);

    const response = await fetch("api.php?action=register", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (result.success) {
      appState.isLoggedIn = true;
      appState.isAdmin = false;
      appState.currentUser = result.user;

      saveToLocalStorage();
      updateUIAfterLogin();
      $("#loginModal").modal("hide");
      showNotification(`Account created successfully! Welcome, ${name}!`);

      // Reset form and UI state
      $("#registerForm").addClass("d-none");
      $("#loginForm").removeClass("d-none");
      $("#registerUserForm")[0].reset();
      $(".text-danger.small").hide(); // Hide all error messages on reset
    } else {
      if (result.message === "Email already registered") {
        $("#registerEmailError").text("✕ Email already registered").show();
      } else {
        alert(result.message || "Registration failed!");
      }
    }
  } catch (e) {
    console.error("Registration error", e);
    alert("An error occurred during registration.");
  } finally {
    setLoadingState('#registerUserForm button[type="submit"]', false);
  }
}

async function sendForgotOtp() {
  const email = ($("#forgotEmail").val() || "").trim();
  let isValid = true;

  if (!email) {
    $("#forgotEmailError").text("✕ Email is required").show();
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $("#forgotEmailError").text("✕ Please enter a valid email address").show();
    isValid = false;
  } else {
    $("#forgotEmailError").hide();
  }
  if (!isValid) return;

  setLoadingState('#sendOtpBtn', true, 'Sending...');
  try {
    const formData = new FormData();
    formData.append("email", email);
    const response = await fetch("api.php?action=send_forgot_otp", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      forgotPasswordState.email = email;
      $("#forgotStepEmail").addClass("d-none");
      $("#forgotStepOtp").removeClass("d-none");
      showNotification("OTP sent to your registered email.");
    } else {
      $("#forgotEmailError").text(`✕ ${result.message || "Failed to send OTP"}`).show();
    }
  } catch (e) {
    console.error("send OTP error", e);
    $("#forgotEmailError").text("✕ Failed to send OTP").show();
  } finally {
    setLoadingState('#sendOtpBtn', false);
  }
}

async function resendForgotOtp() {
  const btn = $("#resendOtpBtn");
  if (btn.hasClass("disabled")) return;

  setLoadingState('#resendOtpBtn', true, 'Sending...');
  $("#forgotOtpError").hide();

  try {
    const formData = new FormData();
    formData.append("email", forgotPasswordState.email);
    const response = await fetch("api.php?action=send_forgot_otp", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      showNotification("OTP resent to your registered email.");
      let timeLeft = 60;
      setLoadingState('#resendOtpBtn', false);
      btn.text(`Resend OTP (${timeLeft}s)`).addClass("disabled").prop('disabled', true);
      if (resendOtpTimer) clearInterval(resendOtpTimer);
      resendOtpTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(resendOtpTimer);
          resendOtpTimer = null;
          btn.removeClass("disabled").prop('disabled', false).text("Resend OTP");
        } else {
          btn.text(`Resend OTP (${timeLeft}s)`);
        }
      }, 1000);
    } else {
      $("#forgotOtpError").text(`✕ ${result.message || "Failed to resend OTP"}`).show();
      setLoadingState('#resendOtpBtn', false);
    }
  } catch (e) {
    console.error("resend OTP error", e);
    $("#forgotOtpError").text("✕ Failed to resend OTP").show();
    setLoadingState('#resendOtpBtn', false);
  }
}

async function verifyForgotOtp() {
  const otp = ($("#forgotOtp").val() || "").trim();
  let isValid = true;

  if (!otp) {
    $("#forgotOtpError").text("✕ OTP is required").show();
    isValid = false;
  } else if (!/^[0-9]{6}$/.test(otp)) {
    $("#forgotOtpError").text("✕ OTP must be 6 digits").show();
    isValid = false;
  } else {
    $("#forgotOtpError").hide();
  }
  if (!isValid) return;

  try {
    const formData = new FormData();
    formData.append("email", forgotPasswordState.email);
    formData.append("otp", otp);
    const response = await fetch("api.php?action=verify_forgot_otp", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      $("#forgotPasswordModal").modal("hide");
      $("#newForgotPassword, #confirmForgotPassword").val("");
      $("#newForgotPasswordError, #confirmForgotPasswordError").hide();
      $("#resetPasswordModal").modal("show");
    } else {
      $("#forgotOtpError").text(`✕ ${result.message || "Invalid OTP"}`).show();
    }
  } catch (e) {
    console.error("verify OTP error", e);
    $("#forgotOtpError").text("✕ Failed to verify OTP").show();
  } finally {
    setLoadingState('#verifyOtpBtn', false);
  }
}

async function resetPasswordWithOtp() {
  const newPassword = $("#newForgotPassword").val() || "";
  const confirmPassword = $("#confirmForgotPassword").val() || "";
  let isValid = true;

  if (!newPassword) {
    $("#newForgotPasswordError").text("✕ New password is required").show();
    isValid = false;
  } else if (newPassword.length < 6) {
    $("#newForgotPasswordError")
      .text("✕ New password must be at least 6 characters")
      .show();
    isValid = false;
  } else {
    $("#newForgotPasswordError").hide();
  }

  if (!confirmPassword) {
    $("#confirmForgotPasswordError")
      .text("✕ Please confirm your new password")
      .show();
    isValid = false;
  } else if (newPassword !== confirmPassword) {
    $("#confirmForgotPasswordError").text("✕ Passwords do not match").show();
    isValid = false;
  } else {
    $("#confirmForgotPasswordError").hide();
  }

  if (!isValid) return;

  try {
    const formData = new FormData();
    formData.append("email", forgotPasswordState.email);
    formData.append("newPassword", newPassword);
    const response = await fetch("api.php?action=reset_password_with_otp", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      $("#resetPasswordModal").modal("hide");
      showNotification("Password updated successfully! Please login.");
      $("#loginModal").modal("show");
    } else {
      if (result.message && result.message.includes("different")) {
        $("#newForgotPasswordError").text(`✕ ${result.message}`).show();
      } else {
        $("#confirmForgotPasswordError")
          .text(`✕ ${result.message || "Failed to reset password"}`)
          .show();
      }
    }
  } catch (e) {
    console.error("reset password error", e);
    $("#confirmForgotPasswordError").text("✕ Failed to reset password").show();
  } finally {
    setLoadingState('#resetForgotPasswordBtn', false);
  }
}

function logout() {
  fetch("api.php?action=logout", { method: "POST" }).catch((e) =>
    console.error("Logout session clear failed", e),
  );

  appState.isLoggedIn = false;
  appState.isAdmin = false;
  appState.currentUser = null;
  appState.cart = [];
  appState.orderType = null;
  appState.dineInDetails = null;
  appState.appliedOffer = null;
  appState.discountAmount = 0;
  appState.discountPercent = 0;

  saveToLocalStorage();
  updateUIAfterLogout();
  showNotification("You have been logged out.");
}

function updateUIAfterLogin() {
  if (appState.isLoggedIn) {
    $("#loginBtn").addClass("d-none");
    $("#logoutBtn").removeClass("d-none");
    $("#profileBtn").removeClass("d-none");
    $("#profileNav").removeClass("d-none");

    if (appState.isAdmin) {
      $("#adminPanelBtn").removeClass("d-none");
    } else {
      $("#adminPanelBtn").addClass("d-none");
    }
  } else {
    $("#loginBtn").removeClass("d-none");
    $("#logoutBtn").addClass("d-none");
    $("#profileBtn").addClass("d-none");
    $("#profileNav").addClass("d-none");
    $("#adminPanelBtn").addClass("d-none");
  }

  loadFoodItems();
  updateCartCount();
}

function updateUIAfterLogout() {
  $("#loginBtn").removeClass("d-none");
  $("#logoutBtn").addClass("d-none");
  $("#profileBtn").addClass("d-none");
  $("#profileNav").addClass("d-none");
  $("#adminPanelBtn").addClass("d-none");

  loadFoodItems();
  updateCartCount();
  if (typeof hideAdminPanel === "function") hideAdminPanel();
  showSection("home");
}

function showLoginAlert() {
  alert("Please login to add items to cart!");
  $("#loginModal").modal("show");
}

// ==================== NOTIFICATION ====================
function showNotification(message) {
  $(".custom-notification").remove();
  const notification = $(`
        <div class="custom-notification position-fixed bottom-0 end-0 m-3 p-3 bg-success text-white rounded shadow-lg" style="z-index: 9999;">
            <div class="d-flex justify-content-between align-items-center">
                <span><i class="fas fa-check-circle me-2"></i>${message}</span>
                <button type="button" class="btn-close btn-close-white ms-2"></button>
            </div>
        </div>
    `);

  $("body").append(notification);
  setTimeout(() => notification.remove(), 3000);
  notification
    .find(".btn-close")
    .off("click")
    .click(() => notification.remove());
}

setTimeout(() => {
  if (typeof appState !== "undefined" && !appState.isLoggedIn)
    showNotification("Welcome to The Hungry House! Login to start ordering.");
}, 1000);
