# 💳 Personal Expense Tracker

A modern, full-stack personal finance and expense tracking application with real-time analytics, dynamic visual charts, category breakdowns, and export capabilities.

Supports both a **Premium Web Dashboard** (responsive dark/light theme) and the **Original Interactive CLI Terminal Application**.

---

## 🌟 Key Features

- **📊 Visual Analytics Dashboard**:
  - Interactive SVG Category Donut Chart with real-time percentage allocation.
  - Monthly Spending Trend Bar Chart with interactive filtering.
  - Live Metric Badges: Total Expenses, Current Month Billing, Average Transaction, Top Spending Category.
- **⚡ Modern Responsive UI**:
  - Glassmorphic design with subtle glow effects and curated color accents.
  - Seamless Dark and Light theme toggle (persists across sessions).
  - Search by title and instant category filter pills (Food, Travel, Bills, etc.).
  - Sort by date (newest/oldest) or amount (highest/lowest).
- **💾 Persistent JSON Storage**:
  - Fully synced with `expenses.json` without requiring an external database.
  - CSV Export capability for financial records.
- **🚀 Production Deployment Ready**:
  - One-click configuration for **Render**, **Railway**, and **Docker**.
  - Production WSGI server (`gunicorn`).
- **💻 Dual Interface**:
  - Web Application (`app.py`) for browser access.
  - Classic CLI Application (`main.py`) for terminal access.

---

## 📁 Project Structure

```text
Personal-Expense-Tracker/
├── app.py                 # Flask web backend & REST API
├── expenses.py            # Core business logic & JSON file persistence
├── main.py                # Original CLI terminal interactive menu
├── expenses.json          # Persistent JSON expense store
├── requirements.txt       # Production dependencies (Flask, Gunicorn)
├── Dockerfile             # Production Docker container definition
├── render.yaml            # Render Blueprint deployment config
├── railway.json           # Railway cloud deployment config
├── Procfile               # Heroku / Railway WSGI process command
├── static/
│   ├── css/style.css      # Modern vanilla CSS design system & themes
│   └── js/app.js          # Reactive frontend logic & SVG charts
└── templates/
    └── index.html         # Semantic HTML5 dashboard template
```

---

## 🚀 How to Run Locally

### 1. Web Application (Recommended)

1. **Activate your environment or install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Start the web server**:
   ```bash
   python app.py
   ```
3. Open your browser and navigate to:
   ```text
   http://127.0.0.1:5000
   ```

### 2. Original Terminal / CLI Application

To run the interactive command-line interface:
```bash
python main.py
```

---

## 🌐 Cloud Deployment Options

### Option A: Deploy to Render (Free Tier)

1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Add modern web dashboard and deployment configs"
   git push origin main
   ```
2. Log in to [Render](https://render.com/).
3. Click **New +** -> **Web Service** -> Connect your GitHub repository.
4. Render will automatically detect `render.yaml` or you can enter:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --workers 2 --threads 4`
5. Click **Create Web Service**. Your app will be live with a public HTTPS URL!

---

### Option B: Deploy with Docker

1. **Build the Docker container**:
   ```bash
   docker build -t personal-expense-tracker .
   ```
2. **Run the container**:
   ```bash
   docker run -d -p 5000:5000 --name expense-tracker personal-expense-tracker
   ```
3. Visit `http://localhost:5000`.

---

### Option C: Deploy to Railway

1. Push this repository to GitHub.
2. Go to [Railway](https://railway.app/) and click **New Project** -> **Deploy from GitHub repo**.
3. Railway automatically detects `Procfile` and `railway.json`.
4. Generate a public domain under your service **Settings** -> **Networking**.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the web dashboard |
| `GET` | `/health` | Health check endpoint for uptime monitors |
| `GET` | `/api/expenses` | List expenses (supports `?category=`, `?search=`, `?sort=`) |
| `POST` | `/api/expenses` | Add a new expense (body: `{ title, amount, category, date }`) |
| `DELETE` | `/api/expenses/<id>` | Delete an expense by ID |
| `GET` | `/api/summary` | Retrieve monthly and category aggregate analytics |
| `GET` | `/api/export/csv` | Download all expenses in CSV format |
| `POST` | `/api/seed-samples`| Load sample demo records |

---

## 👤 Author & Acknowledgments

- **Original Project Creator**: Gita Kadam
- **Enhanced Web & Deployment Stack**: Antigravity Full-Stack Deployment Suite
