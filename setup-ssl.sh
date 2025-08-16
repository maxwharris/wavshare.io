#!/bin/bash

# SSL Certificate Setup Script for wavshare.io
# Run this script on your EC2 server after nginx is configured

echo "🔒 Setting up SSL certificates for wavshare.io"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Please run as ubuntu user with sudo privileges."
   exit 1
fi

# Install Certbot if not already installed
echo "📦 Installing Certbot..."
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Check if nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "❌ nginx is not running. Please start nginx first:"
    echo "   sudo systemctl start nginx"
    exit 1
fi

# Check if nginx configuration exists
if [ ! -f "/etc/nginx/sites-available/wavshare.io" ]; then
    echo "❌ nginx configuration for wavshare.io not found."
    echo "   Please copy nginx-wavshare.io.conf to /etc/nginx/sites-available/wavshare.io first"
    exit 1
fi

# Test nginx configuration
echo "🔧 Testing nginx configuration..."
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ nginx configuration test failed. Please fix the configuration first."
    exit 1
fi

# Get SSL certificate
echo "🔐 Obtaining SSL certificate for wavshare.io and www.wavshare.io..."
sudo certbot --nginx -d wavshare.io -d www.wavshare.io --non-interactive --agree-tos --email admin@wavshare.io

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    # Test automatic renewal
    echo "🔄 Testing automatic renewal..."
    sudo certbot renew --dry-run
    
    if [ $? -eq 0 ]; then
        echo "✅ Automatic renewal test passed!"
    else
        echo "⚠️  Automatic renewal test failed. Please check the configuration."
    fi
    
    # Restart nginx to apply changes
    echo "🔄 Restarting nginx..."
    sudo systemctl restart nginx
    
    echo "🎉 SSL setup complete!"
    echo ""
    echo "Your site should now be accessible at:"
    echo "  https://wavshare.io"
    echo "  https://www.wavshare.io"
    echo ""
    echo "Certificate will auto-renew via cron job."
    
else
    echo "❌ Failed to obtain SSL certificate."
    echo "Please check:"
    echo "  1. Domain DNS is pointing to this server"
    echo "  2. Ports 80 and 443 are open in firewall"
    echo "  3. nginx is serving the domain correctly"
    exit 1
fi
