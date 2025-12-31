# Gift Card Redemption System Documentation

## Overview
The EEC platform now includes a complete gift card redemption system where:
- **Admins** can add actual Amazon gift cards to the database inventory
- **Students** can redeem their earned coins for real Amazon gift cards
- The system tracks inventory, prevents duplicate redemptions, and sends gift card codes via email

## Conversion Rate
- **10 coins = ₹0.50**
- **20 coins = ₹1.00**

## Gift Card Amounts Available
- ₹100 (requires 2,000 coins)
- ₹250 (requires 5,000 coins)
- ₹500 (requires 10,000 coins)
- ₹1,000 (requires 20,000 coins)

---

## 1. Database Models

### GiftCard Model (`backend/src/models/GiftCard.js`)
Stores actual gift card codes added by admins.

**Fields:**
- `code` - The actual Amazon gift card code (unique, required)
- `provider` - Gift card provider (default: "Amazon")
- `amount` - Gift card value (100, 250, 500, or 1000)
- `status` - "available", "redeemed", or "expired"
- `redeemedBy` - User ID who redeemed it
- `redeemedAt` - Timestamp of redemption
- `redemptionId` - Reference to Redemption record
- `addedBy` - Admin who added the card
- `expiryDate` - Optional expiration date
- `notes` - Admin notes

### Redemption Model (Enhanced)
Tracks all redemption transactions.

**Fields:**
- `userId` - Student who redeemed
- `type` - "cash" or "giftcard"
- `amount` - Amount in rupees
- `coinsUsed` - Number of coins deducted
- `status` - "pending", "completed", or "failed"
- `giftCardCode` - The actual gift card code (for gift cards)
- `giftCardProvider` - Provider name
- `description` - Human-readable description

---

## 2. Admin Endpoints

### Add Single Gift Card
**POST** `/api/gift-cards/add`
- **Auth:** Admin only
- **Body:**
  ```json
  {
    "code": "AMZ-XXXX-XXXX-XXXX",
    "provider": "Amazon",
    "amount": 100,
    "expiryDate": "2025-12-31",
    "notes": "Batch #123"
  }
  ```

### Bulk Add Gift Cards
**POST** `/api/gift-cards/bulk-add`
- **Auth:** Admin only
- **Body:**
  ```json
  {
    "giftCards": [
      {
        "code": "AMZ-1111-2222-3333",
        "amount": 100
      },
      {
        "code": "AMZ-4444-5555-6666",
        "amount": 250
      }
    ]
  }
  ```
- **Response:** Shows which cards were added successfully and which failed

### Get All Gift Cards
**GET** `/api/gift-cards/all?status=available&amount=100`
- **Auth:** Admin only
- **Query Params:**
  - `status` - Filter by status (available, redeemed, expired)
  - `amount` - Filter by amount (100, 250, 500, 1000)
  - `provider` - Filter by provider
- **Response:** List of all gift cards with summary

### Get Inventory Summary
**GET** `/api/gift-cards/inventory`
- **Auth:** Admin only
- **Response:**
  ```json
  {
    "inventory": {
      "100": { "available": 10, "redeemed": 5, "expired": 0 },
      "250": { "available": 8, "redeemed": 2, "expired": 0 },
      "500": { "available": 5, "redeemed": 1, "expired": 0 },
      "1000": { "available": 3, "redeemed": 0, "expired": 0 }
    }
  }
  ```

### Update Gift Card
**PUT** `/api/gift-cards/:id`
- **Auth:** Admin only
- **Body:**
  ```json
  {
    "status": "expired",
    "notes": "Card expired",
    "expiryDate": "2025-12-31"
  }
  ```

### Delete Gift Card
**DELETE** `/api/gift-cards/:id`
- **Auth:** Admin only
- **Note:** Cannot delete redeemed gift cards

---

## 3. Student Endpoints

### Check Gift Card Availability
**GET** `/api/users/gift-card-availability`
- **Auth:** Student or Admin
- **Response:**
  ```json
  {
    "availability": {
      "100": { "available": true, "count": 10 },
      "250": { "available": true, "count": 5 },
      "500": { "available": false, "count": 0 },
      "1000": { "available": true, "count": 2 }
    }
  }
  ```

