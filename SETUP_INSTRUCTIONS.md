# Setup Instructions for PDF Storage

## Prerequisites
- Supabase project set up
- Environment variables configured (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Setting up PDF Storage

### 1. Create Storage Bucket
1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Set bucket name: `bill`
5. Make it **Public**
6. Click **Create bucket**

### 2. Configure Storage Policies
1. In the Storage section, click on the `bill` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Use the following policy for public read access:
   ```sql
   CREATE POLICY "Allow public read access to bills" ON storage.objects
       FOR SELECT USING (bucket_id = 'bill');
   ```
5. Create another policy for public insert access:
   ```sql
   CREATE POLICY "Allow public insert access to bills" ON storage.objects
       FOR INSERT WITH CHECK (bucket_id = 'bill');
   ```

### 3. Configure CORS (Optional)
1. In Storage settings, go to **CORS** tab
2. Add the following CORS rule:
   ```
   Origin: *
   Methods: GET, POST, PUT, DELETE
   Headers: *
   ```

## Features After Setup

### Bill Creation
- Bills are automatically saved to the database
- PDFs are generated and stored in Supabase storage bucket `bill`
- PDF URLs are saved with each bill for future access

### History Page
- View all bills with PDF availability indicators
- Download stored PDFs anytime
- Generate new PDFs if storage was not available during creation
- Print receipts directly

### PDF Management
- PDFs are automatically named with bill ID and timestamp
- Stored PDFs can be downloaded multiple times
- Fallback to local PDF generation if storage fails

## Troubleshooting

### PDF Upload Fails
- Check if the `bill` bucket exists and is public
- Verify storage policies allow public access
- Check browser console for specific error messages

### Bills Not Loading
- Verify database connection and environment variables
- Check if the `bills` table exists with correct schema
- Ensure RLS policies are properly configured

### PDF Generation Issues
- Check if `jsPDF` and `html2canvas` are properly installed
- Verify the receipt HTML element exists in the DOM
- Check browser console for JavaScript errors

## Environment Variables
Make sure these are set in your `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
