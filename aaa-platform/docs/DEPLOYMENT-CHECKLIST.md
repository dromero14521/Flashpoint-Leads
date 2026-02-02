# Production Deployment Checklist

Use this checklist to ensure all steps are completed before going live.

## Pre-Deployment

### Accounts & Access
- [ ] GitHub repository access configured
- [ ] Railway account created (or VPS provisioned)
- [ ] Clerk production application created
- [ ] Stripe live mode enabled
- [ ] OpenRouter account funded
- [ ] Domain name purchased
- [ ] DNS configured (A/CNAME records)

### API Keys (Production)
- [ ] Clerk publishable key (pk_live_*)
- [ ] Clerk secret key (sk_live_*)
- [ ] Clerk webhook secret (whsec_*)
- [ ] Stripe secret key (sk_live_*)
- [ ] Stripe webhook secret (whsec_*)
- [ ] OpenRouter API key (sk-or-v1-*)
- [ ] Sentry DSN (optional but recommended)

### Database
- [ ] PostgreSQL database provisioned
- [ ] Database connection string configured
- [ ] Database migrations tested
- [ ] Backup strategy implemented
- [ ] Backup S3 bucket created (if using)

### Code Preparation
- [ ] All tests passing locally
- [ ] Environment variables template updated
- [ ] Docker images build successfully
- [ ] Health check endpoints implemented
- [ ] Error tracking configured

---

## Deployment Steps

### Railway Deployment
- [ ] Railway CLI installed
- [ ] Project initialized (`railway init`)
- [ ] Services created (control-plane, genai-core, postgres)
- [ ] Environment variables configured in Railway dashboard
- [ ] Deployed (`railway up`)
- [ ] Custom domain added
- [ ] DNS records updated
- [ ] SSL certificate verified

### VPS Deployment
- [ ] VPS provisioned (minimum 2 CPU, 4GB RAM)
- [ ] Docker & Docker Compose installed
- [ ] Repository cloned to `/app`
- [ ] `.env.production` file created and populated
- [ ] Docker containers built (`docker-compose build`)
- [ ] Services started (`docker-compose up -d`)
- [ ] Nginx configured
- [ ] Let's Encrypt certificate obtained
- [ ] Firewall configured (ports 80, 443, 22)

---

## Post-Deployment Verification

### Health Checks
- [ ] Control Plane health: `GET https://apexautomation.ai/api/health` returns 200
- [ ] GenAI Core health: `GET https://apexautomation.ai/api/genai/health` returns 200
- [ ] Database connectivity confirmed
- [ ] Services auto-restart on failure

### SSL/HTTPS
- [ ] HTTPS working (no certificate errors)
- [ ] HTTP redirects to HTTPS
- [ ] SSL Labs grade A or higher
- [ ] Security headers present (HSTS, X-Frame-Options, etc.)

### Authentication
- [ ] Clerk sign-up flow works
- [ ] Clerk sign-in flow works
- [ ] User session persists
- [ ] Webhooks receiving events
- [ ] Metadata syncing correctly

### Payments
- [ ] Stripe checkout flow works
- [ ] Test subscription created successfully
- [ ] Webhooks receiving events
- [ ] Subscription updates sync to Clerk
- [ ] Invoice emails sent

### Core Functionality
- [ ] Blueprint generation works
- [ ] Tier 1 users limited to 3 blueprints/month
- [ ] Tier 2 users have unlimited access
- [ ] Feature gating enforced correctly
- [ ] Usage tracking recording events
- [ ] Export functionality works (if enabled)

---

## Monitoring & Alerts

### Error Tracking
- [ ] Sentry project created
- [ ] Sentry DSN configured
- [ ] Test error sent and received
- [ ] Alert rules configured
- [ ] Email notifications working

### Uptime Monitoring
- [ ] UptimeRobot/Pingdom account created
- [ ] Health check monitor configured (5-min interval)
- [ ] Alert contacts added
- [ ] Test alert triggered and received

