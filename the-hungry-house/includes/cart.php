      <!-- ==================== CART SIDEBAR ==================== -->
      <div class="cart-overlay" id="cartOverlay"></div>
      <div class="cart-sidebar" id="cartSidebar">
        <div class="cart-header">
          <div class="d-flex justify-content-between align-items-center">
            <h4><i class="fas fa-shopping-cart me-2"></i>Your Cart</h4>
            <button class="btn btn-sm btn-light" id="closeCart">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="p-4 overflow-auto" style="height: calc(100vh - 350px)">
          <div id="cartItems"></div>
        </div>
        <div class="cart-footer p-4 border-top">
          <div id="appliedOffer" class="alert alert-success d-none mb-3 py-2 px-3">
              <div class="d-flex justify-content-between align-items-center">
                  <span><i class="fas fa-tag me-2"></i><strong id="appliedOfferCode"></strong> Applied (<span id="discountPercent"></span> off)</span>
                  <button class="btn btn-sm text-success p-0" id="removeOfferBtn"><i class="fas fa-times"></i></button>
              </div>
          </div>

          <div class="input-group mb-3">
              <input type="text" class="form-control" id="offerCodeInput" placeholder="Enter offer code">
              <button class="btn btn-primary" id="applyOfferBtn">Apply</button>
          </div>
          <div id="offerMessage" class="small mb-3"></div>

          <div class="d-flex justify-content-between mb-2">
            <span>Subtotal:</span>
            <span class="rupee-symbol fw-bold" id="cartSubtotal">0.00</span>
          </div>
          <div class="d-flex justify-content-between mb-2 d-none text-success" id="discountRow">
            <span>Discount:</span>
            <span>-<span class="rupee-symbol fw-bold" id="cartDiscount">0.00</span></span>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span>Tax (GST 18%):</span>
            <span class="rupee-symbol fw-bold" id="cartTax">0.00</span>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span>Delivery Fee:</span>
            <span class="rupee-symbol fw-bold" id="cartDelivery">0.00</span>
          </div>
          <hr />
          <div class="d-flex justify-content-between fw-bold fs-5 mb-4">
            <span>Total:</span>
            <span class="rupee-symbol text-primary" id="cartTotal">0.00</span>
          </div>
          <button class="btn btn-primary w-100 py-3 rounded-pill" id="checkoutBtn">
            <i class="fas fa-credit-card me-2"></i>Proceed to Checkout
          </button>
        </div>
      </div>
