<?php
$pageTitle = 'About Us - The Hungry House';
$currentPage = 'about';
include 'includes/head.php';
?>
  <body>
    <div class="main-wrapper">
      <?php include 'includes/navbar.php'; ?>

      <!-- ==================== MAIN CONTENT AREA ==================== -->
      <div id="contentArea">
        <section id="aboutSection" class="py-5" style="background: #f8f9fa">
          <div class="section-image-header about-header">
            <div class="header-content">
              <div class="header-icon"><i class="fas fa-info-circle"></i></div>
              <h2>About The Hungry House</h2>
              <p>Learn more about our story and values</p>
            </div>
          </div>
          <div class="container">
            <div class="about-section">
              <div class="row align-items-center">
                <div class="col-md-6">
                  <h2 class="mb-4" style="color: var(--primary-color)">
                    Our Story
                  </h2>
                  <p class="lead">
                    Serving authentic Indian cuisine since 2010
                  </p>
                  <p>
                    At The Hungry House, we believe in serving food that reminds
                    you of home. Our chefs use traditional recipes passed down
                    through generations, with a touch of modern culinary
                    techniques.
                  </p>
                  <p>
                    We source our ingredients locally to ensure freshness and
                    support our community farmers. Every dish is prepared with
                    love and attention to detail.
                  </p>
                </div>
                <div class="col-md-6">
                  <img
                    src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    class="img-fluid rounded shadow"
                    alt="Restaurant Interior"
                  />
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
  </body>
</html>
