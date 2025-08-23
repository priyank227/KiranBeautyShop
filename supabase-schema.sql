-- Supabase Schema for Kiran Beauty Shop

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills table
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

-- Create indexes for better performance
CREATE INDEX idx_bills_device_id ON bills(device_id);
CREATE INDEX idx_bills_created_at ON bills(created_at);

-- Insert some sample products
INSERT INTO products (name) VALUES 
    ('Lipstick'),
    ('Powder'),
    ('Eyeliner'),
    ('Foundation'),
    ('Mascara'),
    ('Blush'),
    ('Nail Polish'),
    ('Face Cream'),
    ('Sunscreen'),
    ('Makeup Remover');

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no authentication)
CREATE POLICY "Allow public read access to products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to products" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to bills" ON bills
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to bills" ON bills
    FOR INSERT WITH CHECK (true); 