      <!-- ==================== MODALS ==================== -->
      <!-- Login Modal -->
      <div class="modal fade" id="loginModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-body p-5">
              <div id="loginForm">
                <div class="text-center mb-4">
                  <div class="login-icon mb-3">
                    <i class="fas fa-user-circle fa-4x text-primary"></i>
                  </div>
                  <h3>Welcome Back</h3>
                  <p class="text-muted">Login to your account to continue</p>
                </div>
                <form id="loginUserForm" novalidate>
                  <div class="mb-3">
                    <label class="form-label">Email address</label>
                    <input type="text" class="form-control py-2" id="loginEmail" placeholder="name@example.com">
                    <div id="loginEmailError" class="text-danger small mt-1" style="display: none;"></div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control py-2" id="loginPassword" placeholder="Enter your password">
                    <div id="loginPasswordError" class="text-danger small mt-1" style="display: none;"></div>
                  </div>
                  <div class="mb-4 d-flex justify-content-between">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="loginAsAdmin">
                      <label class="form-check-label" for="loginAsAdmin">Login as Admin</label>
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary w-100 py-2 mb-3">Login</button>
                  <p class="text-center mb-2"><a href="#" id="forgotPasswordLink">Forgot Password?</a></p>
                  <p class="text-center mb-0">Don't have an account? <a href="#" id="showRegister">Register here</a></p>
                </form>
              </div>

              <div id="registerForm" class="d-none">
                <div class="text-center mb-4">
                  <h3>Create Account</h3>
                  <p class="text-muted">Join us for delicious food experience</p>
                </div>
                <form id="registerUserForm" novalidate>
                  <div class="mb-3">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-control py-2" id="registerName" placeholder="Enter your name">
                    <div id="registerNameError" class="text-danger small mt-1" style="display: none;"></div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email address</label>
                    <input type="text" class="form-control py-2" id="registerEmail" placeholder="name@example.com">
                    <div id="registerEmailError" class="text-danger small mt-1" style="display: none;"></div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Phone Number</label>
                    <input type="text" class="form-control py-2" id="registerPhone" placeholder="Enter 10-digit number">
                    <div id="registerPhoneError" class="text-danger small mt-1" style="display: none;"></div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control py-2" id="registerPassword" placeholder="Minimum 6 characters">
                    <div id="registerPasswordError" class="text-danger small mt-1" style="display: none;"></div>
                  </div>
                  <div class="mb-4">
                    <label class="form-label">Confirm Password</label>
                    <input type="password" class="form-control py-2" id="registerConfirmPassword" placeholder="Confirm your password">
                    <div id="registerConfirmPasswordError" class="text-danger small mt-1" style="display: none;"></div>
                  </div>
                  <button type="submit" class="btn btn-primary w-100 py-2 mb-3">Register</button>
                  <p class="text-center mb-0">Already have an account? <a href="#" id="showLogin">Login here</a></p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Forgot Password Modal -->
      <div class="modal fade" id="forgotPasswordModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-header">
              <h5 class="modal-title">Forgot Password</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <div id="forgotStepEmail">
                <div class="mb-3">
                  <label class="form-label">Registered Email</label>
                  <input type="text" class="form-control" id="forgotEmail" placeholder="name@example.com">
                  <div id="forgotEmailError" class="text-danger small mt-1" style="display: none;"></div>
                </div>
                <button type="button" class="btn btn-primary w-100" id="sendOtpBtn">Send OTP</button>
              </div>

              <div id="forgotStepOtp" class="d-none">
                <div class="mb-3">
                  <label class="form-label">Enter OTP</label>
                  <input type="text" class="form-control" id="forgotOtp" placeholder="6-digit OTP">
                  <div id="forgotOtpError" class="text-danger small mt-1" style="display: none;"></div>
                </div>
                <button type="button" class="btn btn-primary w-100" id="verifyOtpBtn">Verify OTP</button>
                <div class="text-center mt-3">
                  <a href="#" id="resendOtpBtn" class="text-decoration-none">Resend OTP</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div class="modal fade" id="resetPasswordModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-header">
              <h5 class="modal-title">Set New Password</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label">New Password</label>
                <input type="password" class="form-control" id="newForgotPassword" placeholder="Minimum 6 characters">
                <div id="newForgotPasswordError" class="text-danger small mt-1" style="display: none;"></div>
              </div>
              <div class="mb-3">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-control" id="confirmForgotPassword" placeholder="Re-enter new password">
                <div id="confirmForgotPasswordError" class="text-danger small mt-1" style="display: none;"></div>
              </div>
              <button type="button" class="btn btn-primary w-100" id="resetForgotPasswordBtn">Update Password</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Type Modal -->
      <div class="modal fade" id="orderTypeModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header border-0 pb-0">
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4 text-center">
              <h3 class="mb-4">How would you like to order?</h3>
              <div class="row g-3">
                <div class="col-6">
                  <div class="card order-type-card p-3 h-100 cursor-pointer" id="dineInOption">
                    <div class="card-body p-2">
                      <i class="fas fa-chair fa-3x text-primary mb-3"></i>
                      <h5>Dine-In</h5>
                      <p class="small text-muted mb-0">Eat at restaurant</p>
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="card order-type-card p-3 h-100 cursor-pointer" id="deliveryOption">
                    <div class="card-body p-2">
                      <i class="fas fa-truck fa-3x text-warning mb-3"></i>
                      <h5>Delivery</h5>
                      <p class="small text-muted mb-0">To your doorstep</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dine-In Details Modal -->
      <div class="modal fade" id="dineInModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title">Dine-In Information</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <form>
                <div class="mb-3">
                  <label class="form-label">Guest Name</label>
                  <input type="text" class="form-control" id="guestName" required>
                  <div id="guestNameError" class="text-danger small mt-1" style="display: none;"></div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Phone Number</label>
                  <input type="tel" class="form-control" id="guestPhone" required>
                  <div id="guestPhoneError" class="text-danger small mt-1" style="display: none;"></div>
                </div>
                <div class="row">
                  <div class="col-6 mb-3">
                    <label class="form-label">Table Number</label>
                    <select class="form-select" id="tableNumber" required>
                      <option value="">Select Table</option>
                    </select>
                    <div id="tableNumberError" class="text-danger small mt-1" style="display: none;"></div>
                  </div>
                  <div class="col-6 mb-3">
                    <label class="form-label">No. of Guests</label>
                    <input type="number" class="form-control" id="numberOfGuests" min="1" max="10" value="2">
                  </div>
                </div>
                <button type="button" class="btn btn-primary w-100 mt-3" id="saveDineInBtn">Continue to Checkout</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Checkout Modal -->
      <div class="modal fade" id="checkoutModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title">Checkout</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-0">
              <div class="row g-0">
                <div class="col-md-7 p-4 border-end">
                  <h6>Order Summary</h6>
                  <div id="checkoutSummary" class="mb-4"></div>

                  <div id="checkoutDineInDetails" class="d-none alert alert-info p-2 small mb-4"></div>
                  <div id="checkoutDeliveryDetails" class="d-none mb-4">
                    <label class="form-label">Delivery Address</label>
                    <textarea class="form-control" id="deliveryAddress" rows="3" placeholder="Enter your full address"></textarea>
                  </div>

                  <h6>Payment Method</h6>
                  <div class="payment-methods mt-3">
                    <div class="form-check mb-2">
                      <input class="form-check-input" type="radio" name="paymentMethod" value="cash" id="payCash" checked>
                      <label class="form-check-label" for="payCash">
                        <i class="fas fa-money-bill-wave me-2 text-success"></i> Cash on Delivery / Counter
                      </label>
                    </div>
                    <div class="form-check mb-2">
                      <input class="form-check-input" type="radio" name="paymentMethod" value="razorpay" id="payRazorpay">
                      <label class="form-check-label" for="payRazorpay">
                        <i class="fas fa-shield-alt me-2 text-primary"></i> Pay Online
                        <span class="badge bg-primary bg-opacity-10 text-primary ms-1" style="font-size: 0.7em;">UPI / Card / NetBanking</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div class="col-md-5 p-4 bg-light">
                  <h6 class="mb-3">Order Total</h6>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span class="rupee-symbol fw-bold" id="checkoutSubtotal">0.00</span>
                  </div>
                  <div id="checkoutDiscountRow" class="d-flex justify-content-between mb-2 text-success" style="display:none;">
                    <span>Discount:</span>
                    <span>-<span class="rupee-symbol fw-bold" id="checkoutDiscount">0.00</span></span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Tax (GST 18%):</span>
                    <span class="rupee-symbol fw-bold" id="checkoutTax">0.00</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Delivery:</span>
                    <span class="rupee-symbol fw-bold" id="checkoutDelivery">0.00</span>
                  </div>
                  <hr>
                  <div class="d-flex justify-content-between fw-bold fs-5 mb-4">
                    <span>Total Payable:</span>
                    <span class="rupee-symbol text-primary" id="checkoutTotal">0.00</span>
                  </div>
                  <button class="btn btn-success w-100 py-3" id="placeOrderBtn">Confirm Order</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bill Modal -->
      <div class="modal fade" id="billModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0">
            <div class="modal-body p-0 receipt-container" id="billReceipt">
              <div class="receipt-header p-4 text-center">
                <div class="mb-3">
                    <h2 class="fw-bold text-primary mb-0"><i class="fas fa-utensils me-2"></i>The-Hungry-House</h2>
                    <div style="height: 2px; width: 60px; background: var(--primary-color); margin: 10px auto;"></div>
                </div>
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h4 class="mb-0">Order Confirmed!</h4>
                <p class="text-muted small">Your order has been placed successfully</p>
              </div>

              <div id="billContent" class="p-4 bg-white border-top">
                <div class="d-flex justify-content-between mb-2">
                  <span class="fw-bold">Order ID:</span>
                  <span id="receiptOrderId">#HH-0000</span>
                </div>
                <div class="d-flex justify-content-between mb-4">
                  <span class="text-muted">Date:</span>
                  <span id="receiptDate">Oct 26, 2024</span>
                </div>
                <div class="d-none">
                  <span id="receiptDateDetail"></span>
                  <span id="receiptOrderType"></span>
                  <span id="receiptTableNumber"></span>
                  <span id="receiptAddress"></span>
                </div>

                <div id="receiptItems" class="mb-4"></div>

                <hr class="dashed">

                <div class="d-flex justify-content-between mb-1 small text-muted">
                  <span>Subtotal:</span>
                  <span class="rupee-symbol" id="receiptSubtotal">0.00</span>
                </div>
                <div class="d-flex justify-content-between mb-1 small text-muted" id="receiptDiscountRow">
                  <span>Discount:</span>
                  <span>-<span class="rupee-symbol" id="receiptDiscount">0.00</span></span>
                </div>
                <div class="d-flex justify-content-between mb-1 small text-muted">
                  <span>Tax (GST 18%):</span>
                  <span class="rupee-symbol" id="receiptTax">0.00</span>
                </div>
                <div class="d-flex justify-content-between mb-3 small text-muted">
                  <span>Delivery:</span>
                  <span class="rupee-symbol" id="receiptDelivery">0.00</span>
                </div>

                <div class="d-flex justify-content-between fw-bold fs-5 mb-4">
                  <span>Grand Total:</span>
                  <span class="rupee-symbol text-primary" id="receiptTotal">0.00</span>
                </div>

                <div class="payment-info alert alert-light p-2 mb-4">
                  <div class="d-flex justify-content-between small">
                    <span>Payment Method:</span>
                    <span id="receiptPayment" class="text-uppercase">CASH</span>
                  </div>
                </div>

                <div class="text-center">
                  <p class="mb-1 fw-bold">Thank you for dining with us!</p>
                  <p class="text-muted small mb-0 font-monospace">Visit again soon!</p>
                </div>
              </div>
            </div>
            <div class="modal-footer justify-content-center p-3">
              <button class="btn btn-outline-primary" id="downloadBillBtn">
                <i class="fas fa-download me-2"></i>Download PDF
              </button>
              <button class="btn btn-primary px-4" id="backToHomeBtn">Back to Home</button>
            </div>
          </div>
        </div>
      </div>
