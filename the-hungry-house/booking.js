$(document).ready(function () {
  if (!window.location.pathname.includes("booking.php")) return;

  initializeAdvanceBookingPage();
});

// ==================== BOOKING PAGE STATE ====================
let bookingSyncTimer = null;
let countdownTimer = null;

function initializeAdvanceBookingPage() {
  if (!appState.isLoggedIn || !appState.currentUser) {
    showNotification("Please login to access table booking.");
    window.location.href = "index.php";
    return;
  }

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  $("#advanceBookingDate")
    .attr("min", todayStr)
    .attr("max", tomorrowStr)
    .val(todayStr);

  $("#advanceBookingTime").val("19:00");

  $("#advanceBookingForm input, #advanceBookingForm select")
    .off("input change")
    .on("input change", function () {
      const id = $(this).attr("id");
      $(`#${id}Error`).hide();
      $("#advanceTablesError").hide();
    });

  $("#checkAdvanceTablesBtn")
    .off("click")
    .on("click", loadFreeTablesForSlot);

  $("#advanceBookingForm")
    .off("submit")
    .on("submit", function (e) {
      e.preventDefault();
      submitAdvanceBooking();
    });

  loadFreeTablesForSlot();
  loadMyAdvanceBookings();

  // Start real-time sync polling every 30 seconds
  startBookingSyncPolling();
}

// ==================== REAL-TIME SYNC POLLING ====================
function startBookingSyncPolling() {
  stopBookingSyncPolling();

  // Poll every 30 seconds for table status updates
  bookingSyncTimer = setInterval(async () => {
    if (!window.location.pathname.includes("booking.php")) return;
    await syncBookingStatus();
  }, 30000);

  // Start countdown ticker every second
  countdownTimer = setInterval(() => {
    updateCountdownTimers();
  }, 1000);
}

