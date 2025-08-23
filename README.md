# Kiran Beauty Shop - Billing System

A mobile-first beauty store billing webapp built with Next.js, Supabase, and TailwindCSS. This application allows store owners to create bills, manage products, and generate thermal printer-ready receipts.

## 🚀 Features

- **Mobile-First Design**: Optimized for mobile devices with responsive UI
- **Device-Specific Billing**: Each device has isolated carts and bill history
- **Product Management**: Add and manage beauty product names
- **Bill Creation**: Create bills with multiple items, quantities, and prices
- **PDF Receipts**: Auto-generate and store PDF receipts in Supabase Storage
- **Thermal Printer Support**: 80mm width receipt format for thermal printers
- **Bill History**: View and reprint previous bills
- **PWA Support**: Installable as a mobile app
- **No Authentication Required**: Simple device-based identification

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) with JSX
- **Styling**: TailwindCSS
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage for PDF receipts
- **PDF Generation**: jsPDF + html2canvas
- **Deployment**: Vercel
- **PWA**: Service Worker + Manifest

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account and project
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd kiranBeautyShop
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Create a storage bucket named `receipts` for PDF storage
4. Get your project URL and anon key from Settings > API

### 3. Environment Variables

Create `.env.local` file:

```bash
cp env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## 🗄️ Database Schema

### Products Table
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bills Table
```sql
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_no SERIAL UNIQUE,
    device_id TEXT NOT NULL,
    customer_name TEXT,
    items JSONB NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📱 PWA Setup

The app is configured as a Progressive Web App:

- **Manifest**: `/public/manifest.json`
- **Service Worker**: `/public/sw.js`
- **Icons**: Various sizes for different devices
- **Install Prompt**: Users can install the app on mobile devices

## 🖨️ Receipt Format

Receipts are formatted for 80mm thermal printers:
- Store header with logo/name
- Bill details (number, date, customer)
- Itemized list with quantities and prices
- Total amount
- Thank you message

## 🚀 Deployment on Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📁 Project Structure

```
kiranBeautyShop/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── history/           # Bill history page
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Home page (bill creation)
├── lib/                   # Utility functions
│   └── supabase.js        # Supabase client & helpers
├── public/                # Static assets
│   ├── manifest.json      # PWA manifest
│   └── sw.js             # Service worker
├── supabase-schema.sql    # Database schema
├── package.json           # Dependencies
└── README.md              # This file
```

## 🔧 Customization

### Adding New Products
- Use the admin interface or directly insert into the `products` table
- Products are automatically available in the billing dropdown

### Modifying Receipt Format
- Edit the receipt template in `app/page.js` and `app/history/page.js`
- Adjust the 80mm width styling for different printer sizes

### Styling Changes
- Modify `app/globals.css` for global styles
- Update TailwindCSS classes in components
- Customize colors in `tailwind.config.js`

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Check environment variables
   - Verify Supabase project is active
   - Check RLS policies

2. **PDF Generation Fails**
   - Ensure html2canvas is working
   - Check browser console for errors
   - Verify receipt element exists

3. **PWA Not Installing**
   - Check manifest.json syntax
   - Verify service worker is registered
   - Test on HTTPS (required for PWA)

### Debug Mode

Enable debug logging by adding to `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Supabase and Next.js documentation

---

**Built with ❤️ for beauty shop owners everywhere** 