<?php
$pageTitle = 'Table Booking - The Hungry House';
$currentPage = 'booking';
include 'includes/head.php';
?>
  <body>
    <div class="main-wrapper">
      <?php include 'includes/navbar.php'; ?>

      <div id="contentArea">
        <section id="bookingSection" class="py-5" style="background: #f8f9fa">
          <div class="section-image-header" style="background-image: url('https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1350&q=80');">
            <div class="header-content">
              <div class="header-icon"><i class="fas fa-calendar-check"></i></div>
              <h2>Advance Table Booking</h2>
              <p>Book today's or tomorrow's table slots with live availability</p>
            </div>
          </div>

          <div class="container">
            <div class="row g-4">
              <div class="col-lg-6">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-header bg-white">
                    <h5 class="mb-0">Create Booking</h5>
                  </div>
                  <div class="card-body">
                    <form id="advanceBookingForm" novalidate>
                      <div class="alert alert-info small">
                        You can book only for <strong>today or tomorrow</strong>. Future dates beyond tomorrow are not allowed.
                      </div>
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Booking Date</label>
                          <input type="date" class="form-control" id="advanceBookingDate" required>
                          <div id="advanceBookingDateError" class="text-danger small mt-1" style="display:none;"></div>
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Booking Time</label>
                          <input type="time" class="form-control" id="advanceBookingTime" required>
                          <div id="advanceBookingTimeError" class="text-danger small mt-1" style="display:none;"></div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Duration (minutes)</label>
                        <select class="form-control" id="advanceDuration">
                          <option value="30">30</option>
                          <option value="60" selected>60</option>
                          <option value="90">90</option>
                          <option value="120">120</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <button type="button" class="btn btn-outline-primary w-100" id="checkAdvanceTablesBtn">
                          Check Free Tables
                        </button>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Available Tables (multi-select)</label>
                        <div id="advanceTablesContainer" class="border rounded p-3" style="max-height: 250px; overflow-y: auto;">
                          <div class="text-muted small">Choose date/time and click "Check Free Tables".</div>
                        </div>
                        <div id="advanceTablesError" class="text-danger small mt-1" style="display:none;"></div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Notes (optional)</label>
                        <textarea class="form-control" id="advanceNotes" rows="2" placeholder="Special instructions"></textarea>
                      </div>
                      <button type="submit" class="btn btn-primary w-100">Book Selected Tables</button>
                    </form>
                  </div>
                </div>
              </div>

              <div class="col-lg-6">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">My Advance Bookings</h5>
                    <span class="badge bg-primary" id="myAdvanceBookingCount">0</span>
                  </div>
                  <div class="card-body">
                    <div id="myAdvanceBookingsList" class="d-flex flex-column gap-3" style="max-height: 620px; overflow-y: auto;">
                      <div class="text-muted">Loading your bookings...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <?php include 'includes/footer.php'; ?>
      <?php include 'includes/cart.php'; ?>
      <?php include 'includes/modals.php'; ?>
    </div>

    <?php include 'includes/scripts.php'; ?>
    <script src="booking.js"></script>
  </body>
</html>
