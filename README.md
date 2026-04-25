# 💼 GigMatch

Welcome to **GigMatch** — a premium, serverless platform designed to seamlessly connect freelance workers with employers for short-term gigs. Built with a luxurious "Old Money" aesthetic (warm tans, deep mahoganies, and alabaster), GigMatch offers a highly polished, professional user experience from start to finish.

---

## ✨ Key Features

- **Dynamic Authentication:** A beautiful, responsive sliding-panel UI for seamless Login and Registration.
- **Smart Job Discovery:** Browse available gigs with real-time filtering (by category, location, duration, and hourly rate).
- **Interactive Geocoding Map:** View job locations on a live, interactive map powered by Leaflet and the OpenStreetMap Nominatim API, which automatically converts city names to precise map coordinates!
- **Personalized Bookmarks:** Workers can instantly bookmark jobs they are interested in, and use a dedicated toggle to view only their saved opportunities.
- **Real-Time Messaging:** Built-in chat system allowing workers and employers to communicate directly about job details in real-time.
- **Admin & Employer Dashboards:** Dedicated views for platform administrators to manage users/complaints, and for employers to post and manage their active gigs.

## 🛠️ Built With

GigMatch is a modern, lightweight web application built entirely without heavy frontend frameworks, ensuring blazing fast load times and straightforward maintainability.

* **Frontend:** Vanilla HTML5, Vanilla JavaScript (ES6 Modules), and Custom CSS.
* **Backend & Database:** Firebase (Authentication, Firestore Database, Storage).
* **Mapping API:** Leaflet.js paired with the Nominatim OpenStreetMap API.
* **Hosting:** GitHub Pages.

---

## 🚀 How to Run Locally

Because GigMatch uses ES6 JavaScript Modules (`import`/`export`), you cannot simply double-click the `index.html` file to open it. It must be run through a local web server.

### Option 1: Using VS Code (Recommended)
1. Open this repository folder in **Visual Studio Code**.
2. Install the **Live Server** extension by Ritwick Dey.
3. Right-click on `index.html` (or `login.html`) and select **"Open with Live Server"**.
4. The app will open in your default browser at `http://localhost:5500`.

### Option 2: Using Node.js / npm
If you have Node.js installed, you can use the `http-server` package:
1. Open your terminal in the project directory.
2. Run the command: `npx http-server -c-1`
3. Open your browser and navigate to `http://localhost:8080`.

### Option 3: Using Python
If you have Python installed on your system:
1. Open your terminal in the project directory.
2. Run the command: `python -m http.server 8000`
3. Open your browser and navigate to `http://localhost:8000`.

---

## 📖 Project Structure
- `css/` - Contains all stylesheets, including the core design system and the `sliding-auth.css`.
- `js/` - Contains the core logic, including `firebase-config.js` and feature-specific modules (`discover.js`, `job-detail.js`, `chat.js`).
- `*.html` - The core pages of the application (Dashboard, Login, Jobs, Chat, etc.).

*Designed and built with precision and elegance.*
