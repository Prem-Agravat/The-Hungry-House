<!-- ==================== NAVBAR ==================== -->
<nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
  <div class="container">
    <a class="navbar-brand" href="index.php">
      <i class="fas fa-utensils me-2"></i>The Hungry House
    </a>

    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
    >
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <a class="nav-link <?php echo ($currentPage == 'home') ? 'active' : ''; ?>" href="index.php">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($currentPage == 'menu') ? 'active' : ''; ?>" href="menu.php">Menu</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($currentPage == 'offers') ? 'active' : ''; ?>" href="offers.php">Offers</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($currentPage == 'about') ? 'active' : ''; ?>" href="about.php">About</a>
        </li>
        <li class="nav-item">
          <a class="nav-link <?php echo ($currentPage == 'booking') ? 'active' : ''; ?>" href="booking.php">Table Booking</a>
        </li>
        <li class="nav-item d-none" id="profileNav">
          <a class="nav-link <?php echo ($currentPage == 'profile') ? 'active' : ''; ?>" href="profile.php">Profile</a>
        </li>
      </ul>

      <div class="d-flex align-items-center">
        <div class="input-group me-3 search-box" style="max-width: 250px">
          <input
            type="text"
            class="form-control"
            id="searchFood"
            placeholder="Search food..."
          />
          <button class="btn btn-outline-secondary" type="button" id="searchBtn">
            <i class="fas fa-search"></i>
          </button>
        </div>

        <button class="btn btn-outline-primary position-relative me-2" id="cartBtn">
          <i class="fas fa-shopping-cart"></i>
          <span
            id="cartCount"
            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            >0</span
          >
        </button>

        <button class="btn btn-outline-secondary me-2 d-none" id="profileBtn">
          <i class="fas fa-user"></i>
        </button>

        <button class="btn btn-primary" id="loginBtn">Login</button>
        <button class="btn btn-outline-danger ms-2 d-none" id="logoutBtn">
          Logout
        </button>
        <button class="btn btn-warning ms-2 d-none" id="adminPanelBtn">
          Admin Dashboard
        </button>
      </div>
    </div>
  </div>
</nav>
