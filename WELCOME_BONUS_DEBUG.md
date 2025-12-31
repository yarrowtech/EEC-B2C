# Welcome Bonus - Debugging Guide

## What Was Implemented

### Backend (auth.js)
- New users automatically get 100 points when registering
- Points are set during User.create(): `points: 100`
- Registration response now includes `points` and `createdAt` fields

### Frontend (AchievementsView.jsx)
- Shows welcome bonus card if user has >= 100 points
- Card appears first in Points History with special styling
- Only displayed for users who have earned the welcome bonus

## How to Test

### Test Registration:
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "class": "10",
    "state": "Test State",
    "board": "CBSE"
  }'
```

### Verify in Database:
```bash
# Using MongoDB shell
mongo
use your_database_name
db.users.find({ email: "test@example.com" }, { points: 1, createdAt: 1 })

# Should show: { "_id": ..., "points": 100, "createdAt": ... }
```

### Check Response:
The registration response should include:
```json
{
  "message": "Registered successfully",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "points": 100,
    "createdAt": "2025-12-31T..."
  },
  "token": "..."
}
```

## Troubleshooting

### Issue: Points show in Achievement page but not in database

**Solution:**
The Achievement page logic was updated to only show welcome bonus if `userPoints >= 100`. This means:
- Old users (registered before this feature): Won't see welcome bonus
- New users (registered after this feature): Will see welcome bonus

### Issue: New users don't get 100 points

**Check:**
1. Verify `points: 100` is in auth.js line 73
2. Check User model has `points: { type: Number, default: 0 }`
3. Ensure no middleware is resetting points after creation
4. Check database connection is working

### Manual Fix for Existing Users (Optional):
If you want to give existing users the welcome bonus:

```javascript
// Run this in MongoDB shell
db.users.updateMany(
  { points: { $lt: 100 } },
  { $set: { points: 100 } }
)
```

## Files Modified

1. **backend/src/controllers/auth.js**
   - Line 73: Added `points: 100` to User.create()
   - Lines 90-91: Added `points` and `createdAt` to registration response

2. **frontend/src/pages/AchievementsView.jsx**
   - Lines 41-50: Added welcome bonus logic
   - Lines 195-269: Updated UI to show special welcome bonus card
