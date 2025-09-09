
# Kamio - Custom Apparel E-commerce Platform

A full-stack e-commerce platform for custom jerseys and sportswear built with React, Node.js, Express, and MySQL.

## Features

- Custom jersey design and ordering
- Admin dashboard for order management
- User authentication and profiles
- Shopping cart and checkout
- Product catalog with categories
- Responsive mobile-first design

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MySQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT with bcrypt

## Deployment on Hostinger VPS

### Prerequisites

1. Hostinger VPS with Ubuntu/CentOS
2. Domain pointing to your VPS (kamio.in)
3. Root or sudo access

### Step 1: Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### Step 2: MySQL Database Setup

```bash
# Install MySQL Server
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE kamio_db;
CREATE USER 'kamio_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON kamio_db.* TO 'kamio_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import the database schema
mysql -u kamio_user -p kamio_db < /path/to/database/kamio_schema.sql
```

### Step 3: Clone and Setup Application

```bash
# Clone the repository
cd /var/www
sudo git clone https://github.com/yourusername/kamio-platform.git kamio
cd kamio

# Set proper permissions
sudo chown -R $USER:$USER /var/www/kamio
chmod -R 755 /var/www/kamio

# Install dependencies
npm install

# Create production build
npm run build
```

### Step 4: Environment Configuration

Create environment file:

```bash
# Create .env file
nano .env
```

Add the following environment variables:

```env
NODE_ENV=production
PORT=5000

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=kamio_user
MYSQL_PASSWORD=your_strong_password
MYSQL_DATABASE=kamio_db

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_here

# Domain configuration
DOMAIN=kamio.in
```

### Step 5: Nginx Setup

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/kamio.in
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name kamio.in www.kamio.in;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kamio.in www.kamio.in;

    # SSL Certificate paths (update after SSL setup)
    ssl_certificate /etc/letsencrypt/live/kamio.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kamio.in/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Root directory for static files
    root /var/www/kamio/dist;
    index index.html;

    # Handle static files
    location / {
        try_files $uri $uri/ @fallback;
    }

    # Fallback to index.html for SPA
    location @fallback {
        rewrite ^.*$ /index.html last;
    }

    # API routes
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle uploaded images
    location /uploaded_images {
        alias /var/www/kamio/uploaded_images;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Handle attached assets
    location /attached_assets {
        alias /var/www/kamio/attached_assets;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/kamio.in /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d kamio.in -d www.kamio.in

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 7: PM2 Process Management

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add this configuration:

```javascript
module.exports = {
  apps: [{
    name: 'kamio-api',
    script: 'npm',
    args: 'run start',
    cwd: '/var/www/kamio',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

Start the application:

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### Step 8: Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Check firewall status
sudo ufw status
```

### Step 9: Database Backup Setup

Create backup script:

```bash
# Create backup directory
sudo mkdir -p /var/backups/kamio

# Create backup script
sudo nano /usr/local/bin/kamio-backup.sh
```

Add backup script:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/kamio"
DB_NAME="kamio_db"
DB_USER="kamio_user"
DB_PASS="your_strong_password"
DATE=$(date +%Y%m%d_%H%M%S)

# Create MySQL backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/kamio_db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "kamio_db_*.sql" -type f -mtime +7 -delete

echo "Backup completed: kamio_db_$DATE.sql"
```

Make it executable and add to crontab:

```bash
# Make script executable
sudo chmod +x /usr/local/bin/kamio-backup.sh

# Add to crontab (daily backup at 2 AM)
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/kamio-backup.sh
```

## Local Development

For local development on your machine:

```bash
# Clone the repository
git clone https://github.com/yourusername/kamio-platform.git
cd kamio-platform

# Install dependencies
npm install

# Set up local environment
cp .env.example .env
# Edit .env with your local MySQL credentials

# Start development server
npm run dev
```

## Admin Access

- **URL**: https://kamio.in/admin/login
- **Email**: admin@kamio.com
- **Password**: admin123456

## Useful Commands

```bash
# Check application logs
pm2 logs kamio-api

# Restart application
pm2 restart kamio-api

# Check application status
pm2 status

# Monitor application
pm2 monit

# Update application
cd /var/www/kamio
git pull origin main
npm install
npm run build
pm2 restart kamio-api

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check MySQL status
sudo systemctl status mysql

# MySQL backup manually
mysqldump -u kamio_user -p kamio_db > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Common Issues

1. **Application not starting**:
   - Check PM2 logs: `pm2 logs kamio-api`
   - Verify environment variables in `.env`
   - Check MySQL connection

2. **Database connection errors**:
   - Verify MySQL service: `sudo systemctl status mysql`
   - Check credentials in `.env`
   - Ensure database exists

3. **SSL issues**:
   - Renew certificate: `sudo certbot renew`
   - Check Nginx config: `sudo nginx -t`

4. **File upload issues**:
   - Check directory permissions
   - Ensure `uploaded_images` directory exists

## Security Considerations

- Keep system packages updated
- Use strong passwords
- Enable firewall
- Regular backups
- Monitor logs
- Keep SSL certificates updated

## Support

For issues and support, contact the development team or check the project documentation.
