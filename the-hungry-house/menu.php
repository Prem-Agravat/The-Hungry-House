<?php
$pageTitle = 'Menu - The Hungry House';
$currentPage = 'menu';
include 'includes/head.php';
?>
  <body>
    <div class="main-wrapper">
      <?php include 'includes/navbar.php'; ?>

      <!-- ==================== MAIN CONTENT AREA ==================== -->
      <div id="contentArea">
        <!-- ==================== MENU SECTION ==================== -->
        <section id="menuSection" class="py-5" style="background: #f8f9fa">
          <!-- Image Header -->
          <div class="section-image-header menu-header">
            <div class="header-content">
              <div class="header-icon">
                <i class="fas fa-utensils"></i>
              </div>
              <h2>Our Delicious Menu</h2>
              <p>Discover our wide range of authentic Indian dishes</p>
            </div>
          </div>

          <div class="container">
            <div class="row mb-4">
              <div class="col-md-6">
                <h4 class="text-muted">Discover Our Specialties</h4>
              </div>
              <div class="col-md-6 text-end">
                <div class="btn-group" role="group" id="categoryFilter">
                  <button
                    type="button"
                    class="btn btn-outline-primary category-btn active"
                    data-category="all"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-primary category-btn"
                    data-category="starters"
                  >
                    Starters
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-primary category-btn"
                    data-category="main-course"
                  >
                    Main Course
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-primary category-btn"
                    data-category="breads"
                  >
                    Breads
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-primary category-btn"
                    data-category="desserts"
                  >
                    Desserts
                  </button>
                </div>
              </div>
            </div>

            <div class="row" id="foodItems"></div>

            <div id="noResultsMessage" class="no-results d-none">
              <i class="fas fa-search"></i>
              <h3>No Food Items Found</h3>
              <p>
                No items match your search. Please try a different search term.
              </p>
              <button class="btn btn-primary" id="clearSearchBtn">
                Show All Menu
              </button>
            </div>
          </div>
        </section>
      </div>

      <?php include 'includes/footer.php'; ?>
      <?php include 'includes/cart.php'; ?>
      <?php include 'includes/modals.php'; ?>
    </div>

    <?php include 'includes/scripts.php'; ?>
  </body>
</html>
