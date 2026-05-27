<?php
$pageTitle = 'Offers - The Hungry House';
$currentPage = 'offers';
include 'includes/head.php';
?>
  <body>
    <div class="main-wrapper">
      <?php include 'includes/navbar.php'; ?>

      <!-- ==================== MAIN CONTENT AREA ==================== -->
      <div id="contentArea">
        <!-- ==================== OFFERS SECTION ==================== -->
        <section id="offersSection" class="py-5" style="background: white">
          <!-- Image Header -->
          <div class="section-image-header offers-header">
            <div class="header-content">
              <div class="header-icon">
                <i class="fas fa-tags"></i>
              </div>
              <h2>Special Offers</h2>
              <p>Don't miss out on these amazing deals!</p>
            </div>
          </div>
          <div class="container">
            <div class="row" id="offerItems"></div>
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
