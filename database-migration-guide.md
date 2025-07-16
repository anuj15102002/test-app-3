# MySQL Database Migration Guide

## Prerequisites

1. Install MySQL server on your system or use a cloud MySQL service
2. Create a new database for the application
3. Update your environment variables

## Step 1: Install MySQL Client (if needed)

```bash
# Ubuntu/Debian
sudo apt-get install mysql-client

# macOS
brew install mysql-client

# Windows
# Download MySQL installer from https://dev.mysql.com/downloads/installer/
```

## Step 2: Create Database

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE shopify_popup_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional, for security)
CREATE USER 'popup_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON shopify_popup_app.* TO 'popup_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 3: Update Environment Variables

Update your `.env` file with the correct MySQL connection string:

```env
# Replace with your actual MySQL credentials
DATABASE_URL=mysql://popup_user:secure_password_here@localhost:3306/shopify_popup_app

# For production, use a more secure format:
# DATABASE_URL=mysql://username:password@your-mysql-host:3306/database_name?sslmode=require
```

## Step 4: Reset Prisma Migrations

Since we're changing database providers, we need to reset migrations:

```bash
# Remove existing migration files
rm -rf prisma/migrations

# Generate new Prisma client
npx prisma generate

# Create and apply initial migration
npx prisma migrate dev --name init
```

## Step 5: Verify Migration

```bash
# Check database connection
npx prisma db pull

# View database in Prisma Studio
npx prisma studio
```

## Production Deployment Considerations

### Environment Variables for Production:
```env
# Use connection pooling for production
DATABASE_URL=mysql://username:password@production-host:3306/database_name?connection_limit=10&pool_timeout=20&sslmode=require

# Enable SSL for production
DATABASE_URL=mysql://username:password@production-host:3306/database_name?sslcert=./client-cert.pem&sslkey=./client-key.pem&sslrootcert=./ca-cert.pem
```

### Recommended MySQL Configuration for Production:
- Enable SSL/TLS encryption
- Set up connection pooling
- Configure proper backup strategy
- Monitor performance metrics
- Set up read replicas if needed

### Cloud MySQL Services:
- **AWS RDS MySQL**
- **Google Cloud SQL for MySQL**
- **Azure Database for MySQL**
- **PlanetScale** (MySQL-compatible with built-in scaling)

## Troubleshooting

### Common Issues:

1. **Connection refused**: Check if MySQL service is running
2. **Access denied**: Verify username/password and permissions
3. **Database doesn't exist**: Create the database first
4. **SSL errors**: Configure SSL properly or disable for development

### Useful Commands:

```bash
# Test connection
mysql -h localhost -u popup_user -p shopify_popup_app

# Check Prisma connection
npx prisma db pull

# Reset database (development only)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy