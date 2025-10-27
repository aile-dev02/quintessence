# TestMemo Deployment Guide

## 🚀 Quick Deployment Options

### 1. Netlify Deployment (Recommended)

#### Option A: Drag & Drop
1. Run `npm run build`
2. Drag the `dist/` folder to [netlify.com/drop](https://netlify.com/drop)
3. Your app is live instantly!

#### Option B: Git Integration
1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `20`

### 2. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Follow the prompts for automatic deployment
```

### 3. GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts
"deploy": "gh-pages -d dist"

# Deploy
npm run build
npm run deploy
```

## ⚙️ Environment Configuration

### Production Environment Variables
Create `.env.production` file:

```bash
VITE_APP_TITLE="TestMemo - Production"
VITE_ENABLE_ANALYTICS="true"
VITE_BUILD_DATE="${new Date().toISOString()}"
```

### Staging Environment
Create `.env.staging` file:

```bash
VITE_APP_TITLE="TestMemo - Staging"
VITE_ENABLE_ANALYTICS="false"
VITE_DEBUG_MODE="true"
```

## 🔧 Server Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/testmemo/dist;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PWA files
    location /sw.js {
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

### Apache Configuration (.htaccess)
```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
```

## 📊 Performance Optimization

### Build Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Preview production build
npm run preview
```

### CDN Configuration
For optimal performance, serve static assets from a CDN:

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})
```

## 🔒 Security Headers

Add these headers for production:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## 📋 Pre-deployment Checklist

- [ ] All tests passing (`npm run test`)
- [ ] ESLint issues resolved (`npm run lint`)
- [ ] Production build successful (`npm run build`)
- [ ] PWA functionality tested
- [ ] Responsive design verified
- [ ] Accessibility tested
- [ ] Performance metrics checked
- [ ] Environment variables configured
- [ ] Domain and SSL configured
- [ ] Analytics/monitoring setup

## 🚨 Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

**PWA Not Working**
- Check service worker registration
- Verify manifest.json accessibility
- Test in incognito mode

**Routing Issues**
- Ensure server handles client-side routing
- Check base URL configuration
- Verify build output structure

### Monitoring

**Performance Monitoring**
- Use Lighthouse CI for automated performance testing
- Monitor Core Web Vitals
- Set up error tracking (Sentry, Bugsnag)

**Analytics**
- Google Analytics 4 integration
- User behavior tracking
- Performance metrics dashboard

---

*Deployment guide last updated: October 27, 2025*