### Redeem Gift Card
**POST** `/api/users/redeem-coins`
- **Auth:** Student
- **Body:**
  ```json
  {
    "type": "giftcard",
    "amount": 100,
    "coinsUsed": 2000
  }
  ```
- **Process:**
  1. Validates student has enough coins
  2. Checks if gift card is available in inventory
  3. Allocates an available gift card (FIFO - First In First Out)
  4. Deducts coins from student
  5. Marks gift card as redeemed
  6. Sends email with gift card code
  7. Creates redemption record

### Get Redemption History
**GET** `/api/users/redemption-history`
- **Auth:** Student
- **Response:** Last 20 redemptions with gift card codes

### Resend Gift Card Email
**POST** `/api/users/resend-gift-card-email/:redemptionId`
- **Auth:** Student (own redemptions) or Admin
- **Use Case:** If email failed or student lost the code

---

## 4. How It Works

### Student Redemption Flow:

1. **Student goes to Profile → Rewards tab**
   - Sees available gift card options
   - System shows "Out of stock" if no cards available for that amount
   - Shows "X left" badge if inventory is low (≤5 cards)

2. **Student clicks on gift card amount (e.g., ₹100)**
   - Frontend validates: Does student have 2,000 coins?
   - Frontend checks: Is ₹100 gift card available?
   - If both yes, redemption proceeds

3. **Backend Processing:**
   ```
   ✅ Validate coins
   ✅ Find available gift card in database (oldest first - FIFO)
   ✅ Deduct coins from student
   ✅ Mark gift card as redeemed
   ✅ Link gift card to student and redemption record
   ✅ Send professional email with code
   ✅ Update redemption status to "completed"
   ```

4. **Student receives email with:**
   - Gift card code in monospace font
   - Provider (Amazon)
   - Amount (₹100)
   - Step-by-step redemption instructions
   - Direct link to Amazon redemption page
   - Transaction ID and timestamp

5. **Gift card appears in Redemption History:**
   - Shows code (can copy)
   - Shows status badge
   - Shows timestamp
   - Option to resend email if needed

### Admin Management Flow:

1. **Admin adds gift cards:**
   - Single add: One card at a time
   - Bulk add: CSV/JSON upload with multiple cards

2. **Admin monitors inventory:**
   - Dashboard shows available/redeemed/expired counts
   - Can filter by amount, status, provider
   - Sees which student redeemed which card

3. **Admin handles issues:**
   - Mark expired cards
   - Resend failed emails
   - Update card notes
   - Delete unused cards (not redeemed ones)

---

## 5. Email Template

The system sends a professional HTML email using Gmail SMTP (configured in `sendMail.js`):

**Email includes:**
- Gradient header with celebration message
- Gift card details in highlighted box
- Large, centered gift card code (easy to copy)
- Step-by-step redemption instructions with Amazon link
- Important notes (security, one-time use, validity)
- Transaction ID and timestamp
- Direct "Redeem on Amazon" button
- EEC branding footer

**Email Configuration:**
Set these environment variables:
```env
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password
CLIENT_ORIGIN=https://your-frontend-url.com
```

---

## 6. Security Features

1. **Prevents duplicate codes:** Unique index on gift card codes
2. **FIFO allocation:** Oldest cards redeemed first
3. **Atomic operations:** Transaction-like updates prevent race conditions
4. **Auth required:** All endpoints require authentication
5. **Role-based access:** Admin endpoints restricted to admins
6. **Email fallback:** If email fails, card is still redeemed (student can resend)
7. **Expiry handling:** Expired cards automatically excluded from allocation

---

## 7. Frontend Features (ProfilePage.jsx)

