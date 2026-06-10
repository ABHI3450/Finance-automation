# 🌌  Finance AI 

An intelligent, dual-architecture financial intelligence platform engineered to parse, categorize, and reveal critical spending metrics from bank statement CSV files. This repository features both an elegant, high-fidelity React/Next.js frontend interactive prototype and a standalone Python/Streamlit data processing app.

![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-1.x-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Engine-336791?style=for-the-badge&logo=postgresql&logoColor=white)

---

## ✨ Features

### 💻 Next.js AI Intelligence Client (`/app`)
* **Interactive CSV Parsing:** Instantly drop or browse bank statements from HDFC, ICICI, SBI, and Axis bank formats without server-side processing delays.
* **Anthropic Claude AI Integration:** Direct chat-less query buttons powered by `claude-sonnet` to quickly summarize top expenses, discover anomalies, and get tailored savings advice.
* **Granular Filters & UI States:** Segment your statement records instantly by **High-Value Alerts** (transactions > ₹1000) or **Large Purchases** (> ₹500).
* **Fully Responsive Theme Layout:** Dark-mode glassmorphic aesthetic built with custom variables (`globals.css`) and subtle typography.
* **Stateful User Profiles:** Save user information locally with personalized auto-generated profile avatar indicators.

### 🐍 Python Data Pipeline & Streamlit App (`main.py`)
* **Dynamic Theme Switcher:** Fully customizable live spatial CSS generator with interactive glowing nebulae and shifting background starfields.
* **Multi-Format Processing Schema:** Supports standard custom schemas (`date,merchant,amount`) alongside rigorous financial formats (`Date,Transaction_ID,Description,Category,Amount,Type,Balance`).
* **Automated Keyword Categorization Engine:** Machine-like rule classifications for modern localized vendors (e.g., Swiggy, Zomato, Uber, Netflix, Amazon, Flipkart).
* **PostgreSQL Synchronization Layer:** Implicit database connector schema powered by `SQLAlchemy` that appends historical datasets cleanly into localized target server frames.

---

## 🛠️ Tech Stack & Dependencies

### Frontend Architecture
* **Framework:** Next.js (App Router, Client Components)
* **Styling:** Tailwind CSS & Custom CSS Variables (Glassmorphism & Radial Color Space Gradients)
* **Icons:** `@tabler/icons-webfont`
* **AI Core API:** Anthropic Messages SDK Architecture

### Analytical Engine
* **Framework:** Streamlit
* **Data Processing:** Pandas & NumPy
* **Database Driver:** SQLAlchemy / `psycopg2`
* **Database Target:** PostgreSQL Server

---

## 🚀 Getting Started

### Option A: Running the Next.js Frontend App

1. Ensure you have Node.js installed. Navigate to the frontend project directory:
   ```bash
   npm install

   
