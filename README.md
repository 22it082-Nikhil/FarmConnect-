# 🚜 FarmConnect - Advanced Agriculture Platform
> **Empowering the Future of Farming.**
> An end-to-end digital ecosystem connecting Farmers, Buyers, and Service Providers to streamline the agricultural supply chain.

---

## 📖 Table of Contents
- [✨ Core Modules & Features](#-core-modules--features)
    - [👨‍🌾 For Farmers](#-for-farmers)
    - [🛒 For Buyers](#-for-buyers)
    - [🚛 For Service Providers](#-for-service-providers)
- [⚙️ Technical Architecture](#-technical-architecture)
- [🔌 API Documentation](#-api-documentation)
- [📦 Data Models](#-data-models)
- [🚀 Installation & Setup](#-installation--setup)

---

## ✨ Core Modules & Features

### 👨‍� For Farmers
**Goal:** Maximize yield profit and access essential services effortlessly.

#### 1. **Crop Management System**
   - **Listing**: Farmers can list produce with details: *Quantity (kg/tons)*, *Price per Unit*, *Grade*, and *Images*.
   - **Image Upload**: Supports real-time image preview and uploads (stored via Multer).
   - **Validation**: Ensures all crop entries meet market standards before publishing.

#### 2. **Financial Analytics Dashboard**
   - **Income Tracking**: Visualizes revenue from accepted crop offers.
   - **Expense Tracking**: Logs payments made to service providers (tractors, labor).
   - **Profit/Loss Analysis**: Auto-calculates Net Profit and displays status badges (e.g., "Trending Up", "Loss").
   - **Charts**: Interactive Area and Bar charts powered by `Recharts` for temporal financial analysis.

#### 3. **Service Hiring**
   - **Marketplace**: Browse listed services (Tractors, Drones, Manpower).
   - **Request System**: specific requirements (e.g., "Need Harvester for 2 days").
   - **Status Tracking**: Monitor request status from *Pending* -> *Accepted* -> *Completed*.

#### 4. **Live Market & Weather Data**
   - **Weather Integration**: Uses `Open-Meteo API` to fetch real-time weather stats (Temp, Wind, Rain) based on geolocation.
   - **Market Trends**: Displays highest, lowest, and average Mandi prices for key crops to help pricing decisions.

---

### 🛒 For Buyers
**Goal:** Source quality produce efficiently and track logistics.

#### 1. **Advanced Marketplace & Filtering**
   - **Search**: Real-time text search for crops (e.g., "Basmati Rice").
   - **Filters**: Filter by *Price Range*, *Crop Type*, and *Location*.
   - **Quick Bid**: Place negotiation bids directly from the listing card.

#### 2. **Reverse Bidding (Buyer Needs)**
   - **Post Requirements**: Buyers post "Needs" (e.g., "Looking for 500kg Tomatoes").
   - **Farmer Bidding**: Farmers see these needs and bid to fulfill them.
   - **Selection**: Buyers review bids and accept the best offer.

#### 3. **Logistics & Shipment Tracking**
   - **Timeline View**: A vertical stepper UI showing the package journey (*Packed -> Shipped -> Out for Delivery -> Delivered*).
   - **Live Updates**: Real-time status updates pushed from the backend.
   - **Simulation Mode**: Dev tools to simulate tracking updates for testing user flows.

#### 4. **Profile & Location Management**
   - **Geolocation**: Integrated Google Maps/Leaflet support.
   - **Coordinate Support**: Buyers can input precise Latitude/Longitude for accurate delivery tracking.

---

### � For Service Providers
**Goal:** Optimize fleet utilization and find new business opportunities.

#### 1. **Service Fleet Management**
   - **Listing Creator**: Create profiles for vehicles (Trucks, Harvesters) or teams (Manpower).
   - **Availability Toggle**: Mark assets as *Available*, *Busy*, or *Maintenance* to control visibility.
   - **Scheduling**: Block dates on a calendar to prevent double-booking.

#### 2. **Job Discovery Map**
   - **Interactive Map**: Displays nearby Service Requests from Farmers as pins on a map.
   - **Radius Filter**: Find jobs within 10km, 50km, or 100km.
   - **Quick Apply**: Send quotes directly from the map view.

#### 3. **Performance Metrics**
   - **Success Rate**: Tracks Bids Won vs. Bids Placed.
   - **Earnings Report**: Aggregate view of total income from completed jobs.
   - **Top Services**: Identifies which service category is generating the most revenue.

---

## ⚙️ Technical Architecture

### **Frontend (Client)**
- **Core**: React 18 (Vite) + TypeScript for type safety.
- **Styling**: Tailwind CSS (Utility-first) + Framer Motion (Transitions).
- **State Management**: React `useState`/`useEffect` + Context API.
- **Maps**: `react-leaflet` for rendering interactive maps.
- **Charts**: `recharts` for data visualization.
- **Auth**: Clerk (Secure User Management).

### **Backend (Server)**
- **Runtime**: Node.js + Express.js.
- **Database**: MongoDB + Mongoose (Schema-based modeling).
- **File Storage**: Local uploads served via Express static middleware.
- **Communication**: RESTful API architecture.
- **Security**: CORS enabled, Environment variable protection (`dotenv`).

---

## � API Documentation

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `PUT` | `/api/auth/update/:id` | Update user profile (Photo, Bio, Location). |
| **Crops** | `GET` | `/api/crops` | Fetch all active crop listings. |
| **Offers** | `POST` | `/api/offers` | Place a bid on a crop or service. |
| **Offers** | `POST` | `/api/offers/:id/tracking` | Add a shipment tracking update. |
| **Services** | `GET` | `/api/service-requests` | List open jobs for providers. |
| **Chat** | `GET` | `/api/chats?userId=:id` | Fetch conversation history. |

---

## 📦 Data Models

### **User**
- `name`, `email`, `role` (farmer/buyer/provider), `location`, `latitude`, `longitude`.

### **Crop**
- `farmer` (Ref), `name`, `quantity`, `price`, `images[]`, `status`.

### **Offer**
- `crop` (Ref), `buyer` (Ref), `bidAmount`, `status` (pending/accepted/rejected), `trackingUpdates[]`.

### **ServiceRequest**
- `farmer` (Ref), `type` (Vehicle/Labor), `description`, `requiredDate`, `status`.

---

## 🚀 Installation & Setup

### 1. Backend
```bash
cd backend
npm install
# Create .env file with MONGO_URI and PORT
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
# Create .env file with VITE_API_URL and VITE_CLERK_PUBLISHABLE_KEY
npm run dev
```

---
*Built with ❤️ for the Agriculture Community.*