### Rewards Tab UI:
```
┌─────────────────────────────────┐
│  💰 Coin Balance: 6,000 coins   │
└─────────────────────────────────┘

┌─────────── Cash Redemption ──────────┐
│ Convert coins to wallet credit       │
│ [Input: ₹__] [Redeem Button]        │
└──────────────────────────────────────┘

┌────────── Amazon Gift Card ──────────┐
│                                       │
│  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ ₹100 │  │ ₹250 │  │ ₹500 │       │
│  │2000c │  │5000c │  │10000c│       │
│  │"5 lft"│  │      │  │"Out" │       │
│  └──────┘  └──────┘  └──────┘       │
│                                       │
│  ┌──────┐                            │
│  │₹1000 │                            │
│  │20000c│                            │
│  └──────┘                            │
└──────────────────────────────────────┘

┌────── Redemption History ────────────┐
│ 🎁 ₹100 Amazon Gift Card             │
│    AMZ-XXXX-XXXX-XXXX   [Copy]      │
│    2,000 coins • Completed           │
│    Dec 31, 2025 3:45 PM              │
│                                       │
│ 💳 ₹50 Wallet Credit                 │
│    1,000 coins • Completed           │
│    Dec 30, 2025 1:20 PM              │
└──────────────────────────────────────┘
```

### Visual Indicators:
- ✅ Green buttons when affordable & available
- 🔴 Gray/disabled when can't afford or out of stock
- 🏷️ "X left" badge when low inventory (≤5)
- ❌ "Out of stock" text when unavailable
- ⚠️ "Need X more coins" when insufficient funds

---

## 8. Testing Guide

### Test Admin Functions:
```bash
# Add a single gift card
curl -X POST http://localhost:5000/api/gift-cards/add \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"AMZ-TEST-1234-5678","amount":100}'

# Check inventory
curl http://localhost:5000/api/gift-cards/inventory \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test Student Functions:
```bash
# Check availability
curl http://localhost:5000/api/users/gift-card-availability \
  -H "Authorization: Bearer STUDENT_TOKEN"

# Redeem gift card
curl -X POST http://localhost:5000/api/users/redeem-coins \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"giftcard","amount":100,"coinsUsed":2000}'
```

---

## 9. Common Scenarios

### Scenario 1: Admin adds 10 gift cards
```javascript
POST /api/gift-cards/bulk-add
{
  "giftCards": [
    {"code": "AMZ-0001", "amount": 100},
    {"code": "AMZ-0002", "amount": 100},
    // ... 8 more
  ]
}
```

### Scenario 2: Student with 6,000 coins redeems ₹100 card
1. Student has 6,000 coins (enough for 2,000 coin card)
2. System finds oldest available ₹100 card
3. Deducts 2,000 coins → Student now has 4,000 coins
4. Sends email with code "AMZ-0001"
5. Card marked as redeemed
6. Shows in redemption history

### Scenario 3: No cards available
1. Student clicks ₹500 gift card
2. System checks inventory → 0 available
3. Error: "Sorry, no ₹500 gift cards available in inventory"
4. Student's coins NOT deducted
5. UI shows "Out of stock" on button

### Scenario 4: Email fails to send
1. Gift card allocated successfully
2. Email service fails
3. Card still marked as redeemed
4. Redemption marked "completed" with note "(Email delivery pending)"
5. Student can click "Resend Email" in history
6. Admin can see in pending emails list

---

## 10. Files Modified/Created

### New Files:
- `backend/src/models/GiftCard.js` - Gift card model
- `backend/src/routes/giftCards.js` - Admin gift card routes
- `GIFT_CARD_SYSTEM.md` - This documentation

### Modified Files:
- `backend/src/server.js` - Added gift card routes
- `backend/src/routes/users.js` - Updated redemption logic to use database cards
- `backend/src/utils/sendMail.js` - Added sendGiftCardEmail function
- `frontend/src/pages/ProfilePage.jsx` - Added availability checks and UI updates

---

## 11. Future Enhancements

Potential features to add:
- [ ] Multiple providers (Flipkart, PayTM, etc.)
- [ ] Custom gift card amounts
- [ ] Bulk import via CSV upload
- [ ] Gift card usage analytics dashboard
- [ ] Automated expiry checking and cleanup
- [ ] Student gift card wishlist
- [ ] Notification when out-of-stock cards are restocked
- [ ] Gift card referral bonuses

---

## Support

For issues or questions:
1. Check redemption history for gift card codes
2. Use "Resend Email" if code was lost
3. Contact admin if gift card is invalid
4. Admin can check `/api/gift-cards/all` for card details

---

**Last Updated:** December 31, 2025
**Version:** 1.0.0
