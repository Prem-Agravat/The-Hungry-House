// ==================== ADMIN PANEL FUNCTIONS ====================
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;
let currentAdminSection = "dashboard";
let adminAutoRefreshTimer = null;
let tableStatusSyncTimer = null;
let adminCountdownTimer = null;
let adminActiveBookings = [];

function showAdminPanel() {
  if (
    window.location.pathname.includes("admin.php") ||
    detectCurrentSection() === "admin"
  ) {
    if (!appState.isAdmin) {
      alert("Please login as admin first");
      window.location.href = "index.php";
      return; // Stop execution if not admin
    }
    $("#contentArea").addClass("d-none");
    $(".footer").addClass("d-none");
    $("#adminPanel").removeClass("d-none");
    showAdminSection("dashboard");
    startAdminAutoRefresh();
    startTableStatusSync(); // Start automatic table status checking
  } else {
    window.location.href = "admin.php"; // Changed from admin.html to admin.php
  }
}

function hideAdminPanel() {
  $("#adminPanel").addClass("d-none");
  $("#contentArea").removeClass("d-none");
  $(".footer").removeClass("d-none");
  stopAdminAutoRefresh();
  stopTableStatusSync(); // Stop automatic table status checking
}

function showAdminSection(section) {
  currentAdminSection = section;
  $(".admin-section").addClass("d-none");
  $(`#admin${section.charAt(0).toUpperCase() + section.slice(1)}`).removeClass(
    "d-none",
  );

  const loaders = {
    dashboard: loadAdminDashboard,
    users: loadAdminUsers,
    foods: loadAdminFoods,
    orders: loadAdminOrders,
    tables: loadAdminTables,
    offers: loadAdminOffers,
    advancedBookings: loadAdminAdvanceBookings,
    reports: () => $("#reportResults").empty(),
  };

  if (loaders[section]) loaders[section]();
  refreshActiveAdminSection();
}

function startAdminAutoRefresh() {
  stopAdminAutoRefresh();
  adminAutoRefreshTimer = setInterval(async () => {
    if (!window.location.pathname.includes("admin.php")) return;
    await refreshActiveAdminSection();
  }, 30000);
}

function stopAdminAutoRefresh() {
  if (adminAutoRefreshTimer) {
    clearInterval(adminAutoRefreshTimer);
    adminAutoRefreshTimer = null;
  }
}


// ==================== AUTOMATIC TABLE STATUS SYNC ====================
function startTableStatusSync() {
  stopTableStatusSync();
  
  // Sync immediately on start
  syncTableStatusNow();
  
  // Then sync every 30 seconds
  tableStatusSyncTimer = setInterval(async () => {
    if (!window.location.pathname.includes("admin.php")) return;
    await syncTableStatusNow();
  }, 30000); // 30 seconds

  // Start countdown ticker every second for live timers
  if (adminCountdownTimer) clearInterval(adminCountdownTimer);
  adminCountdownTimer = setInterval(() => {
    updateAdminCountdownTimers();
  }, 1000);
}

function stopTableStatusSync() {
  if (tableStatusSyncTimer) {
    clearInterval(tableStatusSyncTimer);
    tableStatusSyncTimer = null;
  }
  if (adminCountdownTimer) {
    clearInterval(adminCountdownTimer);
    adminCountdownTimer = null;
  }
}

async function syncTableStatusNow() {
  try {
    const response = await fetch("api.php?action=sync_table_status");
    const result = await response.json();
    
    if (result.success) {
      // Update local database with synced table data
      if (result.tables) {
        database.tables = result.tables;
        saveToLocalStorage();
      }

      // Store active bookings for countdown display
      if (result.activeBookings) {
        adminActiveBookings = result.activeBookings;
      }
      
      // Refresh admin views if on relevant sections
      if (currentAdminSection === "dashboard") {
        loadAdminDashboard();
      } else if (currentAdminSection === "tables") {
        loadAdminTables();
      } else if (currentAdminSection === "advancedBookings") {
        loadAdminAdvanceBookings();
      }
      
      console.log("Table status synced at:", result.timestamp);
    }
  } catch (e) {
    console.error("Failed to sync table status", e);
  }
}

// Live countdown ticker for admin panel
function updateAdminCountdownTimers() {
  const now = new Date();
  $(".admin-countdown").each(function () {
    const endAt = new Date($(this).data("end-at"));
    const startAt = new Date($(this).data("start-at"));

    if (now >= startAt && now < endAt) {
      const remaining = endAt - now;
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      $(this).html(`<i class="fas fa-clock me-1"></i>${mins}m ${secs}s left`);
      $(this).removeClass("text-primary text-success").addClass("text-warning");
    } else if (now < startAt) {
      const untilStart = startAt - now;
      const mins = Math.floor(untilStart / 60000);
      if (mins < 60) {
        const secs = Math.floor((untilStart % 60000) / 1000);
        $(this).html(`<i class="fas fa-hourglass-start me-1"></i>In ${mins}m ${secs}s`);
      } else {
        const hrs = Math.floor(mins / 60);
        const remainMins = mins % 60;
        $(this).html(`<i class="fas fa-hourglass-start me-1"></i>In ${hrs}h ${remainMins}m`);
      }
      $(this).removeClass("text-warning text-success").addClass("text-primary");
    } else {
      $(this).html('<i class="fas fa-check-circle me-1"></i>Done');
      $(this).removeClass("text-warning text-primary").addClass("text-success");
    }
  });
}

async function refreshActiveAdminSection() {
  await fetchDatabase();
  const loaders = {
    dashboard: loadAdminDashboard,
    users: loadAdminUsers,
    foods: loadAdminFoods,
    orders: loadAdminOrders,
    tables: loadAdminTables,
    offers: loadAdminOffers,
    advancedBookings: loadAdminAdvanceBookings,
  };
  if (loaders[currentAdminSection]) loaders[currentAdminSection]();
}