function stopBookingSyncPolling() {
  if (bookingSyncTimer) {
    clearInterval(bookingSyncTimer);
    bookingSyncTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

async function syncBookingStatus() {
  try {
    const response = await fetch("api.php?action=sync_table_status");
    const result = await response.json();

    if (result.success) {
      // Update local database tables
      if (result.tables) {
        database.tables = result.tables;
        saveToLocalStorage();
      }

      // Reload the bookings list to reflect any status changes
      await loadMyAdvanceBookings();
    }
  } catch (e) {
    console.error("Booking sync failed", e);
  }
}

// ==================== COUNTDOWN TIMER LOGIC ====================
function updateCountdownTimers() {
  const now = new Date();
  $(".booking-countdown").each(function () {
    const endAt = new Date($(this).data("end-at"));
    const startAt = new Date($(this).data("start-at"));
    const status = $(this).data("booking-status");

    if (status !== "confirmed") return;

    if (now >= startAt && now < endAt) {
      // Currently active — show remaining time
      const remaining = endAt - now;
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      $(this)
        .find(".countdown-text")
        .html(
          `<i class="fas fa-clock me-1"></i>${mins}m ${secs}s remaining`,
        );
      $(this)
        .find(".countdown-text")
        .removeClass("text-primary text-success")
        .addClass("text-warning");
      $(this).find(".booking-status-badge")
        .removeClass("bg-info bg-success bg-secondary")
        .addClass("bg-warning")
        .text("OCCUPIED");
    } else if (now < startAt) {
      // Upcoming — show time until start
      const untilStart = startAt - now;
      const mins = Math.floor(untilStart / 60000);
      const secs = Math.floor((untilStart % 60000) / 1000);
      if (mins < 60) {
        $(this)
          .find(".countdown-text")
          .html(
            `<i class="fas fa-hourglass-start me-1"></i>Starts in ${mins}m ${secs}s`,
          );
      } else {
        const hrs = Math.floor(mins / 60);
        const remainMins = mins % 60;
        $(this)
          .find(".countdown-text")
          .html(
            `<i class="fas fa-hourglass-start me-1"></i>Starts in ${hrs}h ${remainMins}m`,
          );
      }
      $(this)
        .find(".countdown-text")
        .removeClass("text-warning text-success")
        .addClass("text-primary");
      $(this).find(".booking-status-badge")
        .removeClass("bg-warning bg-success bg-secondary")
        .addClass("bg-info")
        .text("Upcoming");
    } else {
      // Time expired — show completed
      $(this)
        .find(".countdown-text")
        .html('<i class="fas fa-check-circle me-1"></i>Completed');
      $(this)
        .find(".countdown-text")
        .removeClass("text-warning text-primary")
        .addClass("text-success");
      $(this).find(".booking-status-badge")
        .removeClass("bg-info bg-warning bg-secondary")
        .addClass("bg-success")
        .text("Completed");
      // Trigger a sync so server marks it completed
      syncBookingStatus();
    }
  });
}

// ==================== VALIDATION ====================
function validateAdvanceSlotInputs() {
  const bookingDate = ($("#advanceBookingDate").val() || "").trim();
  const bookingTime = ($("#advanceBookingTime").val() || "").trim();
  let isValid = true;

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  if (!bookingDate) {
    $("#advanceBookingDateError").text("✕ Booking date is required").show();
    isValid = false;
  } else if (bookingDate !== todayStr && bookingDate !== tomorrowStr) {
    $("#advanceBookingDateError")
      .text("✕ You can only book for today or tomorrow")
      .show();
    isValid = false;
  } else {
    $("#advanceBookingDateError").hide();
  }

  if (!bookingTime) {
    $("#advanceBookingTimeError").text("✕ Booking time is required").show();
    isValid = false;
  } else {
    $("#advanceBookingTimeError").hide();
  }

  return isValid;
}

// ==================== LOAD FREE TABLES ====================
async function loadFreeTablesForSlot() {
  if (!validateAdvanceSlotInputs()) return;

  const bookingDate = $("#advanceBookingDate").val();
  const bookingTime = $("#advanceBookingTime").val();
  const durationMinutes = $("#advanceDuration").val();

  $("#advanceTablesContainer").html(
    '<div class="text-muted small">Checking availability...</div>',
  );

  try {
    const response = await fetch(
      `api.php?action=get_advance_tables&bookingDate=${encodeURIComponent(bookingDate)}&bookingTime=${encodeURIComponent(bookingTime)}&durationMinutes=${encodeURIComponent(durationMinutes)}`,
    );
    const result = await response.json();

    if (!result.success) {
      $("#advanceTablesContainer").html(
        `<div class="text-danger small">${result.message || "Failed to fetch available tables"}</div>`,
      );
      return;
    }

    const tables = Array.isArray(result.tables) ? result.tables : [];
    if (tables.length === 0) {
      $("#advanceTablesContainer").html(
        '<div class="text-muted small">No free tables for selected slot.</div>',
      );
      return;
    }

    const html = tables
      .map(
        (table) => `
        <div class="form-check mb-2">
          <input class="form-check-input advance-table-checkbox" type="checkbox" value="${table.id}" id="advTable${table.id}">
          <label class="form-check-label" for="advTable${table.id}">
            <i class="fas fa-chair me-1 text-success"></i>
            Table ${table.number} (${table.seats} seats)
            <span class="badge bg-success ms-1">Available</span>
          </label>
        </div>
      `,
      )
      .join("");

    $("#advanceTablesContainer").html(html);
  } catch (e) {
    console.error("Failed to fetch free tables", e);
    $("#advanceTablesContainer").html(
      '<div class="text-danger small">Error while checking tables.</div>',
    );
  }
}

// ==================== SUBMIT BOOKING ====================
async function submitAdvanceBooking() {
  if (!validateAdvanceSlotInputs()) return;

  const selectedTableIds = $(".advance-table-checkbox:checked")
    .map(function () {
      return parseInt($(this).val(), 10);
    })
    .get();

  if (selectedTableIds.length === 0) {
    $("#advanceTablesError")
      .text("✕ Please select at least one free table")
      .show();
    return;
  }

  const payload = {
    bookingDate: $("#advanceBookingDate").val(),
    bookingTime: $("#advanceBookingTime").val(),
    durationMinutes: parseInt($("#advanceDuration").val(), 10),
    tableIds: selectedTableIds,
    notes: ($("#advanceNotes").val() || "").trim(),
  };

  setLoadingState('#advanceBookingForm button[type="submit"]', true, 'Booking...');
  try {
    const response = await fetch("api.php?action=book_tables_advance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (result.success) {
      showNotification("Table booking created successfully!");
      $("#advanceNotes").val("");
      await loadFreeTablesForSlot();
      await loadMyAdvanceBookings();
      return;
    }

    $("#advanceTablesError")
      .text(`✕ ${result.message || "Booking failed"}`)
      .show();
  } catch (e) {
    console.error("Booking submit failed", e);
    $("#advanceTablesError")
      .text("✕ Error occurred while creating booking")
      .show();
  } finally {
    setLoadingState('#advanceBookingForm button[type="submit"]', false);
  }
}

// ==================== LOAD MY BOOKINGS (with live status) ====================
async function loadMyAdvanceBookings() {
  try {
    const response = await fetch("api.php?action=get_my_table_bookings");
    const result = await response.json();

    if (!result.success) {
      $("#myAdvanceBookingsList").html(
        `<div class="text-danger small">${result.message || "Failed to load bookings"}</div>`,
      );
      return;
    }

    const bookings = Array.isArray(result.bookings) ? result.bookings : [];
    $("#myAdvanceBookingCount").text(bookings.length);

    if (bookings.length === 0) {
      $("#myAdvanceBookingsList").html(
        '<div class="text-muted">No advance bookings yet.</div>',
      );
      return;
    }

    const now = new Date();

    const html = bookings
      .map((booking) => {
        const startAt = new Date(booking.startAt);
        const endAt = new Date(booking.endAt);

        let statusClass, statusText, countdownHtml;

        if (booking.status === "cancelled") {
          statusClass = "danger";
          statusText = "Cancelled";
          countdownHtml = '<span class="text-danger"><i class="fas fa-times-circle me-1"></i>Cancelled</span>';
        } else if (booking.status === "completed") {
          statusClass = "success";
          statusText = "Completed";
          countdownHtml = '<span class="text-success"><i class="fas fa-check-circle me-1"></i>Completed</span>';
        } else if (now >= startAt && now < endAt) {
          // Currently active
          statusClass = "warning";
          statusText = "OCCUPIED";
          const remaining = endAt - now;
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          countdownHtml = `<span class="text-warning"><i class="fas fa-clock me-1"></i>${mins}m ${secs}s remaining</span>`;
        } else if (now < startAt) {
          // Upcoming
          statusClass = "info";
          statusText = "Upcoming";
          const untilStart = startAt - now;
          const mins = Math.floor(untilStart / 60000);
          if (mins < 60) {
            const secs = Math.floor((untilStart % 60000) / 1000);
            countdownHtml = `<span class="text-primary"><i class="fas fa-hourglass-start me-1"></i>Starts in ${mins}m ${secs}s</span>`;
          } else {
            const hrs = Math.floor(mins / 60);
            const remainMins = mins % 60;
            countdownHtml = `<span class="text-primary"><i class="fas fa-hourglass-start me-1"></i>Starts in ${hrs}h ${remainMins}m</span>`;
          }
        } else {
          // Past but not yet marked completed by server
          statusClass = "success";
          statusText = "Completed";
          countdownHtml = '<span class="text-success"><i class="fas fa-check-circle me-1"></i>Completed</span>';
        }

        const canCancel = booking.status === "confirmed";
        const cancelBtn = canCancel
          ? `<button class="btn btn-sm btn-outline-danger mt-2 cancel-booking-btn" data-id="${booking.id}">
               <i class="fas fa-times me-1"></i>Cancel Booking
             </button>`
          : "";

        return `
          <div class="card border-0 bg-light booking-countdown"
               data-start-at="${booking.startAt}"
               data-end-at="${booking.endAt}"
               data-booking-status="${booking.status}">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">
                  <i class="fas fa-utensils me-1"></i>
                  Table ${booking.tableNumber} (${booking.tableSeats} seats)
                </h6>
                <span class="badge bg-${statusClass} booking-status-badge">${statusText}</span>
              </div>
              <div class="small text-muted mb-1"><strong>Date:</strong> ${booking.bookingDate}</div>
              <div class="small text-muted mb-1"><strong>Time:</strong> ${booking.bookingTime}</div>
              <div class="small text-muted mb-1"><strong>Duration:</strong> ${booking.durationMinutes} minutes</div>
              <div class="small text-muted mb-2"><strong>Slot:</strong> ${booking.startAt} → ${booking.endAt}</div>
              <div class="fw-bold countdown-text">${countdownHtml}</div>
              ${cancelBtn}
            </div>
          </div>
        `;
      })
      .join("");

    $("#myAdvanceBookingsList").html(html);

    // Bind cancel buttons
    $(".cancel-booking-btn")
      .off("click")
      .on("click", function () {
        const bookingId = $(this).data("id");
        cancelBooking(bookingId);
      });
  } catch (e) {
    console.error("Load my bookings failed", e);
    $("#myAdvanceBookingsList").html(
      '<div class="text-danger small">Error loading bookings.</div>',
    );
  }
}

// ==================== CANCEL BOOKING ====================
async function cancelBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  try {
    const formData = new FormData();
    formData.append("bookingId", bookingId);

    const response = await fetch("api.php?action=cancel_table_booking", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (result.success) {
      showNotification("Booking cancelled successfully!");
      await loadFreeTablesForSlot();
      await loadMyAdvanceBookings();
    } else {
      showNotification(result.message || "Failed to cancel booking");
    }
  } catch (e) {
    console.error("Cancel booking failed", e);
    showNotification("Error occurred while cancelling booking");
  }
}

// Cleanup on page unload
$(window).on("beforeunload", function () {
  stopBookingSyncPolling();
});
