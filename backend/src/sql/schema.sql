-- Roy's Hotel Management System
-- Database: roys_hotel

CREATE DATABASE IF NOT EXISTS roys_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE roys_hotel;

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO roles (id, name, slug) VALUES
  (1, 'Super Admin', 'super_admin'),
  (2, 'Admin', 'admin');

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(36) PRIMARY KEY,
  role_id TINYINT UNSIGNED NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Hotel Settings (singleton)
CREATE TABLE IF NOT EXISTS settings (
  id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  hotel_name VARCHAR(200) NOT NULL DEFAULT 'Roy''s Book My Square Coliving',
  address TEXT,
  phone VARCHAR(30),
  email VARCHAR(150),
  gst_number VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO settings (id) VALUES (1);

-- Floors
CREATE TABLE IF NOT EXISTS floors (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  number INT NOT NULL,
  total_rooms INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(36) PRIMARY KEY,
  floor_id VARCHAR(36) NOT NULL,
  floor_number INT NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  room_type VARCHAR(50),
  bed_type VARCHAR(50),
  ac_type ENUM('A/C', 'Non A/C') DEFAULT 'Non A/C',
  total_beds INT NOT NULL DEFAULT 1,
  cost_per_bed DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE,
  UNIQUE KEY uk_floor_room (floor_number, room_number)
);

-- Beds
CREATE TABLE IF NOT EXISTS beds (
  id VARCHAR(36) PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  floor_id VARCHAR(36) NOT NULL,
  floor_number INT NOT NULL,
  bed_number INT NOT NULL,
  bed_type VARCHAR(50),
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('vacant', 'occupied', 'reserved') DEFAULT 'vacant',
  customer_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  aadhaar VARCHAR(20),
  pan VARCHAR(20),
  emergency_contact VARCHAR(20),
  photo_url TEXT,
  aadhaar_doc_url TEXT,
  pan_doc_url TEXT,
  status ENUM('checked-in', 'checked-out') DEFAULT 'checked-in',
  room_id VARCHAR(36) NULL,
  bed_id VARCHAR(36) NULL,
  room_number VARCHAR(20) NULL,
  bed_number INT NULL,
  floor_number INT NULL,
  check_in_date DATE,
  check_in_datetime DATETIME NULL,
  check_out_date DATE NULL,
  check_out_datetime DATETIME NULL,
  stay_type VARCHAR(20) NULL,
  security_deposit DECIMAL(12,2) DEFAULT 0,
  monthly_rent DECIMAL(12,2) DEFAULT 0,
  due_day TINYINT UNSIGNED NULL,
  joining_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  FOREIGN KEY (bed_id) REFERENCES beds(id) ON DELETE SET NULL
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  bed_id VARCHAR(36) NOT NULL,
  room_id VARCHAR(36) NOT NULL,
  room_number VARCHAR(20) NOT NULL,
  bed_number INT NOT NULL,
  floor_number INT NOT NULL,
  stay_type ENUM('Hours', 'Days', 'Weeks', 'Months') NOT NULL DEFAULT 'Days',
  booking_type ENUM('Daily', 'Weekly', 'Monthly') GENERATED ALWAYS AS (
    CASE stay_type
      WHEN 'Hours' THEN 'Daily'
      WHEN 'Days' THEN 'Daily'
      WHEN 'Weeks' THEN 'Weekly'
      WHEN 'Months' THEN 'Monthly'
    END
  ) STORED,
  duration INT NOT NULL DEFAULT 1,
  bed_cost DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  advance_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  security_deposit DECIMAL(12,2) DEFAULT 0,
  monthly_rent DECIMAL(12,2) DEFAULT 0,
  payment_type ENUM('Cash', 'UPI', 'Card', 'Bank Transfer') DEFAULT 'Cash',
  payment_status ENUM('pending', 'completed') DEFAULT 'pending',
  status ENUM('reserved', 'active', 'completed', 'booked', 'checked-out') DEFAULT 'active',
  check_in_date DATE NOT NULL,
  check_in_datetime DATETIME NULL,
  check_out_datetime DATETIME NULL,
  extended_upto DATETIME NULL,
  extended_amount DECIMAL(12,2) DEFAULT 0,
  extended_status ENUM('pending', 'completed') DEFAULT 'pending',
  extended_payment_type VARCHAR(30) NULL,
  extended_payment_date DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (bed_id) REFERENCES beds(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Booking Payments
CREATE TABLE IF NOT EXISTS booking_payments (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATETIME NOT NULL,
  payment_type ENUM('Cash', 'UPI', 'Card', 'Bank Transfer') DEFAULT 'Cash',
  status ENUM('pending', 'completed') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Booking Shifts
CREATE TABLE IF NOT EXISTS booking_shifts (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  shift_type VARCHAR(50) DEFAULT 'Room Shift',
  old_room_number VARCHAR(20),
  old_bed_number INT,
  old_floor_number INT,
  new_room_number VARCHAR(20),
  new_bed_number INT,
  new_floor_number INT,
  shift_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Monthly Tenants
CREATE TABLE IF NOT EXISTS monthly_tenants (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL UNIQUE,
  booking_id VARCHAR(36) NULL,
  customer_name VARCHAR(150) NOT NULL,
  room_number VARCHAR(20),
  bed_id VARCHAR(36) NULL,
  monthly_rent DECIMAL(12,2) NOT NULL,
  due_day TINYINT UNSIGNED NOT NULL DEFAULT 1,
  last_paid_month VARCHAR(20) NULL,
  status ENUM('paid', 'pending', 'partial', 'due_soon') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- Monthly Payment History
CREATE TABLE IF NOT EXISTS monthly_payments (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  booking_id VARCHAR(36) NULL,
  room_number VARCHAR(20),
  month_label VARCHAR(20) NOT NULL,
  monthly_rent DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  pending_amount DECIMAL(12,2) DEFAULT 0,
  payment_mode ENUM('Cash', 'UPI', 'Card', 'Bank Transfer') NULL,
  status ENUM('paid', 'pending', 'partial') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES monthly_tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE KEY uk_tenant_month (tenant_id, month_label)
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(36) PRIMARY KEY,
  expense_name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  notes TEXT,
  created_by VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Indexes are created idempotently at startup via src/config/initDb.js (ensureIndexes)