function loadAdminDashboard() {
  $("#totalUsersCount").text(database.users ? database.users.length : 0);
  $("#totalOrdersCount").text(database.orders ? database.orders.length : 0);
  $("#totalDineInCount").text(
    database.orders
      ? database.orders.filter((o) => o && o.type === "dine-in").length
      : 0,
  );
  $("#totalDeliveryCount").text(
    database.orders
      ? database.orders.filter((o) => o && o.type === "delivery").length
      : 0,
  );

  const availableTables = database.tables
    ? database.tables.filter((t) => t && t.status === "available").length
    : 0;
  $("#availableTables").text(availableTables);
  $("#occupiedTables").text(
    database.tables ? database.tables.length - availableTables : 0,
  );

  const today = getCurrentDate();
  const todayRevenue = database.orders
    ? database.orders
        .filter((o) => o && isSameLocalDate(o.date, today))
        .reduce((sum, o) => sum + Number(o.total || 0), 0)
    : 0;
  $("#todayRevenue").text(Number(todayRevenue).toFixed(2));
  $("#totalRevenue").text(
    database.orders
      ? database.orders
          .reduce((sum, o) => sum + Number(o.total || 0), 0)
          .toFixed(2)
      : "0.00",
  );

  const recentOrders = $("#recentOrdersTable").empty();
  if (database.orders && database.orders.length > 0) {
    const recent = [...database.orders].reverse().slice(0, 5);
    recent.forEach((order) => {
      if (!order) return;
      const statusClass =
        {
          pending: "warning",
          preparing: "info",
          ready: "primary",
          delivered: "success",
          cancelled: "danger",
        }[order.status] || "secondary";

      recentOrders.append(`
                <tr>
                    <td>#${order.id || "N/A"}</td>
                    <td>${order.customerName || "N/A"}</td>
                    <td><span class="badge bg-primary">${order.type || "N/A"}</span></td>
                    <td class="rupee-symbol">${order.total ? Number(order.total).toFixed(2) : "0.00"}</td>
                    <td><span class="badge bg-${statusClass}">${order.status || "N/A"}</span></td>
                </tr>
            `);
    });
  } else {
    recentOrders.append(
      '<tr><td colspan="5" class="text-center">No orders found</td></tr>',
    );
  }

  const tablesStatus = $("#tablesStatusTable").empty();
  if (database.tables && database.tables.length > 0) {
    database.tables.forEach((table) => {
      if (!table) return;
      tablesStatus.append(`
                <tr>
                    <td>Table ${table.number || "?"}</td>
                    <td>${table.seats || 0}</td>
                    <td><span class="badge ${table.status === "available" ? "bg-success" : "bg-danger"}">${table.status || "unknown"}</span></td>
                    <td>${table.currentOrder ? `#ORD-${String(table.currentOrder).padStart(3, "0")}` : "-"}</td>
                </tr>
            `);
    });
  } else {
    tablesStatus.append(
      '<tr><td colspan="4" class="text-center">No tables found</td></tr>',
    );
  }
}

function loadAdminUsers() {
  const usersTable = $("#usersTable").empty();
  if (database.users && database.users.length > 0) {
    database.users.forEach((user) => {
      if (!user) return;
      usersTable.append(`
                <tr>
                    <td>${user.id || "?"}</td>
                    <td>${user.name || "N/A"}</td>
                    <td>${user.email || "N/A"}</td>
                    <td>${user.phone || "N/A"}</td>
                    <td><span class="badge ${user.role === "admin" ? "bg-danger" : "bg-primary"}">${user.role || "user"}</span></td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-user" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                        ${user.role !== "admin" ? `<button class="btn btn-sm btn-danger delete-user ms-1" data-id="${user.id}"><i class="fas fa-trash"></i></button>` : ""}
                    </td>
                </tr>
            `);
    });
  } else {
    usersTable.append(
      '<tr><td colspan="6" class="text-center">No users found</td></tr>',
    );
  }

  $(".edit-user")
    .off("click")
    .click(function () {
      const id = $(this).data("id");
      const user = database.users.find((u) => u && u.id === id);
      if (user) showUserModal(user);
    });

  $(".delete-user")
    .off("click")
    .click(function () {
      const id = $(this).data("id");
      deleteUser(id);
    });
}

function loadAdminFoods() {
  const foodsTable = $("#foodsTable").empty();
  if (database.foodItems && database.foodItems.length > 0) {
    database.foodItems.forEach((food) => {
      if (!food) return;
      foodsTable.append(`
                <tr>
                    <td>${food.id || "?"}</td>
                    <td>${food.name || "N/A"}</td>
                    <td><span class="badge ${getCategoryBadgeClass(food.category)}">${getCategoryDisplayName(food.category)}</span></td>
                    <td class="rupee-symbol">${Number(food.price || 0).toFixed(2)}</td>
                    <td>${food.offerPrice ? `<span class="rupee-symbol">${Number(food.offerPrice).toFixed(2)}</span>` : "N/A"}</td>
                    <td><span class="badge ${food.isAvailable ? "bg-success" : "bg-secondary"}">${food.isAvailable ? "Yes" : "No"}</span></td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-food" data-id="${food.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger delete-food ms-1" data-id="${food.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `);
    });
  } else {
    foodsTable.append(
      '<tr><td colspan="7" class="text-center">No food items found</td></tr>',
    );
  }

  $(".edit-food")
    .off("click")
    .click(function () {
      const id = $(this).data("id");
      const food = database.foodItems.find((f) => f && f.id === id);
      if (food) showFoodModal(food);
    });

  $(".delete-food")
    .off("click")
    .click(function () {
      const id = $(this).data("id");
      deleteFood(id);
    });
}

function loadAdminOrders() {
  const ordersTable = $("#ordersTable").empty();
  const typeFilter = $("#orderTypeFilter").val() || "all";
  const statusFilter = $("#orderStatusFilter").val() || "all";

  if (!database.orders || database.orders.length === 0) {
    ordersTable.append(
      '<tr><td colspan="9" class="text-center">No orders found</td></tr>',
    );
    return;
  }

  let filteredOrders = database.orders.filter((o) => o);
  if (typeFilter !== "all")
    filteredOrders = filteredOrders.filter((o) => o && o.type === typeFilter);
  if (statusFilter !== "all")
    filteredOrders = filteredOrders.filter(
      (o) => o && o.status === statusFilter,
    );

  filteredOrders.reverse().forEach((order) => {
    if (!order) return;
    const statusClass =
      {
        pending: "warning",
        preparing: "info",
        ready: "primary",
        delivered: "success",
        cancelled: "danger",
      }[order.status] || "secondary";
    const rating = parseInt(order.rating || 0, 10);
    const itemNames = Array.isArray(order.items)
      ? order.items.map((item) => item && item.name).filter(Boolean)
      : [];
    const itemsDisplay = itemNames.length
      ? `${itemNames.slice(0, 2).join(", ")}${itemNames.length > 2 ? ` +${itemNames.length - 2} more` : ""}`
      : `${order.items ? order.items.length : 0} items`;
    const ratingDisplay =
      rating > 0
        ? `<span class="text-warning">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>`
        : order.status === "delivered"
          ? '<span class="text-muted small">Waiting for user</span>'
          : '<span class="text-muted small">Not available</span>';

    ordersTable.append(`
            <tr>
                <td>#${order.id || "?"}</td>
                <td>${order.customerName || "N/A"}</td>
                <td><span class="badge bg-primary">${order.type || "N/A"}</span></td>
                <td class="small">${itemsDisplay}</td>
                <td class="rupee-symbol">${order.total ? Number(order.total).toFixed(2) : "0.00"}</td>
                <td><span id="orderStatusBadge-${order.id}" class="badge bg-${statusClass}">${order.status || "N/A"}</span></td>
                <td>${ratingDisplay}</td>
                <td>${order.date ? getFormattedDate(order.date) : "N/A"}</td>
                <td>
                    <button class="btn btn-sm btn-info view-order" data-id="${order.id}"><i class="fas fa-eye"></i></button>
                    <div class="btn-group ms-1">
                        <button id="orderStatusBtn-${order.id}" type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">Status</button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item update-status" href="#" data-id="${order.id}" data-status="pending">Pending</a></li>
                            <li><a class="dropdown-item update-status" href="#" data-id="${order.id}" data-status="preparing">Preparing</a></li>
                            <li><a class="dropdown-item update-status" href="#" data-id="${order.id}" data-status="ready">Ready</a></li>
                            <li><a class="dropdown-item update-status" href="#" data-id="${order.id}" data-status="delivered">Delivered</a></li>
                            <li><a class="dropdown-item update-status" href="#" data-id="${order.id}" data-status="cancelled">Cancelled</a></li>
                        </ul>
                    </div>
                </td>
            </tr>
        `);
  });

  // Add event listeners for filters
  $("#orderTypeFilter, #orderStatusFilter")
    .off("change")
    .on("change", loadAdminOrders);

  $(".update-status")
    .off("click")
    .click(function (e) {
      e.preventDefault();
      const orderId = $(this).data("id");
      const status = $(this).data("status");
      updateOrderStatus(orderId, status);
    });

  $(".view-order")
    .off("click")
    .click(function () {
      viewOrderDetails($(this).data("id"));
    });
}

function loadAdminTables() {
  const tablesGrid = $("#tablesGrid").empty();
  if (database.tables && database.tables.length > 0) {
    const now = new Date();
    database.tables.forEach((table) => {
      if (!table) return;

      // Find active booking for this table
      const activeBooking = adminActiveBookings.find(
        (b) =>
          b &&
          parseInt(b.tableId) === parseInt(table.id) &&
          b.status === "confirmed" &&
          new Date(b.startAt) <= now &&
          new Date(b.endAt) > now,
      );

      // Find upcoming booking for this table
      const upcomingBooking = adminActiveBookings.find(
        (b) =>
          b &&
          parseInt(b.tableId) === parseInt(table.id) &&
          b.status === "confirmed" &&
          new Date(b.startAt) > now,
      );

      let bookingInfo = "";
      if (activeBooking) {
        bookingInfo = `
          <div class="mt-2 p-2 bg-warning bg-opacity-10 rounded">
            <div class="small fw-bold text-warning mb-1">
              <i class="fas fa-user me-1"></i>${activeBooking.userName || "Guest"}
            </div>
            <div class="small text-muted">Duration: ${activeBooking.durationMinutes} min</div>
            <div class="admin-countdown fw-bold mt-1"
                 data-start-at="${activeBooking.startAt}"
                 data-end-at="${activeBooking.endAt}">
              <i class="fas fa-clock me-1"></i>Calculating...
            </div>
          </div>
        `;
      } else if (upcomingBooking) {
        bookingInfo = `
          <div class="mt-2 p-2 bg-info bg-opacity-10 rounded">
            <div class="small fw-bold text-info mb-1">
              <i class="fas fa-calendar-check me-1"></i>Upcoming Booking
            </div>
            <div class="small text-muted">${upcomingBooking.userName || "Guest"} · ${upcomingBooking.durationMinutes} min</div>
            <div class="admin-countdown fw-bold mt-1 text-primary"
                 data-start-at="${upcomingBooking.startAt}"
                 data-end-at="${upcomingBooking.endAt}">
              <i class="fas fa-hourglass-start me-1"></i>Calculating...
            </div>
          </div>
        `;
      }

      tablesGrid.append(`
                <div class="col-md-4 mb-3">
                    <div class="card ${table.status === "available" ? "border-success table-available" : "border-danger table-occupied"}">
                        <div class="card-body">
                            <h5 class="card-title">Table ${table.number || "?"}</h5>
                            <p><i class="fas fa-chair me-2"></i>${table.seats || 0} Seats</p>
                            <p class="mb-2">Status: <span class="badge ${table.status === "available" ? "bg-success" : "bg-danger"}">${table.status || "unknown"}</span></p>
                            ${table.status === "occupied" && table.currentOrder ? `<p class="small">Current Order: #ORD-${String(table.currentOrder).padStart(3, "0")}</p>` : ""}
                            ${bookingInfo}
                            <button class="btn btn-sm btn-warning edit-table mt-2" data-id="${table.id}"><i class="fas fa-edit"></i> Edit</button>
                        </div>
                    </div>
                </div>
            `);
    });
  } else {
    tablesGrid.append('<div class="col-12 text-center">No tables found</div>');
  }

  $(".edit-table")
    .off("click")
    .click(function () {
      const id = $(this).data("id");
      const table = database.tables.find((t) => t && t.id === id);
      if (table) showTableModal(table);
    });
}

function loadAdminOffers() {
  const offersTable = $("#offersTable").empty();
  if (database.offers && database.offers.length > 0) {
    database.offers.forEach((offer) => {
      if (!offer) return;
      offersTable.append(`
                <tr>
                    <td>${offer.id || "?"}</td>
                    <td>${offer.title || "N/A"}</td>
                    <td><span class="badge bg-info">${offer.code || "N/A"}</span></td>
                    <td>${offer.discount || 0}%</td>
                    <td>${offer.validUntil ? getFormattedDate(offer.validUntil) : "N/A"}</td>
                    <td><span class="badge ${offer.isActive ? "bg-success" : "bg-secondary"}">${offer.isActive ? "Yes" : "No"}</span></td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-offer" data-id="${offer.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger delete-offer ms-1" data-id="${offer.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `);
    });
  } else {
    offersTable.append(
      '<tr><td colspan="7" class="text-center">No offers found</td></tr>',
    );
  }

  $(".edit-offer")
    .off("click")
    .click(function () {
      const id = $(this).data("id");
      const offer = database.offers.find((o) => o && o.id === id);
      if (offer) showOfferModal(offer);
    });

  $(".delete-offer")
    .off("click")
    .click(function () {
      const id = $(this).data("id");
      deleteOffer(id);
    });
}

async function loadAdminAdvanceBookings() {
  const tableBody = $("#advanceBookingsTable");

  try {
    const response = await fetch("api.php?action=get_all_advance_bookings");
    const result = await response.json();

    tableBody.empty();

    if (!result.success) {
      tableBody.append(
        `<tr><td colspan="9" class="text-center text-danger">${result.message || "Failed to load advanced bookings"}</td></tr>`,
      );
      return;
    }

    const bookings = Array.isArray(result.bookings) ? result.bookings : [];
    if (bookings.length === 0) {
      tableBody.append(
        '<tr><td colspan="9" class="text-center">No advanced bookings found</td></tr>',
      );
      return;
    }

    const now = new Date();

    bookings.forEach((booking) => {
      const startAt = new Date(booking.startAt);
      const endAt = new Date(booking.endAt);

      let statusClass, statusText;
      if (booking.status === "cancelled") {
        statusClass = "danger";
        statusText = "Cancelled";
      } else if (booking.status === "completed") {
        statusClass = "success";
        statusText = "Completed";
      } else if (now >= startAt && now < endAt) {
        statusClass = "warning";
        statusText = "OCCUPIED";
      } else if (now < startAt) {
        statusClass = "info";
        statusText = "Upcoming";
      } else {
        statusClass = "success";
        statusText = "Completed";
      }

      // Time remaining / countdown column
      let countdownHtml = "-";
      if (booking.status === "confirmed") {
        countdownHtml = `<span class="admin-countdown fw-bold" data-start-at="${booking.startAt}" data-end-at="${booking.endAt}"><i class="fas fa-spinner fa-spin"></i></span>`;
      }

      tableBody.append(`
        <tr>
          <td>${booking.id}</td>
          <td>${booking.userName || "N/A"}</td>
          <td>
            <div>${booking.userEmail || "-"}</div>
            <small class="text-muted">${booking.userPhone || "-"}</small>
          </td>
          <td>Table ${booking.tableNumber} (${booking.tableSeats} seats)</td>
          <td>${booking.bookingDate || "-"}</td>
          <td>${booking.bookingTime || "-"}</td>
          <td>${booking.durationMinutes || 0} min</td>
          <td><span class="badge bg-${statusClass}">${statusText}</span></td>
          <td>${countdownHtml}</td>
        </tr>
      `);
    });
  } catch (e) {
    console.error("Failed to load advanced bookings", e);
    tableBody.append(
      '<tr><td colspan="9" class="text-center text-danger">Error loading advanced bookings</td></tr>',
    );
  }
}

function generateSalesReport() {
  if (!database.orders || database.orders.length === 0) {
    $("#reportResults").html(
      '<div class="alert alert-info">No orders found to generate report</div>',
    );
    return;
  }

  const totalRevenue = database.orders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0,
  );
  const totalOrders = database.orders.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const dineIn = database.orders.filter(
    (o) => o && o.type === "dine-in",
  ).length;
  const delivery = database.orders.filter(
    (o) => o && o.type === "delivery",
  ).length;

  $("#reportResults").html(`
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Sales Report</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3 mb-3">
                        <div class="card bg-primary text-white stats-card">
                            <div class="card-body">
                                <h6>Total Revenue</h6>
                                <h4 class="rupee-symbol">${Number(totalRevenue).toFixed(2)}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card bg-success text-white stats-card">
                            <div class="card-body">
                                <h6>Total Orders</h6>
                                <h4>${totalOrders}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card bg-info text-white stats-card">
                            <div class="card-body">
                                <h6>Avg Order Value</h6>
                                <h4 class="rupee-symbol">${Number(avgOrder).toFixed(2)}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card bg-warning text-dark stats-card">
                            <div class="card-body">
                                <h6>Dine-in/Delivery</h6>
                                <h4>${dineIn}/${delivery}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

function viewPopularItems() {
  if (!database.orders || database.orders.length === 0) {
    $("#reportResults").html(
      '<div class="alert alert-info">No orders found to generate popular items</div>',
    );
    return;
  }

  const itemCounts = {};
  database.orders.forEach((order) => {
    if (order && order.items) {
      order.items.forEach((item) => {
        if (!item || !item.name) return;
        if (!itemCounts[item.name])
          itemCounts[item.name] = { quantity: 0, revenue: 0 };
        itemCounts[item.name].quantity += item.quantity || 0;
        itemCounts[item.name].revenue +=
          (item.quantity || 0) * (item.price || 0);
      });
    }
  });

  let html = `<div class="card"><div class="card-header bg-success text-white"><h5 class="mb-0">Popular Items</h5></div><div class="card-body"><table class="table"><thead><tr><th>Item</th><th>Quantity Sold</th><th>Revenue</th></tr></thead><tbody>`;

  if (Object.keys(itemCounts).length > 0) {
    Object.entries(itemCounts)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .forEach(([item, data]) => {
        html += `<tr><td>${item}</td><td>${data.quantity}</td><td class="rupee-symbol">${Number(data.revenue).toFixed(2)}</td></tr>`;
      });
  } else {
    html += `<tr><td colspan="3" class="text-center">No items found</td></tr>`;
  }

  html += `</tbody></table></div></div>`;
  $("#reportResults").html(html);
}

function viewOccupancy() {
  if (!database.tables || database.tables.length === 0) {
    $("#reportResults").html(
      '<div class="alert alert-info">No tables found</div>',
    );
    return;
  }

  const occupiedTables = database.tables.filter(
    (t) => t && t.status === "occupied",
  );
  let html = `<div class="card"><div class="card-header bg-warning text-dark"><h5 class="mb-0">Table Occupancy Report</h5></div><div class="card-body"><div class="row"><div class="col-md-6"><h6>Current Status</h6><p>Available Tables: ${database.tables.filter((t) => t && t.status === "available").length}</p><p>Occupied Tables: ${occupiedTables.length}</p></div><div class="col-md-6"><h6>Occupied Tables Details</h6>`;

  if (occupiedTables.length > 0) {
    html += `<ul class="list-group">`;
    occupiedTables.forEach((table) => {
      if (!table) return;
      const order = database.orders
        ? database.orders.find((o) => o && o.id === table.currentOrder)
        : null;
      html += `<li class="list-group-item">Table ${table.number || "?"} - Order #ORD-${table.currentOrder ? String(table.currentOrder).padStart(3, "0") : "?"} - ${order ? order.customerName : "Unknown"}</li>`;
    });
    html += `</ul>`;
  } else {
    html += `<p class="text-muted">No tables occupied</p>`;
  }

  html += `</div></div></div></div>`;
  $("#reportResults").html(html);
}

async function updateOrderStatus(orderId, status) {
  const btn = $(`#orderStatusBtn-${orderId}`);
  const badge = $(`#orderStatusBadge-${orderId}`);
  btn.prop('disabled', true);
  badge.css('opacity', '0.5');
  
  try {
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("status", status);

    const response = await fetch("api.php?action=update_order_status", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (result.success) {
      await fetchDatabase();
      loadAdminOrders();
      loadAdminDashboard();
      showNotification(`Order status updated to ${status}`);
    } else {
      alert("Failed to update status");
      btn.prop('disabled', false);
      badge.css('opacity', '1');
    }
  } catch (e) {
    console.error("Error updating status", e);
    btn.prop('disabled', false);
    badge.css('opacity', '1');
  }
}

function viewOrderDetails(orderId) {
  if (!database.orders) return;
  const order = database.orders.find((o) => o && o.id === orderId);
  if (!order) return;

  let details = `<h5>Order #${order.id || "?"}</h5>`;
  details += `<p><strong>Customer:</strong> ${order.customerName || "N/A"}</p>`;
  details += `<p><strong>Date:</strong> ${order.date ? getFormattedDate(order.date) : "N/A"}</p>`;
  details += `<p><strong>Status:</strong> ${order.status || "N/A"}</p>`;
  details += `<p><strong>Payment:</strong> ${order.paymentMethod || "N/A"}</p>`;
  if (order.rating) {
    details += `<p><strong>Rating:</strong> <span class="text-warning">${"★".repeat(parseInt(order.rating, 10))}${"☆".repeat(5 - parseInt(order.rating, 10))}</span></p>`;
    if (order.ratingComment) {
      details += `<p><strong>Review:</strong> ${order.ratingComment}</p>`;
    }
  } else {
    details += `<p><strong>Rating:</strong> Not rated yet</p>`;
  }

  if (order.type === "dine-in") {
    details += `<p><strong>Table:</strong> ${order.tableNumber || "N/A"}</p>`;
    details += `<p><strong>Guests:</strong> ${order.numberOfGuests || "N/A"}</p>`;
  } else {
    details += `<p><strong>Address:</strong> ${order.address || "N/A"}</p>`;
  }

  details += `<h6 class="mt-3">Items:</h6><ul class="list-group">`;
  if (order.items && order.items.length > 0) {
    order.items.forEach((item) => {
      if (!item) return;
      details += `<li class="list-group-item d-flex justify-content-between align-items-center">
                ${item.name || "Item"} x${item.quantity || 0}
                <span class="rupee-symbol">${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}</span>
            </li>`;
    });
  }
  details += `</ul><h5 class="mt-3 text-end rupee-symbol">Total: ${Number(order.total || 0).toFixed(2)}</h5>`;

  $("#orderDetailsModal").remove();
  $("body").append(`
        <div class="modal fade" id="orderDetailsModal" tabindex="-1">
            <div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-info text-white"><h5 class="modal-title">Order Details</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">${details}</div>
                <div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button></div>
            </div></div>
        </div>
    `);
  new bootstrap.Modal(document.getElementById("orderDetailsModal")).show();
}

// ==================== CRUD OPERATIONS ====================
function showUserModal(user = null) {
  const isEdit = user !== null;
  const modalId = "userModal";

  $("#" + modalId).remove();
  $("body").append(`
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-primary text-white"><h5 class="modal-title">${isEdit ? "Edit User" : "Add New User"}</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <form id="userForm" novalidate>
                        <div class="mb-3"><label class="form-label">Full Name</label><input type="text" class="form-control" id="userName" value="${isEdit ? user.name || "" : ""}"><div id="userNameError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="mb-3"><label class="form-label">Email</label><input type="text" class="form-control" id="userEmail" value="${isEdit ? user.email || "" : ""}"><div id="userEmailError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="mb-3"><label class="form-label">${isEdit ? "New Password (leave blank to keep current)" : "Password"}</label><input type="password" class="form-control" id="userPassword"><div id="userPasswordError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="mb-3"><label class="form-label">Phone (10 digits)</label><input type="text" class="form-control" id="userPhone" value="${isEdit ? user.phone || "" : ""}"><div id="userPhoneError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="mb-3"><label class="form-label">Role</label>
                            <select class="form-control" id="userRole" ${user && user.id === 1 ? "disabled" : ""}>
                                <option value="user" ${isEdit && user.role === "user" ? "selected" : ""}>User</option>
                                <option value="admin" ${isEdit && user.role === "admin" ? "selected" : ""}>Admin</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveUserBtn">Save</button>
                </div>
            </div></div>
        </div>
    `);

  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  $("#userForm input").on("input", function () {
    const fieldId = $(this).attr("id");
    $(`#${fieldId}Error`).hide();
  });

  $("#saveUserBtn")
    .off("click")
    .click(async () => {
      const name = $("#userName").val().trim();
      const email = $("#userEmail").val().trim();
      const password = $("#userPassword").val();
      const phone = $("#userPhone").val().trim();
      const role = $("#userRole").val();

      let isValid = true;

      if (!name) {
        $("#userNameError").text("✕ Name is required").show();
        isValid = false;
      } else if (name.length < 2) {
        $("#userNameError").text("✕ Name must be at least 2 characters").show();
        isValid = false;
      } else {
        $("#userNameError").hide();
      }

      if (!email) {
        $("#userEmailError").text("✕ Email is required").show();
        isValid = false;
      } else if (!emailRegex.test(email)) {
        $("#userEmailError").text("✕ Please enter a valid email address").show();
        isValid = false;
      } else {
        $("#userEmailError").hide();
      }

      if (!phone) {
        $("#userPhoneError").text("✕ Phone number is required").show();
        isValid = false;
      } else if (!phoneRegex.test(phone)) {
        $("#userPhoneError")
          .text("✕ Please enter a valid 10-digit phone number")
          .show();
        isValid = false;
      } else {
        $("#userPhoneError").hide();
      }

      if (!isEdit && !password) {
        $("#userPasswordError").text("✕ Password is required").show();
        isValid = false;
      } else if (password && password.length < 6) {
        $("#userPasswordError")
          .text("✕ Password must be at least 6 characters")
          .show();
        isValid = false;
      } else {
        $("#userPasswordError").hide();
      }

      if (!isValid) return;

      const userData = {
        id: isEdit ? user.id : null,
        name,
        email,
        password: password || (isEdit ? null : "default123"),
        phone,
        role,
      };

      setLoadingState('#saveUserBtn', true, 'Saving...');
      try {
        const response = await fetch("api.php?action=save_user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        const result = await response.json();
        if (result.success) {
          await fetchDatabase();
          bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
          loadAdminUsers();
          showNotification(
            `User ${isEdit ? "updated" : "added"} successfully!`,
          );
        } else {
          alert("Failed to save user");
        }
      } catch (e) {
        console.error("Error saving user", e);
      } finally {
        setLoadingState('#saveUserBtn', false);
      }
    });
}

async function deleteUser(userId) {
  if (userId === 1) return alert("Cannot delete the main admin user!");
  if (confirm("Are you sure?")) {
    setLoadingState(`.delete-user[data-id="${userId}"]`, true, 'Deleting...');
    try {
      const formData = new FormData();
      formData.append("id", userId);
      const response = await fetch("api.php?action=delete_user", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        await fetchDatabase();
        loadAdminUsers();
        showNotification("User deleted successfully!");
      } else {
        alert(result.message || "Failed to delete user");
      }
    } catch (e) {
      console.error("Error deleting user", e);
    } finally {
      setLoadingState(`.delete-user[data-id="${userId}"]`, false);
    }
  }
}

function showFoodModal(food = null) {
  const isEdit = food !== null;
  const modalId = "foodModal";

  $("#" + modalId).remove();
  $("body").append(`
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-primary text-white"><h5 class="modal-title">${isEdit ? "Edit Food Item" : "Add New Food Item"}</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <form id="foodForm" novalidate>
                        <div class="mb-3"><label class="form-label">Food Name</label><input type="text" class="form-control" id="foodName" value="${isEdit ? food.name || "" : ""}"><div id="foodNameError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="mb-3"><label class="form-label">Description</label><textarea class="form-control" id="foodDescription" rows="2">${isEdit ? food.description || "" : ""}</textarea><div id="foodDescriptionError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="row">
                            <div class="col-md-6 mb-3"><label class="form-label">Price (₹)</label><input type="number" class="form-control" id="foodPrice" step="1" min="1" value="${isEdit ? food.price || "" : ""}"><div id="foodPriceError" class="text-danger small mt-1" style="display:none;"></div></div>
                            <div class="col-md-6 mb-3"><label class="form-label">Offer Price (₹)</label><input type="number" class="form-control" id="foodOfferPrice" step="1" min="1" value="${isEdit ? food.offerPrice || "" : ""}"><div id="foodOfferPriceError" class="text-danger small mt-1" style="display:none;"></div></div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3"><label class="form-label">Category</label>
                                <select class="form-control" id="foodCategory">
                                    <option value="starters" ${isEdit && food.category === "starters" ? "selected" : ""}>Starters</option>
                                    <option value="main-course" ${isEdit && food.category === "main-course" ? "selected" : ""}>Main Course</option>
                                    <option value="breads" ${isEdit && food.category === "breads" ? "selected" : ""}>Breads</option>
                                    <option value="desserts" ${isEdit && food.category === "desserts" ? "selected" : ""}>Desserts</option>
                                </select>
                                <div id="foodCategoryError" class="text-danger small mt-1" style="display:none;"></div>
                            </div>
                            <div class="col-md-6 mb-3"><label class="form-label">Image URL</label><input type="text" class="form-control" id="foodImage" value="${isEdit ? food.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38" : "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"}"><div id="foodImageError" class="text-danger small mt-1" style="display:none;"></div></div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3"><div class="form-check"><input class="form-check-input" type="checkbox" id="foodIsAvailable" ${isEdit && food.isAvailable ? "checked" : "checked"}><label class="form-check-label">Available</label></div></div>
                            <div class="col-md-6 mb-3"><div class="form-check"><input class="form-check-input" type="checkbox" id="foodIsOffer" ${isEdit && food.isOffer ? "checked" : ""}><label class="form-check-label">Has Offer</label></div></div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveFoodBtn">Save</button>
                </div>
            </div></div>
        </div>
    `);

  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  $("#foodForm input, #foodForm textarea, #foodForm select").on(
    "input change",
    function () {
      const fieldId = $(this).attr("id");
      $(`#${fieldId}Error`).hide();
    },
  );

  $("#saveFoodBtn")
    .off("click")
    .click(async () => {
      const name = $("#foodName").val().trim();
      const description = $("#foodDescription").val().trim();
      const price = parseInt($("#foodPrice").val()) || 0;
      const offerPrice = $("#foodOfferPrice").val()
        ? parseInt($("#foodOfferPrice").val())
        : null;
      const category = $("#foodCategory").val();
      const image = $("#foodImage").val().trim();
      const isAvailable = $("#foodIsAvailable").is(":checked");
      const isOffer = $("#foodIsOffer").is(":checked");

      let isValid = true;

      if (!name) {
        $("#foodNameError").text("✕ Name is required").show();
        isValid = false;
      } else if (name.length < 2) {
        $("#foodNameError").text("✕ Name must be at least 2 characters").show();
        isValid = false;
      } else {
        $("#foodNameError").hide();
      }

      if (!description) {
        $("#foodDescriptionError").text("✕ Description is required").show();
        isValid = false;
      } else if (description.length < 6) {
        $("#foodDescriptionError")
          .text("✕ Description must be at least 6 characters")
          .show();
        isValid = false;
      } else {
        $("#foodDescriptionError").hide();
      }

      if (!price) {
        $("#foodPriceError").text("✕ Price is required").show();
        isValid = false;
      } else if (price < 1) {
        $("#foodPriceError").text("✕ Price must be at least 1").show();
        isValid = false;
      } else {
        $("#foodPriceError").hide();
      }

      if (offerPrice !== null && offerPrice < 1) {
        $("#foodOfferPriceError")
          .text("✕ Offer price must be at least 1")
          .show();
        isValid = false;
      } else if (offerPrice !== null && offerPrice >= price) {
        $("#foodOfferPriceError")
          .text("✕ Offer price must be less than regular price")
          .show();
        isValid = false;
      } else {
        $("#foodOfferPriceError").hide();
      }

      if (!category) {
        $("#foodCategoryError").text("✕ Category is required").show();
        isValid = false;
      } else {
        $("#foodCategoryError").hide();
      }

      if (!image) {
        $("#foodImageError").text("✕ Image URL is required").show();
        isValid = false;
      } else {
        $("#foodImageError").hide();
      }

      if (!isValid) return;

      const foodData = {
        id: isEdit ? food.id : null,
        name,
        description,
        price,
        offerPrice,
        category,
        image,
        isAvailable: isAvailable ? 1 : 0,
        isOffer: isOffer ? 1 : 0,
      };

      setLoadingState('#saveFoodBtn', true, 'Saving...');
      try {
        const response = await fetch("api.php?action=save_food", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(foodData),
        });
        const result = await response.json();
        if (result.success) {
          await fetchDatabase();
          bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
          loadAdminFoods();
          loadFoodItems();
          showNotification(
            `Food item ${isEdit ? "updated" : "added"} successfully!`,
          );
        } else {
          alert("Failed to save food item");
        }
      } catch (e) {
        console.error("Error saving food", e);
      } finally {
        setLoadingState('#saveFoodBtn', false);
      }
    });
}

async function deleteFood(foodId) {
  if (confirm("Are you sure?")) {
    setLoadingState(`.delete-food[data-id="${foodId}"]`, true, 'Deleting...');
    try {
      const formData = new FormData();
      formData.append("id", foodId);
      const response = await fetch("api.php?action=delete_food", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        await fetchDatabase();
        loadAdminFoods();
        loadFoodItems();
        showNotification("Food item deleted successfully!");
      } else {
        alert("Failed to delete food item");
      }
    } catch (e) {
      console.error("Error deleting food", e);
    } finally {
      setLoadingState(`.delete-food[data-id="${foodId}"]`, false);
    }
  }
}

function showOfferModal(offer = null) {
  const isEdit = offer !== null;
  const modalId = "offerModal";

  $("#" + modalId).remove();
  $("body").append(`
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-primary text-white"><h5 class="modal-title">${isEdit ? "Edit Offer" : "Add New Offer"}</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <form id="offerForm" novalidate>
                        <div class="mb-3"><label class="form-label">Title</label><input type="text" class="form-control" id="offerTitle" value="${isEdit ? offer.title || "" : ""}"><div id="offerTitleError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="mb-3"><label class="form-label">Description</label><textarea class="form-control" id="offerDescription" rows="2">${isEdit ? offer.description || "" : ""}</textarea><div id="offerDescriptionError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="row">
                            <div class="col-md-6 mb-3"><label class="form-label">Code</label><input type="text" class="form-control" id="offerCode" value="${isEdit ? offer.code || "" : ""}"><div id="offerCodeError" class="text-danger small mt-1" style="display:none;"></div></div>
                            <div class="col-md-6 mb-3"><label class="form-label">Discount (%)</label><input type="number" class="form-control" id="offerDiscount" min="1" max="100" value="${isEdit ? offer.discount || "" : ""}"><div id="offerDiscountError" class="text-danger small mt-1" style="display:none;"></div></div>
                        </div>
                        <div class="mb-3"><label class="form-label">Valid Until</label><input type="date" class="form-control" id="offerValidUntil" value="${isEdit ? offer.validUntil || "" : ""}"><div id="offerValidUntilError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="mb-3"><div class="form-check"><input class="form-check-input" type="checkbox" id="offerIsActive" ${isEdit && offer.isActive ? "checked" : "checked"}><label class="form-check-label">Active</label></div></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveOfferBtn">Save</button>
                </div>
            </div></div>
        </div>
    `);

  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  $("#offerForm input, #offerForm textarea").on("input change", function () {
    const fieldId = $(this).attr("id");
    $(`#${fieldId}Error`).hide();
  });

  $("#saveOfferBtn")
    .off("click")
    .click(async () => {
      const title = $("#offerTitle").val().trim();
      const description = $("#offerDescription").val().trim();
      const code = $("#offerCode").val().trim().toUpperCase();
      const discount = parseInt($("#offerDiscount").val()) || 0;
      const validUntil = $("#offerValidUntil").val();
      const isActive = $("#offerIsActive").is(":checked");

      let isValid = true;

      if (!title) {
        $("#offerTitleError").text("✕ Title is required").show();
        isValid = false;
      } else if (title.length < 2) {
        $("#offerTitleError")
          .text("✕ Title must be at least 2 characters")
          .show();
        isValid = false;
      } else {
        $("#offerTitleError").hide();
      }

      if (!description) {
        $("#offerDescriptionError").text("✕ Description is required").show();
        isValid = false;
      } else if (description.length < 6) {
        $("#offerDescriptionError")
          .text("✕ Description must be at least 6 characters")
          .show();
        isValid = false;
      } else {
        $("#offerDescriptionError").hide();
      }

      if (!code) {
        $("#offerCodeError").text("✕ Code is required").show();
        isValid = false;
      } else if (code.length < 3) {
        $("#offerCodeError").text("✕ Code must be at least 3 characters").show();
        isValid = false;
      } else {
        $("#offerCodeError").hide();
      }

      if (!discount) {
        $("#offerDiscountError").text("✕ Discount is required").show();
        isValid = false;
      } else if (discount < 1 || discount > 100) {
        $("#offerDiscountError")
          .text("✕ Discount must be between 1 and 100")
          .show();
        isValid = false;
      } else {
        $("#offerDiscountError").hide();
      }

      if (!validUntil) {
        $("#offerValidUntilError").text("✕ Valid until date is required").show();
        isValid = false;
      } else {
        $("#offerValidUntilError").hide();
      }

      if (!isValid) return;

      const offerData = {
        id: isEdit ? offer.id : null,
        title,
        description,
        code,
        discount,
        validUntil,
        isActive: isActive ? 1 : 0,
      };

      setLoadingState('#saveOfferBtn', true, 'Saving...');
      try {
        const response = await fetch("api.php?action=save_offer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(offerData),
        });
        const result = await response.json();
        if (result.success) {
          await fetchDatabase();
          bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
          loadAdminOffers();
          loadOffers();
          showNotification(
            `Offer ${isEdit ? "updated" : "added"} successfully!`,
          );
        } else {
          alert("Failed to save offer");
        }
      } catch (e) {
        console.error("Error saving offer", e);
      } finally {
        setLoadingState('#saveOfferBtn', false);
      }
    });
}

async function deleteOffer(offerId) {
  if (confirm("Are you sure?")) {
    setLoadingState(`.delete-offer[data-id="${offerId}"]`, true, 'Deleting...');
    try {
      const formData = new FormData();
      formData.append("id", offerId);
      const response = await fetch("api.php?action=delete_offer", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        await fetchDatabase();
        loadAdminOffers();
        loadOffers();
        showNotification("Offer deleted successfully!");
      } else {
        alert("Failed to delete offer");
      }
    } catch (e) {
      console.error("Error deleting offer", e);
    } finally {
      setLoadingState(`.delete-offer[data-id="${offerId}"]`, false);
    }
  }
}

function showTableModal(table = null) {
  const isEdit = table !== null;
  const modalId = "tableModal";

  $("#" + modalId).remove();
  $("body").append(`
        <div class="modal fade" id="${modalId}" tabindex="-1">
            <div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-primary text-white"><h5 class="modal-title">${isEdit ? "Edit Table" : "Add New Table"}</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <form id="tableForm" novalidate>
                        <div class="mb-3"><label class="form-label">Table Number</label><input type="number" class="form-control" id="adminTableNumber" min="1" value="${isEdit ? table.number || "" : ""}"><div id="adminTableNumberError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="mb-3"><label class="form-label">Number of Seats</label><input type="number" class="form-control" id="adminTableSeats" min="1" max="10" value="${isEdit ? table.seats || "4" : "4"}"><div id="adminTableSeatsError" class="text-danger small mt-1" style="display:none;"></div></div>
                        <div class="mb-3"><label class="form-label">Status</label>
                            <select class="form-control" id="adminTableStatus">
                                <option value="available" ${isEdit && table.status === "available" ? "selected" : ""}>Available</option>
                                <option value="occupied" ${isEdit && table.status === "occupied" ? "selected" : ""}>Occupied</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveTableBtn">Save</button>
                </div>
            </div></div>
        </div>
    `);

  const modal = new bootstrap.Modal(document.getElementById(modalId));
  modal.show();

  $("#tableForm input").on("input", function () {
    const fieldId = $(this).attr("id");
    $(`#${fieldId}Error`).hide();
  });

  $("#saveTableBtn")
    .off("click")
    .click(async () => {
      const number = parseInt($("#adminTableNumber").val()) || 0;
      const seats = parseInt($("#adminTableSeats").val()) || 0;
      const status = $("#adminTableStatus").val();

      let isValid = true;

      if (!number) {
        $("#adminTableNumberError").text("✕ Table number is required").show();
        isValid = false;
      } else if (number < 1) {
        $("#adminTableNumberError")
          .text("✕ Table number must be at least 1")
          .show();
        isValid = false;
      } else {
        $("#adminTableNumberError").hide();
      }

      if (!seats) {
        $("#adminTableSeatsError").text("✕ Number of seats is required").show();
        isValid = false;
      } else if (seats < 1 || seats > 10) {
        $("#adminTableSeatsError")
          .text("✕ Number of seats must be between 1 and 10")
          .show();
        isValid = false;
      } else {
        $("#adminTableSeatsError").hide();
      }

      if (!isValid) return;

      const tableData = {
        id: isEdit ? table.id : null,
        number,
        seats,
        status,
      };

      setLoadingState('#saveTableBtn', true, 'Saving...');
      try {
        const response = await fetch("api.php?action=save_table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tableData),
        });
        const result = await response.json();
        if (result.success) {
          await fetchDatabase();
          await syncTableStatusNow(); // Refresh active bookings data
          bootstrap.Modal.getInstance(document.getElementById(modalId)).hide();
          loadAdminTables();
          loadAdminDashboard();
          showNotification(
            `Table ${isEdit ? "updated" : "added"} successfully!`,
          );
        } else {
          alert("Failed to save table");
        }
      } catch (e) {
        console.error("Error saving table", e);
      } finally {
        setLoadingState('#saveTableBtn', false);
      }
    });
}
