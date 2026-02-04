# UI WIREFRAMES - BASIC FLOW

## LANDING PAGE
- Hero section with project description
- Login/Register buttons
- Features overview

## LOGIN/REGISTER PAGES
- Simple forms with validation
- Role selection (Farmer/Distributor)
- Redirect to respective dashboard

## FARMER DASHBOARD
┌─────────────────────────────────────┐
│ Header: Logo + User Menu + Notifications │
├─────────────────────────────────────┤
│ Sidebar:                            │
│ - Dashboard                         │
│ - Add New Crop                      │
│ - My Crops                          │
│ - Shipments                         │
│ - Price Predictions                 │
│ - Profile                           │
├─────────────────────────────────────┤
│ Main Content:                       │
│ - Welcome message                   │
│ - Stats: Total Crops, Active Sales  │
│ - Recent Activity                   │
│ - Price Trends Chart                │
└─────────────────────────────────────┘

## ADD CROP PAGE
- Form with:
  * Crop type dropdown
  * Variety input
  * Planting/harvest dates
  * Quantity (kg)
  * Quality grade selection
  * Price per kg
  * Description
  * Image upload
- Generate QR button
- Save draft/Publish buttons

## CROP LISTING PAGE
- Search and filter bar
- Table with columns:
  * Crop Type | Quantity | Quality | Status | Price | Actions
- Action buttons: Edit, View, Delete, Generate QR

## PRICE PREDICTION PAGE
- Input form for prediction:
  * Select crop type
  * Select quality
  * Enter quantity
  * Select region
- Predict button
- Display results:
  * Predicted price range
  * Confidence level
  * Recommendation (Sell/Hold)
  * Historical price chart

## SHIPMENT TRACKING PAGE
- Search by tracking number
- Timeline view of shipment progress
- Map showing current location
- Checkpoint history table
- Update status button (for farmer)

## DISTRIBUTOR DASHBOARD
- Browse available crops
- Filter by: type, location, price, quality
- View crop details
- Purchase button
- Track purchased shipments