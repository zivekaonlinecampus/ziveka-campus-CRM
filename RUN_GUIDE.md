# 🚀 Ziveka Online Campus – Regional Representative CRM
## Complete Run Guide & Setup Instructions

---

## 📋 1. Prerequisites

Before running the application, make sure you have the following installed on your machine:

1. **XAMPP** (with **MySQL / MariaDB** running on port `3306`)
2. **PHP 8.2+** (with `pdo_mysql`, `openssl`, `mbstring`, `curl` extensions enabled)
3. **Composer** (PHP Package Manager)
4. **Node.js 18+** & **npm**

---

## 🗄️ 2. Database Setup (Supabase PostgreSQL)

Check backend environment file: `backend/.env`
```env
DB_CONNECTION=pgsql
DB_HOST=db.jzttopyquzmbirjikzxt.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=vGIO3SmTtYxF7I82
```

---

## ⚙️ 3. Backend Setup & Run (Laravel)

Open a terminal / PowerShell window and navigate to the backend folder:

```powershell
cd "f:\webs\ziveka CRM\backend"
```

### Initial Setup (if running for the first time or after reset):
```powershell
# 1. Install PHP dependencies
composer install

# 2. Generate application key
php artisan key:generate

# 3. Run database migrations & seeders (all 25 districts, courses, real profiles)
php artisan migrate:fresh --seed
php artisan db:seed --class=RealProfilesSeeder

# 4. Create storage link (for receipt slips / documents)
php artisan storage:link
```

### Start the Laravel API Server:
```powershell
php artisan serve --host=127.0.0.1 --port=8000
```
> 🟢 **Backend will run at:** `http://127.0.0.1:8000`

---

## 💻 4. Frontend Setup & Run (React + Vite)

Open a **second terminal / PowerShell window** and navigate to the frontend folder:

```powershell
cd "f:\webs\ziveka CRM\frontend"
```

### Initial Setup (if dependencies not installed):
```powershell
npm install
```

### Start the Frontend Dev Server:
```powershell
npm run dev
```
> 🟢 **Frontend will run at:** `http://localhost:5173`

---

## 🌐 5. How to Access the Portals

### 🖥️ Main Login Portal
Open your browser and navigate to:
👉 **http://localhost:5173**

---

### 📱 Public Student Registration & QR Referral Links
Students register through representative referral links or QR codes:

- **Colombo District:** `http://localhost:5173/#/r/ZV-CMB-AKP`
- **Kandy District:** `http://localhost:5173/#/r/ZV-KAN-CBR`
- **Galle District:** `http://localhost:5173/#/r/ZV-GAL-DMS`
- **Kurunegala District:** `http://localhost:5173/#/r/ZV-KUR-TMW`
- **Jaffna District:** `http://localhost:5173/#/r/ZV-JAF-SAR`

---

## 🔐 6. User Access

User accounts and passwords are provisioned by the database seeders and must be
managed through a secure password manager. Do not store production credentials in
this guide or in source control.

---

## 🛠️ 7. Useful Troubleshooting Commands

### Resetting database and reseeding real profiles:
```powershell
cd "f:\webs\ziveka CRM\backend"
php artisan migrate:fresh --seed
php artisan db:seed --class=RealProfilesSeeder
```

### Clearing Laravel Cache:
```powershell
php artisan optimize:clear
```

### Rebuilding Frontend for Production:
```powershell
cd "f:\webs\ziveka CRM\frontend"
npm run build
```
