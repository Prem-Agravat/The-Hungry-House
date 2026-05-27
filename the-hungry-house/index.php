<?php
$pageTitle = 'The Hungry House - Home';
$currentPage = 'home';
include 'includes/head.php';
?>
  <body>
    <div class="main-wrapper">
      <?php include 'includes/navbar.php'; ?>

      <!-- ==================== MAIN CONTENT AREA ==================== -->
      <div id="contentArea">
        <!-- ==================== HOME SECTION ==================== -->
        <section id="homeSection">
          <!-- Hero Section -->
          <div class="hero-section text-center">
            <div class="container">
              <h1 class="fw-bold mb-4">Welcome to The Hungry House</h1>
              <p class="lead mb-4">
                Experience the finest Indian cuisine with our authentic recipes
                and warm hospitality
              </p>
              <div class="row justify-content-center mb-5">
                <div class="col-md-4">
                  <div
                    class="d-flex align-items-center justify-content-center mb-3"
                  >
                    <i class="fas fa-check-circle fa-2x me-2"></i>
                    <span>Fresh Ingredients</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div
                    class="d-flex align-items-center justify-content-center mb-3"
                  >
                    <i class="fas fa-clock fa-2x me-2"></i>
                    <span>Fast Delivery</span>
                  </div>
                </div>
                <div class="col-md-4">
                  <div
                    class="d-flex align-items-center justify-content-center mb-3"
                  >
                    <i class="fas fa-heart fa-2x me-2"></i>
                    <span>Made with Love</span>
                  </div>
                </div>
              </div>
              <button class="btn btn-warning btn-lg" id="orderNowBtn">
                Order Now
              </button>
            </div>
          </div>

         <!-- Popular Dishes Section (Only in Home Page) -->
          <div class="popular-dishes-section">
            <div class="container">
              <div class="section-title">
                <h2>Popular Dishes</h2>
                <p class="text-muted">Try our most loved dishes</p>
              </div>

              <div class="row">
                <div class="col-lg-3 col-md-6 mb-4">
                  <div class="card food-card h-100">
                    <img
                      src="https://spicecravings.com/wp-content/uploads/2020/10/Paneer-Tikka-Featured-1.jpg"
                      class="card-img-top food-img"
                      alt="Paneer Tikka"
                    />
                    <div class="card-body">
                      <h5 class="card-title">Paneer Tikka</h5>
                      <p class="card-text">
                        Grilled cottage cheese cubes marinated in spices
                      </p>
                      <div
                        class="d-flex justify-content-between align-items-center"
                      >
                        <span class="fs-5 fw-bold text-primary rupee-symbol"
                          >249</span
                        >
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-lg-3 col-md-6 mb-4">
                  <div class="card food-card h-100">
                    <img
                      src="https://thumbs.dreamstime.com/b/pizza-margherita-27409337.jpg"
                      class="card-img-top food-img"
                      alt="Margherita Pizza"
                    />
                    <div class="card-body">
                      <h5 class="card-title">Margherita Pizza</h5>
                      <p class="card-text">
                        Classic pizza with fresh tomato sauce, mozzarella cheese, and basil leaves. Simple and tasty.
                      </p>
                      <div
                        class="d-flex justify-content-between align-items-center"
                      >
                        <span class="fs-5 fw-bold text-primary rupee-symbol"
                          >159</span
                        >
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-lg-3 col-md-6 mb-4">
                  <div class="card food-card h-100">
                    <img
                      src="https://tiffinandteaofficial.com/wp-content/uploads/2020/07/Untitled-1.jpg"
                      class="card-img-top food-img"
                      alt="Shahi Paneer"
                    />
                    <div class="card-body">
                      <h5 class="card-title">Shahi Paneer</h5>
                      <p class="card-text">
                       Rich and creamy Punjabi curry made with soft paneer cubes cooked in a mildly sweet, buttery tomato-cashew gravy.
                      </p>
                      <div
                        class="d-flex justify-content-between align-items-center"
                      >
                        <span class="fs-5 fw-bold text-primary rupee-symbol"
                          >349</span
                        >
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-lg-3 col-md-6 mb-4">
                  <div class="card food-card h-100">
                    <img
                      src="https://media.istockphoto.com/id/163064596/photo/gulab-jamun.jpg?s=612x612&w=0&k=20&c=JvJ4AAs-N5pRzzRmVg1lG0talC3QoUt0ZGiO1NKz-kQ="
                      class="card-img-top food-img"
                      alt="Gulab Jamun"
                    />
                    <div class="card-body">
                      <h5 class="card-title">Gulab Jamun</h5>
                      <p class="card-text">
                        Gulab Jamun is a soft, deep-fried milk-based sweet soaked in fragrant sugar syrup, served warm and delicious.
                      </p>
                      <div
                        class="d-flex justify-content-between align-items-center"
                      >
                        <span class="fs-5 fw-bold text-primary rupee-symbol"
                          >99</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div class="text-center mt-4">
                <a href="menu.php" class="btn btn-outline-primary"
                  >View Full Menu <i class="fas fa-arrow-right ms-2"></i
                ></a>
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
  </body>
</html>
