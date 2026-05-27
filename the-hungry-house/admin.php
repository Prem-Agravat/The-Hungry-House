  <?php
include 'includes/admin-auth.php';
$pageTitle = 'Admin - The Hungry House';
$currentPage = 'admin';
include 'includes/head.php';
?>
  <body class="admin-panel-page">
    <div id="adminPanel" class="admin-panel">
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-3 col-lg-2 px-0 sidebar">
            <div class="p-3">
              <h5 class="text-center mb-4">Admin Panel</h5>
              <nav class="nav flex-column">
                <a href="#" class="active" data-admin-section="dashboard"
                  ><i class="fas fa-tachometer-alt me-2"></i>Dashboard</a
                >
                <a href="#" data-admin-section="users"
                  ><i class="fas fa-users me-2"></i>Users</a
                >
                <a href="#" data-admin-section="foods"
                  ><i class="fas fa-utensils me-2"></i>Food Items</a
                >
                <a href="#" data-admin-section="orders"
                  ><i class="fas fa-shopping-cart me-2"></i>Orders</a
                >
                <a href="#" data-admin-section="tables"
                  ><i class="fas fa-chair me-2"></i>Tables</a
                >
                <a href="#" data-admin-section="offers"
                  ><i class="fas fa-tags me-2"></i>Offers</a
                >
                <a href="#" data-admin-section="advancedBookings"
                  ><i class="fas fa-calendar-check me-2"></i>Advanced Bookings</a
                >
                <a href="#" data-admin-section="reports"
                  ><i class="fas fa-chart-bar me-2"></i>Reports</a
                >
                <a href="index.php" id="backToSiteBtn"
                  ><i class="fas fa-arrow-left me-2"></i>Back to Site</a
                >
              </nav>
            </div>
          </div>

          <div class="col-md-9 col-lg-10 px-4 py-3">
            <!-- Dashboard -->
            <div id="adminDashboard" class="admin-section">
              <h3 class="mb-4">Dashboard</h3>
              <div class="row">
                <div class="col-md-3 mb-3">
                  <div class="card bg-primary text-white stats-card">
                    <div class="card-body">
                      <h5 class="card-title">Total Users</h5>
                      <h2 id="totalUsersCount">0</h2>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card bg-success text-white stats-card">
                    <div class="card-body">
                      <h5>Total Orders</h5>
                      <h2 id="totalOrdersCount">0</h2>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card bg-warning text-dark stats-card">
                    <div class="card-body">
                      <h5>Dine-in Orders</h5>
                      <h2 id="totalDineInCount">0</h2>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card bg-info text-white stats-card">
                    <div class="card-body">
                      <h5>Delivery Orders</h5>
                      <h2 id="totalDeliveryCount">0</h2>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-3 mb-3">
                  <div class="card bg-danger text-white stats-card">
                    <div class="card-body">
                      <h5>Available Tables</h5>
                      <h2 id="availableTables">6</h2>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card bg-secondary text-white stats-card">
                    <div class="card-body">
                      <h5>Occupied Tables</h5>
                      <h2 id="occupiedTables">0</h2>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card bg-dark text-white stats-card">
                    <div class="card-body">
                      <h5>Today's Revenue</h5>
                      <h2 class="rupee-symbol" id="todayRevenue">0</h2>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card bg-primary text-white stats-card">
                    <div class="card-body">
                      <h5>Total Revenue</h5>
                      <h2 class="rupee-symbol" id="totalRevenue">0</h2>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row mt-4">
                <div class="col-md-6">
                  <div class="card">
                    <div class="card-header bg-white">
                      <h5>Recent Orders</h5>
                    </div>
                    <div class="card-body">
                      <div class="table-responsive">
                        <table class="table table-sm">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Customer</th>
                              <th>Type</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody id="recentOrdersTable"></tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card">
                    <div class="card-header bg-white">
                      <h5>Table Status</h5>
                    </div>
                    <div class="card-body">
                      <div class="table-responsive">
                        <table class="table table-sm">
                          <thead>
                            <tr>
                              <th>Table</th>
                              <th>Seats</th>
                              <th>Status</th>
                              <th>Current Order</th>
                            </tr>
                          </thead>
                          <tbody id="tablesStatusTable"></tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Users Management -->
            <div id="adminUsers" class="admin-section d-none">
              <div
                class="d-flex justify-content-between align-items-center mb-4"
              >
                <h3>Users Management</h3>
                <button class="btn btn-primary" id="addUserBtn">
                  <i class="fas fa-plus me-2"></i>Add User
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="usersTable"></tbody>
                </table>
              </div>
            </div>

            <!-- Food Items Management -->
            <div id="adminFoods" class="admin-section d-none">
              <div
                class="d-flex justify-content-between align-items-center mb-4"
              >
                <h3>Food Items Management</h3>
                <button class="btn btn-primary" id="addFoodBtn">
                  <i class="fas fa-plus me-2"></i>Add Food Item
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Offer Price</th>
                      <th>Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="foodsTable"></tbody>
                </table>
              </div>
            </div>

            <!-- Orders Management -->
            <div id="adminOrders" class="admin-section d-none">
              <div
                class="d-flex justify-content-between align-items-center mb-4"
              >
                <h3>Orders Management</h3>
                <div class="d-flex gap-2">
                  <select
                    class="form-select form-select-sm"
                    id="orderTypeFilter"
                    style="width: 150px"
                  >
                    <option value="all">All Types</option>
                    <option value="dine-in">Dine-In</option>
                    <option value="delivery">Delivery</option>
                  </select>
                  <select
                    class="form-select form-select-sm"
                    id="orderStatusFilter"
                    style="width: 150px"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div class="table-responsive mt-4">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="ordersTable"></tbody>
                </table>
              </div>
            </div>

            <!-- Tables Management -->
            <div id="adminTables" class="admin-section d-none">
              <div
                class="d-flex justify-content-between align-items-center mb-4"
              >
                <h3>Tables Management</h3>
                <button class="btn btn-primary" id="addTableBtn">
                  <i class="fas fa-plus me-2"></i>Add Table
                </button>
              </div>
              <div class="row" id="tablesGrid"></div>
            </div>

            <!-- Offers Management -->
            <div id="adminOffers" class="admin-section d-none">
              <div
                class="d-flex justify-content-between align-items-center mb-4"
              >
                <h3>Offers Management</h3>
                <button class="btn btn-primary" id="addOfferBtn">
                  <i class="fas fa-plus me-2"></i>Add Offer
                </button>
              </div>
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Valid Until</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="offersTable"></tbody>
                </table>
              </div>
            </div>

            <!-- Reports Section -->
            <div id="adminAdvancedBookings" class="admin-section d-none">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h3>Advanced Bookings</h3>
              </div>
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Contact</th>
                      <th>Table</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Time Left</th>
                    </tr>
                  </thead>
                  <tbody id="advanceBookingsTable"></tbody>
                </table>
              </div>
            </div>

            <!-- Reports Section -->
            <div id="adminReports" class="admin-section d-none">
              <h3>Reports</h3>
              <div class="row mb-4">
                <div class="col-md-4">
                  <div class="card">
                    <div class="card-body">
                      <h5>Sales Report</h5>
                      <button class="btn btn-primary" id="generateSalesReport">
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div id="reportResults" class="mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <?php include 'includes/footer.php'; ?>
    <?php include 'includes/cart.php'; ?>
    <?php include 'includes/modals.php'; ?>
    <?php include 'includes/scripts.php'; ?>
  </body>
</html>
