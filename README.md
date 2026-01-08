# Dams Wallet

Personal Finance Management & Budgeting App developed with [Next.js](https://nextjs.org).

## 🌟 Features

### 📊 Dashboard & Analytics

The dashboard provides a comprehensive view of your financial health through various cards and detailed infographics.

#### 1. Monthly Summary Cards
Located at the top of the dashboard, these three cards provide a quick snapshot of the current month's performance:
- **Total Income**: Sum of all transactions categorized as 'Income' for the current month.
- **Total Expense**: Sum of all transactions categorized as 'Expense' for the current month.
- **Net Savings**: Calculated as `Total Income - Total Expense`.
  - **Blue**: Positive savings.
  - **Red**: Negative savings (Expenses exceeded Income).

#### 2. Category Breakdown
A visual breakdown of where your money is going or coming from.
- **Tabs**: Switch between **Income** and **Expense** views.
- **Visualization**: Categories are sorted by value (highest to lowest).
- **Calculation**: Each category's bar length represents its percentage relative to the highest spending/income category of the period.

#### 3. Financial Health Insights (Smart Summary)
Intelligent analysis of your financial data providing actionable insights:
- **Status Indicators**:
  - ✅ **Positive**: Healthy financial behaviors (e.g., high savings rate).
  - ⚠️ **Warning**: Areas needing attention (e.g., fixed costs exceeding recommended ratios).
  - 📈 **Neutral/Info**: General trends.

#### 4. Fixed vs. Variable Cost Ratio
This card helps analyze your spending flexibility:
- **Fixed Costs**: Includes essential categories like Debt, Bills, Utilities, Rent/Mortgage.
- **Variable Costs**: Discretionary spending like Shopping, Entertainment, Dining Out.
- **The Calculation**:
  ```
  Fixed Ratio = (Fixed Costs / Total Expenses) * 100
  ```
- **Health Check**:
  - **Healthy**: Fixed costs are < 60%.
  - **Warning**: Fixed costs are > 60% (indicates low financial flexibility).

#### 5. Trend Analysis
- **Daily Expense (This Month)**: An area chart showing daily spending fluctuations to help identify spending spikes.
- **Last 6 Months Trend**: A bar chart comparing Income vs. Expense side-by-side for the last half-year, helping you track long-term stability.

---

### 💼 Wallet Management
- **Multiple Wallets**: Create and manage distinct wallets (e.g., Cash, Bank, E-Wallet).
- **Balance Tracking**: Input and update initial balances.

### 📝 Transaction Management
- **Add Transactions**: Quickly log Income or Expenses with categories, dates, and notes.
- **Filtering**: Filter transactions by Date range, Type (Income/Expense), or Category.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: MongoDB (via Mongoose)

---

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

- `src/components/dashboard`: Contains analytics cards (MonthlySummary, DailyTrend, etc.).
- `src/components/analytics`: Advanced analysis logic and health checks.
- `src/lib`: Utility functions and category definitions.
