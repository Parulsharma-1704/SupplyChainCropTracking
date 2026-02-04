# API ENDPOINTS - VERSION 1

## AUTHENTICATION
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
GET    /api/auth/profile           - Get current user profile
PUT    /api/auth/profile           - Update user profile

## CROP MANAGEMENT
POST   /api/crops                  - Add new crop
GET    /api/crops                  - Get all crops (with filters)
GET    /api/crops/:id              - Get crop by ID
PUT    /api/crops/:id              - Update crop
DELETE /api/crops/:id              - Delete crop
GET    /api/crops/farmer/:id       - Get crops by farmer ID
POST   /api/crops/:id/generate-qr  - Generate QR code
GET    /api/crops/scan/:qrCode     - Get crop by QR code

## SHIPMENT TRACKING
POST   /api/shipments              - Create shipment
GET    /api/shipments              - Get all shipments
GET    /api/shipments/:id          - Get shipment by ID
PUT    /api/shipments/:id/status   - Update shipment status
POST   /api/shipments/:id/checkpoint  - Add checkpoint
GET    /api/shipments/track/:trackingNumber  - Track shipment
GET    /api/shipments/user/:userId - Get user's shipments

## PRICE PREDICTION
POST   /api/predict/price          - Predict price for crop
GET    /api/predict/history        - Get prediction history
POST   /api/prices                 - Add current market price
GET    /api/prices                 - Get price history
GET    /api/prices/crop/:type      - Get prices by crop type

## TRANSACTIONS
POST   /api/transactions           - Create transaction
GET    /api/transactions           - Get all transactions
GET    /api/transactions/:id       - Get transaction by ID
PUT    /api/transactions/:id/pay   - Update payment status
GET    /api/transactions/user/:userId - Get user's transactions

## ADMIN
GET    /api/admin/users            - Get all users
PUT    /api/admin/users/:id        - Update user status
GET    /api/admin/stats            - Get system statistics
GET    /api/admin/analytics        - Get analytics data