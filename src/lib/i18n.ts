export type Locale = 'id' | 'en'

const translations = {
  id: {
    appName: 'Kalkulator Toko',
    loading: 'Memuat…',
    saving: 'Menyimpan…',
    save: 'Simpan',
    cancel: 'Batal',
    edit: 'Ubah',
    delete: 'Hapus',
    back: 'Kembali',
    history: 'Riwayat',
    customers: 'Pelanggan',
    settings: 'Pengaturan',
    customer: 'Pelanggan:',
    walkin: 'Tanpa pelanggan (ketuk untuk memilih)',
    backToEdit: '← Kembali ke Edit',
    confirmTitle: 'Konfirmasi Transaksi',
    totalAmount: 'Total',
    walkinCustomer: 'Pelanggan umum',
    changeCustomer: 'Ganti ›',
    saveAndNew: 'Simpan & Transaksi Baru',
    toastSaved: (amt: string) => `Tersimpan ✓ ${amt}`,
    historyTitle: 'Riwayat',
    export: 'Ekspor',
    filterFrom: 'Dari',
    filterTo: 'Sampai',
    filterCustomer: 'Pelanggan',
    allCustomers: 'Semua pelanggan',
    noTransactions: 'Tidak ada transaksi',
    noTransactionsFiltered: 'Tidak ada transaksi',
    transactions: (n: number) => `${n} transaksi`,
    total: 'Total',
    expression: 'Ekspresi',
    amount: 'Jumlah',
    walkIn: 'Tanpa pelanggan',
    walkinLabel: '—',
    prevPage: '← Sebelumnya',
    nextPage: 'Selanjutnya →',
    customersTitle: 'Pelanggan',
    searchByName: 'Cari nama…',
    noCustomersYet: 'Belum ada pelanggan',
    noCustomersMatching: (q: string) => `Tidak ada pelanggan "${q}"`,
    addCustomer: 'Tambah Pelanggan',
    adding: 'Menambahkan…',
    customerName: 'Nama pelanggan',
    lastTransaction: 'Terakhir',
    noTransactionsShort: 'Belum ada transaksi',
    customerDetail: 'Detail Pelanggan',
    noTransactionsPeriod: 'Tidak ada transaksi di periode ini',
    deleteCustomer: 'Hapus Pelanggan (riwayat tetap disimpan)',
    searchCustomer: 'Cari pelanggan...',
    walkinOption: 'Tanpa pelanggan',
    currentSelection: '✓ sekarang',
    noCustomersFound: (q: string) => `Tidak ada pelanggan untuk "${q}"`,
    settingsTitle: 'Pengaturan',
    language: 'Bahasa',
    languageId: 'Indonesia',
    languageEn: 'Inggris',
    theme: 'Tema',
    themeDark: 'Gelap',
    themeLight: 'Terang',
    themeSystem: 'Ikuti sistem',
    exportTitle: 'Ekspor Transaksi',
    exportPreparing: 'Menyiapkan…',
    exportColDate: 'Tanggal',
    exportColCustomer: 'Pelanggan',
    exportColExpr: 'Ekspresi',
    exportColAmount: 'Jumlah',
    exportReportTitle: 'Laporan Transaksi',
  },
  en: {
    appName: 'Shop Calc',
    loading: 'Loading…',
    saving: 'Saving…',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    history: 'History',
    customers: 'Customers',
    settings: 'Settings',
    customer: 'Customer:',
    walkin: 'Walk-in (tap to assign)',
    backToEdit: '← Back to Edit',
    confirmTitle: 'Confirm Transaction',
    totalAmount: 'Total Amount',
    walkinCustomer: 'Walk-in customer',
    changeCustomer: 'Change ›',
    saveAndNew: 'Save & New Transaction',
    toastSaved: (amt: string) => `Saved ✓ ${amt}`,
    historyTitle: 'History',
    export: 'Export',
    filterFrom: 'From',
    filterTo: 'To',
    filterCustomer: 'Customer',
    allCustomers: 'All customers',
    noTransactions: 'No transactions found',
    noTransactionsFiltered: 'No transactions found',
    transactions: (n: number) => `${n} transaction${n !== 1 ? 's' : ''}`,
    total: 'Total',
    expression: 'Expression',
    amount: 'Amount',
    walkIn: 'Walk-in',
    walkinLabel: '—',
    prevPage: '← Prev',
    nextPage: 'Next →',
    customersTitle: 'Customers',
    searchByName: 'Search by name…',
    noCustomersYet: 'No customers yet',
    noCustomersMatching: (q: string) => `No customers matching "${q}"`,
    addCustomer: 'Add Customer',
    adding: 'Adding…',
    customerName: 'Customer name',
    lastTransaction: 'Last',
    noTransactionsShort: 'No transactions',
    customerDetail: 'Customer Detail',
    noTransactionsPeriod: 'No transactions in this period',
    deleteCustomer: 'Delete Customer (keep transaction history)',
    searchCustomer: 'Search customer...',
    walkinOption: 'Walk-in customer (no assignment)',
    currentSelection: '✓ current',
    noCustomersFound: (q: string) => `No customers found for "${q}"`,
    settingsTitle: 'Settings',
    language: 'Language',
    languageId: 'Indonesian',
    languageEn: 'English',
    theme: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeSystem: 'System',
    exportTitle: 'Export Transactions',
    exportPreparing: 'Preparing…',
    exportColDate: 'Date',
    exportColCustomer: 'Customer',
    exportColExpr: 'Expression',
    exportColAmount: 'Amount',
    exportReportTitle: 'Transaction Report',
  },
} as const

type RawTranslations = typeof translations['id']
export type Translations = {
  [K in keyof RawTranslations]: RawTranslations[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : string
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] as unknown as Translations
}

export function formatAmount(n: number, locale: Locale): string {
  return n.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US')
}

export function formatCurrency(n: number, locale: Locale): string {
  return `Rp ${formatAmount(n, locale)}`
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US')
}
