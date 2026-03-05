# Raphaaa Ecommerce Website
## Challenges Faced During Development

### 1. Disconnected product, order, and marketing workflows
- Challenge: Product updates, offer logic, and campaign execution were initially handled in separate flows.
- Impact: Storefront sometimes showed outdated product/offer states and campaign attribution was inconsistent.

### 2. Complex role-based access across internal teams
- Challenge: Managing permissions for `admin`, `merchantise`, `delivery_boy`, and `marketing` without exposing sensitive operations.
- Impact: Higher risk of unauthorized actions and role confusion in admin routes.

### 3. Data consistency across cart, checkout, payment, and orders
- Challenge: Keeping payment status, order status, and fulfillment status synchronized across async flows.
- Impact: Edge-case mismatches (pending/paid/delivered) required reconciliation logic.

### 4. Inventory accuracy under active order traffic
- Challenge: Preventing stock mismatch during concurrent cart and checkout actions.
- Impact: Overselling risk and manual corrections in operations.

### 5. Payment integration reliability
- Challenge: Handling Razorpay signature verification, webhook timing, retry/failure scenarios.
- Impact: Needed robust validation and fallback handling for failed or delayed confirmations.

### 6. Address and profile data quality
- Challenge: Incomplete or inconsistent address/profile inputs affected order fulfillment.
- Impact: Increased delivery exceptions and support overhead.

### 7. Campaign and offer tracking precision
- Challenge: Implementing accurate impression/click/conversion tracking for campaigns.
- Impact: Marketing analytics initially had noise and attribution gaps.

### 8. Centralized communication and customer engagement
- Challenge: Coordinating subscriber emails, contact responses, and offer broadcasts from one system.
- Impact: Duplicate or untimely communication in early stages.

### 9. Operational visibility for analytics
- Challenge: Building reliable sales, trend, and revenue reporting from mixed transactional states.
- Impact: Decision-making was slower until reporting logic stabilized.

### 10. Task management and internal accountability
- Challenge: Tracking team tasks and incomplete items across roles.
- Impact: Workflow delays before scheduler-based auto-status updates were added.

### 11. CMS-driven content control
- Challenge: Letting non-developers update Hero/About/Policy/Contact settings safely.
- Impact: Required stricter validations and role checks to avoid accidental content issues.

### 12. Security hardening for production
- Challenge: Ensuring all sensitive update routes were consistently middleware-protected.
- Impact: Security review was necessary to reduce unauthorized config/content changes.

### 13. Performance under media-heavy catalog
- Challenge: Maintaining responsive UX with large image assets and dynamic filters.
- Impact: Perceived load times increased on some storefront views.

### 14. Deployment and environment consistency
- Challenge: Keeping env configurations aligned across local and hosted environments.
- Impact: Intermittent integration failures (payment, email, webhook URLs).

### 15. Complaint-to-resolution workflow
- Challenge: Converting user complaints into trackable operational actions.
- Impact: Needed better linkage between complaint handling and internal task execution.

## Summary
Raphaaa’s biggest engineering challenge was not one single feature; it was maintaining consistency across multi-role operations, transactional reliability, and customer-facing performance while scaling business modules in one platform.
