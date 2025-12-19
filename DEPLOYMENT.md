# Deployment Guide

## Prerequisites

- GitHub account
- Vercel account
- Neon PostgreSQL account (or connected via Vercel)
- Upstash Redis account (or connected via Vercel)

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Test Case Management System"

# Create a GitHub repository and push
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `pnpm build` (or leave default)
   - Output Directory: `.next` (default)

### 3. Add Integrations

#### Neon PostgreSQL Integration

1. In Vercel project settings, go to "Integrations"
2. Search for "Neon" and click "Add Integration"
3. Follow the setup wizard to connect your Neon database
4. Vercel will automatically add these environment variables:
   - `DATABASE_URL`
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

#### Upstash Redis Integration

1. In Vercel project settings, go to "Integrations"
2. Search for "Upstash" and click "Add Integration"
3. Follow the setup wizard to connect your Upstash Redis instance
4. Vercel will automatically add these environment variables:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 4. Add Custom Environment Variables

In Vercel project settings, go to "Environment Variables" and add:

```
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
```

**Important:** Generate a strong random string for `JWT_SECRET`:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

### 5. Run Database Migrations

#### Option A: Using Neon SQL Editor

1. Go to your Neon dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `scripts/01-create-schema.sql`
4. Execute the script
5. Copy and paste the contents of `scripts/02-seed-data.sql`
6. Execute the script

#### Option B: Using psql

```bash
# Connect to your Neon database
psql $DATABASE_URL

# Run migrations
\i scripts/01-create-schema.sql
\i scripts/02-seed-data.sql
```

### 6. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Visit your deployed URL

### 7. Verify Deployment

1. Visit your application URL
2. Try logging in with demo credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Check that all features work:
   - Dashboard loads with data
   - Projects are visible
   - Test cases can be viewed
   - Analytics display correctly

## Production Checklist

Before going live, ensure:

- [ ] All environment variables are set
- [ ] Database schema is created and seeded
- [ ] Redis is connected and accessible
- [ ] JWT_SECRET is a strong, random string
- [ ] Demo users are created (or remove seed data)
- [ ] CORS settings are configured if using custom domain
- [ ] Rate limiting is enabled
- [ ] Error tracking is set up (e.g., Sentry)
- [ ] Custom domain is configured (optional)
- [ ] SSL certificate is valid
- [ ] Analytics are set up (e.g., Vercel Analytics)

## Environment-Specific Configuration

### Development
```env
JWT_SECRET=dev-secret-key
NODE_ENV=development
```

### Production
```env
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```

## Continuous Deployment

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Preview Deployments

Create a branch for feature development:

```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
```

Vercel will create a preview deployment for each branch.

## Monitoring

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Monitor page views, performance, and errors
3. Set up alerts for downtime or errors

### Database Monitoring

1. Check Neon dashboard for connection pool usage
2. Monitor query performance
3. Set up alerts for high CPU or memory usage

### Redis Monitoring

1. Check Upstash dashboard for memory usage
2. Monitor connection count
3. Set up alerts for high memory usage

## Rollback Strategy

If a deployment fails:

1. Go to Vercel dashboard
2. Click on "Deployments"
3. Find the last working deployment
4. Click "..." and select "Promote to Production"

## Scaling Considerations

### Database
- Neon automatically scales compute resources
- Consider enabling autoscaling for production workloads
- Monitor connection pool size

### Redis
- Upstash automatically handles scaling
- Consider upgrading plan for higher throughput
- Monitor cache hit rates

### Application
- Vercel automatically scales Edge Functions
- Consider upgrading to Pro plan for higher limits
- Monitor function execution time

## Troubleshooting

### Build Failures

Check build logs in Vercel dashboard:
```bash
# Common issues:
# - Missing dependencies: Check package.json
# - Type errors: Run `pnpm type-check` locally
# - Build timeout: Optimize build process
```

### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Check connection string format
# Should be: postgresql://user:pass@host/db

# Verify SSL mode (Neon requires SSL)
```

### Redis Connection Issues

```bash
# Test Redis connection
curl -H "Authorization: Bearer $KV_REST_API_TOKEN" $KV_REST_API_URL/get/test

# Check environment variables are set correctly
```

### Rate Limiting Issues

If legitimate users are being rate-limited:

1. Review rate limit configuration in `lib/rate-limit.ts`
2. Consider increasing limits for production
3. Implement user-based rate limiting instead of IP-based

## Security Hardening

### Production Settings

1. **Enable HTTPS only**
   - Vercel provides automatic SSL
   - Configure HSTS headers

2. **Content Security Policy**
   ```typescript
   // In next.config.mjs
   headers: async () => [
     {
       source: '/:path*',
       headers: [
         {
           key: 'Content-Security-Policy',
           value: "default-src 'self'; script-src 'self' 'unsafe-inline'"
         }
       ]
     }
   ]
   ```

3. **Remove Demo Credentials**
   - Create real user accounts
   - Remove or change demo passwords
   - Delete seed data after testing

4. **Enable CORS Protection**
   ```typescript
   // Only allow specific origins
   const allowedOrigins = ['https://yourdomain.com']
   ```

5. **Regular Security Updates**
   ```bash
   pnpm audit
   pnpm update
   ```

## Backup Strategy

### Database Backups

Neon provides automatic backups:
1. Point-in-time recovery (7-30 days depending on plan)
2. Manual snapshots before major changes
3. Export data regularly for external backups

### Redis Backups

Upstash provides automatic persistence:
1. Data is persisted to disk
2. Automatic failover
3. Consider exporting cache configuration

## Performance Optimization

### Edge Caching

Configure edge caching in Vercel:
```typescript
// In API routes
export const config = {
  runtime: 'edge',
}
```

### Image Optimization

Use Next.js Image component:
```typescript
import Image from 'next/image'
```

### Database Query Optimization

1. Add indexes for frequently queried fields
2. Use connection pooling
3. Implement query result caching

## Cost Optimization

### Vercel
- Use preview deployments sparingly
- Monitor function execution time
- Consider Pro plan for better pricing

### Neon
- Use autoscaling to reduce idle costs
- Monitor active connections
- Consider storage limits

### Upstash
- Monitor Redis memory usage
- Clean up old cache entries
- Consider upgrade for better pricing

## Support

For deployment issues:
- Vercel Support: support@vercel.com
- Neon Support: support@neon.tech
- Upstash Support: support@upstash.com
