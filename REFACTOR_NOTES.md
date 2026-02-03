# 📊 Struktur Refactoring LaporanPage

Laporan Page telah direfactor dari 1 file besar menjadi 5 component terpisah agar lebih mudah di-maintain dan dibaca.

## 🏗️ Struktur Folder

```
client/src/
├── components/
│   └── LaporanComponents/
│       ├── FilterSection.tsx          # Filter & date range
│       ├── SummaryCards.tsx           # Summary cards (Periode, Hari Ini, Tahun Ini)
│       ├── Charts.tsx                 # Area chart & Bar chart
│       ├── MonthlyFinanceTable.tsx    # Table keuangan per bulan
│       ├── BrandAnalysis.tsx          # Brand pie chart & table
│       └── index.ts                   # Export semua components
├── pages/
│   └── LaporanPage.tsx                # Main page yang menggunakan semua components
```

## 📋 Penjelasan Tiap Component

### 1. **FilterSection.tsx**

- Menampilkan filter inputs (Start Date, End Date, Brand, Metode Bayar)
- Tombol preset (7 Hari, 30 Hari, Bulan Ini, Tahun Ini)
- Semua handler dipass sebagai props dari parent

### 2. **SummaryCards.tsx**

- 3 card utama:
  - **Ringkasan Periode**: Grid 5 kolom (Pemasukan, Laba Bersih, Laba Kotor, Modal, Transaksi)
  - **Hari Ini**: Gradient blue dengan ringkasan hari ini
  - **Tahun Ini**: Gradient slate dengan ringkasan tahun ini
- Styling dengan gradient borders dan hover effects

### 3. **Charts.tsx**

- **Area Chart**: Menampilkan trend penjualan & profit per hari
  - 2 area: Penjualan (blue) & Profit (green)
  - Custom gradient fill dan tooltip
- **Bar Chart**: Jumlah transaksi per hari
  - Bar berwarna purple dengan radius
  - Same date range sebagai Area Chart

### 4. **MonthlyFinanceTable.tsx**

- Table 12 bulan dengan kolom:
  - Bulan, Pemasukan, Modal, Laba Kotor, Laba Bersih, Transaksi
- Zebra striping untuk readability
- Hover effect untuk interactive feel

### 5. **BrandAnalysis.tsx**

- **Time Range Buttons**: Hari Ini, Bulan Ini, Tahun Ini, Custom
- **Custom Date Inputs**: Muncul ketika pilih "Custom"
- **Pie Chart**: Donat chart distribusi brand dengan warna dari `getBrandColor`
- **Brand Table**: Tabel detail per brand dengan warna indicator

## 🔄 Data Flow

```
LaporanPage (State Management)
│
├── Fetch data dengan useGetPenjualan
├── Calculate di useMemo (items, summary, dailySeries, etc.)
│
├─→ FilterSection (handlers)
├─→ SummaryCards (summary data)
├─→ Charts (dailySeries)
├─→ MonthlyFinanceTable (monthlyFinance)
└─→ BrandAnalysis (brandSummary, brandPieData)
```

## ✨ Keuntungan Struktur Baru

1. **Easier to Maintain**: Setiap component memiliki tanggung jawab single
2. **Reusable**: Components bisa digunakan di halaman lain
3. **Better Performance**: Component render isolated
4. **Cleaner Code**: LaporanPage.tsx jadi lebih sederhana (~70 lines untuk return)
5. **Easier Testing**: Tiap component bisa di-test terpisah

## 🎨 Design Improvements

✓ Gradient cards untuk visual depth  
✓ Emojis di heading untuk visual cues  
✓ Hover effects untuk interactivity  
✓ Better spacing & padding consistency  
✓ Color-coded metrics (Blue, Emerald, Purple, Orange, Slate)  
✓ Brand color indicator dengan dots  
✓ Responsive grid layouts

## 📝 Usage in LaporanPage

```tsx
<FilterSection
  startDate={startDate}
  endDate={endDate}
  filterBrand={filterBrand}
  // ... other props
  onPreset7Days={() => { /* ... */ }}
  // ... other handlers
/>

<SummaryCards summary={summary} yearSummary={yearSummary} />

<Charts dailySeries={dailySeries} startDate={startDate} endDate={endDate} />

<MonthlyFinanceTable data={monthlyFinance} />

<BrandAnalysis
  brandSummary={brandSummary}
  brandPieData={brandPieData}
  // ... other props
/>
```

## 🚀 Next Steps (Optional Enhancements)

1. Add export to CSV/PDF functionality
2. Add year-over-year comparison
3. Add custom date range picker (date picker library)
4. Add loading skeleton for each section
5. Add error handling & retry logic
