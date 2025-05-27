<div align="center">
<img src="docs/favicon.png" width="50">

# **Unified E-Waste Management Platform (UEMP)**

<img src="docs/GSC.png">
</div>

<div align="center">

[Read the Full Documentation here 👀](https://unified-e-waste-management-platform.vercel.app/docs)

</div>

## **Overview**
The **Unified E-Waste Management Platform (UEMP)** aims to streamline e-waste tracking and recycling through a unified digital solution. It connects **manufacturers, recyclers, and consumers** to promote responsible e-waste management and lifecycle tracking of electronic products.

---

## **Key Features**

### **1. Manufacturer Features**
#### 📌 **QR Code Generation**
- Manufacturers can generate unique QR codes for their products.
- Each QR code contains product-specific information, including:
  - Manufacturer’s unique reference ID.
  - Product type and class.
  - Material composition.
  - Recyclability score (based on embedded materials).
  - Date of manufacture and estimated lifespan.

#### 🔄 **Lifecycle Tracking**
- The QR code tracks the product’s journey from **manufacturing to recycling**.
- Data includes **resale, ownership transfers, and recycling status**.

#### ♻ **Registration as Recycler**
- Manufacturers with recycling capabilities can **register as recyclers** through the platform.
- Details such as **recycling specialization and capacity** are included.

---

### **2. Recycler Features**
#### 🏭 **Facility Registration**
- Recyclers can register their facilities and specify:
  - Types of e-waste they handle (e.g., plastics, metals, circuit boards).
  - Recycling processes used.
  - Certifications and compliance details.

#### 🔗 **Service Integration**
- Recyclers can connect with consumers via the platform.
- Option to accept **direct drop-offs or scheduled pickups**.

---

### **3. Consumer Features**
#### 📦 **Product Recycling**
- Consumers can scan the QR code on their product to:
  - View recycling instructions.
  - Locate nearby registered recyclers specializing in their product’s materials.
  - Schedule recycling pickups or drop-offs.

## **Technical Details**

### **1. QR Code Implementation**
#### 🔍 **Structure**
- The QR code embeds:
  - **Unique product ID (UUID)**.
  - **Manufacturer reference**.
  - **Material and recyclability metadata**.
  - **Register device ownership to customers**

### **2. Backend System**
#### 🗄 **Database**
- Centralized database to store **product, manufacturer, recycler, and lifecycle data**.
- Data categorized by **product type, materials, and ownership**.

## **User Interface (UI)**

### **1. Intuitive Design**
#### 🏠 **Homepage**
- Clear navigation with separate sections for **manufacturers, recyclers, consumers and government organizations**.

#### 📊 **QR Code Dashboard (Manufacturers)**
- Simple tools to **generate and track QR codes**.
- Analytics to monitor **product lifecycle data**.

#### 🏭 **Recycler Dashboard**
- **Registration and profile management**.
- **Calendar for scheduling pickups or appointments**.

#### 📱 **Consumer Portal**
- **Product QR code scanner tool**.
- **Nearby recycler locator with map integration**.

## 📸 Website Snapshots

### 1️⃣ Home Screen
<img src="docs/screenshots/Home_Screen.png" alt="Home Screen" width="600">

### 2️⃣ Manufacturer Dashboard
<img src="docs/screenshots/Manufacturer_Dashboard.png" alt="Manufacturer Dashboard" width="600">

### 2️⃣ Manufacturer QR Code Generation
<img src="docs/screenshots/Manufacturer_QR_Example.png" alt="Manufacturer QR code generation" width="600">

### 3️⃣ Recycler Dashboard
<img src="docs/screenshots/Recycler_Dashboard.png" alt="Recycler Dashboard" width="600">

### 4️⃣ Consumer Portal
<img src="docs/screenshots/consumer.png" alt="Consumer Portal" width="600">

## 🚀 **Get Started**

### **Installation**
```sh
# Clone the repository
git clone https://github.com/hariharjeevan/Unified-EWaste-Management-Platform.git

# Navigate to the project directory
cd UEMP

# Install dependencies
npm install  # or yarn install
```

### **Running the Project**
```sh
# Start the development server
npm run dev  # or yarn dev
```
<div align="center">
  
*__Made with 💖 by Aventra__*

</div>