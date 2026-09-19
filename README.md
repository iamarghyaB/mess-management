# 🍽️ Mess Management System

A shared mess management web application built with **React + TypeScript + Vite**, powered by **Supabase** as the backend database. No login required — everyone in the mess shares the same data.

---

## 📸 Preview

![Mess Management System](./WhatsApp%20Image%202025-01-09%20at%2000.18.24_5cb46ac1.jpg)

---

## 🚀 How It Works

The system is split into **4 main sections**, accessible from the top navigation bar:

### 1. 🏠 Dashboard
The landing page that gives a **real-time overview** of the entire mess:

| Card | What it shows |
|------|--------------|
| **Current Balance** | Total contributions minus total expenses |
| **Total Expenses** | Sum of all recorded expenses |
| **Next Market Duty** | The upcoming duty date based on the saved schedule |
| **Total Contributions** | Sum of all money contributed |

It also displays:
- 📈 **Expense Trend Chart** — A line graph of the last 10 expenses
- 📋 **Recent Activity** — Latest 5 expenses and contributions combined

---

### 2. 🛒 Market Duty
Manage the weekly market shopping schedule:

- Select **up to 2 days per week** for market duty (e.g., Monday, Thursday)
- The app automatically calculates the **Next Duty Date** from today
- Click **Save Schedule** to persist the selection to Supabase
- The schedule is **shared** — everyone sees the same duty days

---

### 3. 💸 Expenses
Track all mess-related purchases:

- Click **Add Expense** to open a form:
  - **Amount** (₹)
  - **Items** — add multiple grocery/purchase items one by one
  - **Description** — optional notes
- All expenses are listed with date, amount, and item list
- Summary cards show **Total Expenses** and **Monthly Expenses**

---

### 4. 🐷 Contributions
Track money put into the mess fund:

- Click **Add Contribution** to log:
  - **Amount** (₹)
  - **Date** of contribution
- Each contribution has a **status** badge (`pending` / `completed`)
- Summary cards show **Total Contributions**, **Monthly Contributions**, and **Current Balance**

---

## 👤 How to Use as a User

Once the app is running, any mess member can open it in their browser — **no account or login needed**.

---

### 🏠 Step 1 — Check the Dashboard

When you first open the app, you land on the **Dashboard**.

- Look at the **Current Balance** card — if it's **red (negative)**, the mess fund is short and more contributions are needed.
- Look at the **Next Market Duty** card to see when the next shopping day is.
- Scroll down to see the **Recent Activity** list to catch up on what's happened.

---

### 🛒 Step 2 — Set Market Duty Days

> Do this once when the mess is set up, or whenever the schedule changes.

1. Click **Market Duty** in the top navigation bar.
2. You'll see 7 day buttons (Sunday → Saturday).
3. Click on **up to 2 days** that the mess does market shopping (e.g., Monday + Thursday).
   - Selected days turn **blue**.
   - The **Next Duty Date** preview updates instantly.
4. Click **Save Schedule**.

The schedule is now saved for everyone to see.

---

### 💸 Step 3 — Record an Expense (After Market Shopping)

> Do this every time someone returns from the market.

1. Click **Expenses** in the top navigation bar.
2. Click the **Add Expense** button (top right).
3. Fill in the form:
   - **Amount** — total money spent (e.g., `450`)
   - **Items** — type each item and click **Add** (e.g., "Rice", "Onion", "Oil")
   - **Description** — optional note (e.g., "Weekly grocery run")
4. Click **Save Expense**.

The expense is instantly added to the list and the balance updates on the Dashboard.

---

### 🐷 Step 4 — Log a Contribution (When Someone Puts Money In)

> Do this whenever a mess member hands over their monthly share.

1. Click **Contributions** in the top navigation bar.
2. Click the **Add Contribution** button (top right).
3. Fill in the form:
   - **Amount** — money contributed (e.g., `1500`)
   - **Date** — date the money was received
4. Click **Save Contribution**.

The contribution appears in the history list with a **pending** badge. The **Current Balance** on the Dashboard increases automatically.

---

### 📊 Step 5 — Monitor the Balance

At any time, check the **Contributions** page or the **Dashboard** for:

| Metric | Where to find it |
|--------|-----------------|
| How much money is left | Dashboard → **Current Balance** |
| Total spent this month | Expenses → **Monthly Expenses** card |
| Total contributed this month | Contributions → **Monthly Contributions** card |
| Recent transactions | Dashboard → **Recent Activity** |

