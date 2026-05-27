<?php
$pageTitle = 'Profile - The Hungry House';
$currentPage = 'profile';
include 'includes/head.php';
?>
  <body>
    <div class="main-wrapper">
      <?php include 'includes/navbar.php'; ?>

      <div id="contentArea">
        <section id="profileSection">
          <div class="section-image-header" style="background-image: url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1350&q=80');">
            <div class="header-content">
              <div class="header-icon">
                <i class="fas fa-user-circle"></i>
              </div>
              <h2>My Profile</h2>
              <p>Manage your account details and view order history</p>
            </div>
          </div>

          <div class="container pb-5">
            <div class="row justify-content-center">
              <div class="col-xl-8 col-lg-10">
                <div class="card border-0 shadow-sm mb-4">
                  <div class="card-header bg-white">
                    <h5 class="mb-0">Account Details</h5>
                  </div>
                  <div class="card-body">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <div class="text-muted small">Full Name</div>
                        <div class="fw-semibold" id="profileNameText">-</div>
                      </div>
                      <div class="col-md-6">
                        <div class="text-muted small">Email</div>
                        <div class="fw-semibold" id="profileEmailText">-</div>
                      </div>
                      <div class="col-md-6">
                        <div class="text-muted small">Phone</div>
                        <div class="fw-semibold" id="profilePhoneText">-</div>
                      </div>
                    </div>
                    <button class="btn btn-outline-primary mt-4" id="editProfileBtn">
                      <i class="fas fa-edit me-2"></i>Edit Profile
                    </button>
                  </div>
                </div>

                <div class="card border-0 shadow-sm">
                  <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">My Orders</h5>
                    <span class="badge bg-primary" id="profileOrdersCount">0</span>
                  </div>
                  <div class="card-body">
                    <div id="profileOrdersList" class="d-flex flex-column gap-3" style="max-height: 760px; overflow-y: auto;">
                      <div class="text-muted">Loading your orders...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="modal fade" id="editProfileModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title">Edit Profile</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <form id="profileForm" novalidate>
                <div class="mb-3">
                  <label class="form-label">Full Name</label>
                  <input type="text" class="form-control" id="profileName" />
                  <div id="profileNameError" class="text-danger small mt-1" style="display:none;"></div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="text" class="form-control" id="profileEmail" disabled />
                </div>
                <div class="mb-3">
                  <label class="form-label">Phone</label>
                  <input type="text" class="form-control" id="profilePhone" />
                  <div id="profilePhoneError" class="text-danger small mt-1" style="display:none;"></div>
                </div>
                <hr />
                <div class="mb-3">
                  <label class="form-label">Current Password</label>
                  <input type="password" class="form-control" id="profileCurrentPassword" />
                  <div id="profileCurrentPasswordError" class="text-danger small mt-1" style="display:none;"></div>
                </div>
                <div class="mb-3">
                  <label class="form-label">New Password (optional)</label>
                  <input type="password" class="form-control" id="profileNewPassword" />
                  <div id="profileNewPasswordError" class="text-danger small mt-1" style="display:none;"></div>
                </div>
                <button type="submit" class="btn btn-primary w-100">Update Profile</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <?php include 'includes/footer.php'; ?>
      <?php include 'includes/cart.php'; ?>
      <?php include 'includes/modals.php'; ?>
    </div>

    <?php include 'includes/scripts.php'; ?>
  </body>
</html>