### Performance Monitoring
- [ ] Response times < 3 seconds for blueprints
- [ ] Health check latency < 500ms
- [ ] Database query performance acceptable
- [ ] No memory leaks detected

---

## Backup & Recovery

### Database Backups
- [ ] Automated backup script deployed (`scripts/backup-db.sh`)
- [ ] Cron job scheduled (daily at 2 AM)
- [ ] Backup uploaded to S3
- [ ] Retention policy configured (30 days)
- [ ] Test restore performed successfully

### Rollback Plan
- [ ] Previous deployment documented
- [ ] Rollback procedure tested
- [ ] Database backup before deployment
- [ ] Migration rollback scripts ready

---

## CI/CD Pipeline

### GitHub Actions
- [ ] Workflow file committed (`.github/workflows/deploy.yml`)
- [ ] GitHub secrets configured
  - [ ] `RAILWAY_TOKEN` (or VPS credentials)
  - [ ] `RAILWAY_DOMAIN`
  - [ ] Other secrets as needed
- [ ] Test workflow manually triggered
- [ ] Deployment succeeds on push to main
- [ ] Smoke tests pass after deployment

---

## Security

### Environment Variables
- [ ] No secrets committed to git
- [ ] `.env.production` in `.gitignore`
- [ ] All API keys use production/live mode
- [ ] Secrets rotated from development

### Access Control
- [ ] GitHub repository access restricted
- [ ] Railway/VPS access limited to admins
- [ ] SSH key-only authentication (no passwords)
- [ ] Firewall rules configured
- [ ] Database not exposed publicly

### Headers & Policies
- [ ] HTTPS enforced (HSTS)
- [ ] XSS protection enabled
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] CSP headers configured

---

## Documentation

### Internal Docs
- [ ] Production URLs documented
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Troubleshooting guide updated
- [ ] Runbook created for on-call

### External Docs
- [ ] User documentation published
- [ ] API documentation available
- [ ] Changelog maintained
- [ ] Support channels listed

---

## Final Steps

### Launch Preparation
- [ ] Announce maintenance window (if migrating)
- [ ] Notify stakeholders of launch
- [ ] Prepare social media announcements
- [ ] Update status page

### Go-Live
- [ ] Final smoke test passed
- [ ] Monitoring dashboard open
- [ ] Team on standby for issues
- [ ] Domain DNS propagated (check with `dig apexautomation.ai`)

### Post-Launch
- [ ] Monitor error rates (first 24 hours)
- [ ] Check performance metrics
- [ ] Verify backup ran successfully
- [ ] Respond to user feedback
- [ ] Document any issues and resolutions

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| **Primary** | [Your Name] | [Phone/Email] |
| **Backend** | [Developer] | [Phone/Email] |
| **DevOps** | [Engineer] | [Phone/Email] |
| **Support** | [Team] | [support@apexautomation.ai] |

---

## Quick Commands Reference

```bash
# Railway
railway logs --service control-plane
railway restart
railway domain

# Docker VPS
docker-compose ps
docker-compose logs -f
docker-compose restart control-plane
docker-compose up -d --build

# Database
scripts/backup-db.sh
scripts/restore-db.sh /path/to/backup.sql.gz
docker-compose exec postgres psql -U aaa -d aaa_production

# Health Checks
curl https://apexautomation.ai/api/health
curl https://apexautomation.ai/api/genai/health

# SSL
sudo certbot renew
sudo certbot certificates

# Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/backup.log
docker-compose logs --tail=100 control-plane
```

---

## Success Criteria

Deployment is considered successful when:

- ✅ All health checks return 200 OK
- ✅ HTTPS working with valid certificate
- ✅ Authentication flow complete
- ✅ Payment flow functional
- ✅ Blueprint generation working
- ✅ Feature gating enforced
- ✅ Monitoring alerts configured
- ✅ Backups running successfully
- ✅ No critical errors in logs
- ✅ Response times acceptable

---

**Congratulations! Your AAA Platform is live! 🎉**

Continue monitoring for the first 48 hours to catch any issues early.