> 💡 **Tip:** If the balance goes negative, it means expenses have exceeded contributions — time to collect more money from the members!

---

### 🔄 Day-to-Day Workflow

```
Market duty person goes shopping
        ↓
Come back and open the app
        ↓
Go to Expenses → Add Expense
(enter amount + items bought)
        ↓
Balance updates automatically on Dashboard
```

```
Mess member pays their monthly share
        ↓
Open the app
        ↓
Go to Contributions → Add Contribution
(enter amount + date)
        ↓
Balance increases on Dashboard
```

---

## 🗄️ Database Schema (Supabase)

Three tables in your Supabase project:

### `expenses`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Auto-generated primary key |
| `date` | timestamptz | Date of the expense |
| `amount` | numeric | Amount in ₹ |
| `items` | text[] | Array of purchased items |
| `description` | text | Optional notes |
| `created_at` | timestamptz | Row creation timestamp |

### `contributions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Auto-generated primary key |
| `date` | timestamptz | Date of contribution |
| `amount` | numeric | Amount in ₹ |
| `status` | text | `pending` or `completed` |
| `created_at` | timestamptz | Row creation timestamp |

### `market_duty`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Auto-generated primary key |
| `duty_days` | text[] | Array of weekday names (e.g., `["Monday", "Thursday"]`) |
| `updated_at` | timestamptz | Last updated timestamp |

> ⚠️ **RLS must be disabled** on all three tables (no authentication is used).

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js ≥ 18.x
- npm
- A [Supabase](https://supabase.com) project

---

### 1. Clone the repository
```bash
git clone https://github.com/Sahnik0/Mess-Management.git
cd Mess-Management
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create Supabase tables
Go to your Supabase project → **SQL Editor** and run:

```sql
create table expenses (
  id uuid default gen_random_uuid() primary key,
  date timestamptz not null,
  amount numeric not null,
  items text[] not null default '{}',
  description text,
  created_at timestamptz default now()
);

create table contributions (
  id uuid default gen_random_uuid() primary key,
  date timestamptz not null,
  amount numeric not null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create table market_duty (
  id uuid default gen_random_uuid() primary key,
  duty_days text[] not null default '{}',
  updated_at timestamptz default now()
);

-- Disable Row Level Security (no auth used)
alter table expenses disable row level security;
alter table contributions disable row level security;
alter table market_duty disable row level security;
```

### 4. Configure environment variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> Find these in your Supabase dashboard → **Project Settings → API**

### 5. Start the development server
```bash
cd Mess-Management
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS |
| **Database / Backend** | Supabase (PostgreSQL) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Routing** | React Router v6 |

---

## 📁 Project Structure

```
Mess-Management/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Navigation bar + page wrapper
│   ├── hooks/
│   │   ├── useExpenses.ts      # Fetch/add expenses from Supabase
│   │   ├── useContributions.ts # Fetch/add contributions from Supabase
│   │   └── useMarketDuty.ts    # Fetch/update duty schedule from Supabase
│   ├── lib/
│   │   └── supabase.ts         # Supabase client initialization
│   ├── pages/
│   │   ├── Dashboard.tsx       # Overview + charts
│   │   ├── Expenses.tsx        # Expense list + add form
│   │   ├── Contributions.tsx   # Contribution list + add form
│   │   └── MarketDuty.tsx      # Duty schedule selector
│   ├── types/
│   │   └── models.ts           # TypeScript interfaces
│   └── App.tsx                 # Route definitions
├── .env                        # Supabase credentials (not committed)
├── package.json
└── vite.config.ts
```

---

## 🔑 Key Design Decisions

- **No Authentication** — The app is intentionally open. All mess members share the same data. No login needed.
- **Single Shared State** — Market duty, expenses, and contributions are global to the entire mess group.
- **Supabase as Backend** — Uses Supabase PostgreSQL with the JS client for all CRUD operations. No server-side code needed.

---

## 🔮 Future Improvements

- [ ] Per-member contribution tracking with names
- [ ] Monthly report generation (PDF export)
- [ ] Push/email notifications for duty reminders
- [ ] Expense approval workflow (mark as `completed`)
- [ ] Multi-mess support for multiple groups

---

## 📄 License

This project is licensed under the **MIT License**.

---

> Feel free to open issues or submit pull requests for improvements!
