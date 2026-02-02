# Local Testing Guide - Production Keys
## Test Before You Deploy!

**Time**: 15-30 minutes
**Goal**: Verify all production keys work correctly
**Safety**: No real charges, minimal costs

---

## 🎯 What We're Testing

| Component | What We Test | Cost | Risk |
|-----------|--------------|------|------|
| **Clerk** | Sign up, sign in, user creation | Free | None - safe |
| **Stripe** | Checkout flow with test cards | Free | None - test mode |
| **OpenRouter** | Blueprint generation | ~$0.10-0.50 | Low - small amount |
| **Database** | Local SQLite | Free | None - local only |
| **Build** | TypeScript compilation | Free | None |

**Total Cost**: ~$0.10-0.50 (just for testing AI)

---

## 📝 Step 1: Set Up Test Environment

### Create Your Test Environment File

**Do this:**
```bash
cd aaa-platform/control-plane

# Copy the test template
cp .env.local.test .env.local

# Edit with your keys
nano .env.local
# OR: code .env.local
# OR: vim .env.local
```

### Fill In Your Production Keys

**Open `.env.local` and replace placeholders:**

```bash
# Clerk (Copy from your secure notes)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[paste-your-key]
CLERK_SECRET_KEY=sk_live_[paste-your-key]

# Stripe (Copy from your secure notes)
STRIPE_SECRET_KEY=sk_live_[paste-your-key]

# Stripe Price IDs (Copy all 4)
STRIPE_PRICE_TIER2_MONTHLY_99=price_[paste-id]
STRIPE_PRICE_TIER2_MONTHLY_199=price_[paste-id]
STRIPE_PRICE_TIER3_ONETIME_2500=price_[paste-id]
STRIPE_PRICE_TIER3_ONETIME_5000=price_[paste-id]

# Legacy naming (use same IDs as above)
STRIPE_ARCHITECT_MONTHLY_PRICE_ID=price_[same-as-tier2-99]
STRIPE_ARCHITECT_YEARLY_PRICE_ID=price_[same-as-tier2-199]
STRIPE_APEX_PRICE_ID=price_[same-as-tier3-2500]

# OpenRouter (Copy from your secure notes)
OPENROUTER_API_KEY=sk-or-v1-[paste-your-key]
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Sentry (Optional)
SENTRY_DSN=https://[paste-if-you-have-it]

# Keep these as-is for local testing
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_URL=http://localhost:3000
GENAI_CORE_URL=http://localhost:8000
USE_MOCK_LLM=false
ENVIRONMENT=development
```

**Save the file!**

---

## 🚀 Step 2: Start the Application

### Terminal 1: Start Control Plane (Next.js)

```bash
cd aaa-platform/control-plane

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

**Expected output:**
```
✓ Ready in 3.2s
○ Local:        http://localhost:3000
```

**✅ Control Plane running?**

### Terminal 2: Start GenAI Core (Python)

**Open a new terminal:**
```bash
cd aaa-platform/genai-core

# Activate virtual environment
source venv/bin/activate  # Mac/Linux
# OR: venv\Scripts\activate  # Windows

# Install dependencies (if not done)
pip install -r requirements.txt

# Start FastAPI server
python main.py
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**✅ GenAI Core running?**

---

## 🧪 Step 3: Test Authentication (Clerk)

### Test 1: Sign Up Flow

**Open browser:**
```
1. Go to: http://localhost:3000/sign-up
2. Enter test email: test@yourdomain.com
3. Enter password: TestPassword123!
4. Click "Sign up"
```

**Expected results:**
- ✅ Email verification sent
- ✅ Redirects to dashboard after verification
- ✅ User created in Clerk dashboard

**Check Clerk Dashboard:**
```
1. Go to: https://dashboard.clerk.com
2. Navigate to: Users
3. Verify: Your test user appears
```

**✅ Sign up works?**

### Test 2: Sign In Flow

**In browser:**
```
1. Sign out (if signed in)
2. Go to: http://localhost:3000/sign-in
3. Enter your test email
4. Enter password
5. Click "Sign in"
```

**Expected results:**
- ✅ Successfully authenticates
- ✅ Redirects to dashboard
- ✅ User session persists

**✅ Sign in works?**

### Test 3: Protected Routes

**In browser:**
```
1. Sign out
2. Try to access: http://localhost:3000/dashboard
```

**Expected results:**
- ✅ Redirects to sign-in page
- ✅ After sign in, returns to dashboard

**✅ Route protection works?**

---

## 🤖 Step 4: Test Blueprint Generation (OpenRouter)

### Test 1: Generate Blueprint

**In browser (signed in):**
```
1. Go to: http://localhost:3000/dashboard/new-blueprint
   OR: http://localhost:3000/dashboard
2. Click "New Blueprint" or "Generate Blueprint"
3. Fill in form:
   - Industry: SaaS
   - Revenue Goal: $100k/month
   - Tech Stack: Next.js, TypeScript
   - Pain Points: Manual processes slow us down
4. Click "Generate Blueprint"
```

**Expected results:**
- ✅ Loading indicator appears
- ✅ Takes 10-30 seconds
- ✅ Blueprint appears with content
- ✅ No errors in console

**Cost**: ~$0.10-0.50 of OpenRouter credits

**Check browser console (F12):**
```
Should see:
✅ No errors
✅ API calls successful
✅ Blueprint data received
```

**✅ Blueprint generation works?**

### Test 2: Verify Blueprint Saved

**In browser:**
```
1. Go to: http://localhost:3000/dashboard/blueprints
2. Verify: Your generated blueprint appears
3. Click on it to view details
```

**Expected results:**
- ✅ Blueprint listed in dashboard
- ✅ Can view full blueprint
- ✅ Saved to local database

**✅ Blueprint persistence works?**

---

## 💳 Step 5: Test Stripe Checkout

### Test 1: Tier 2 Checkout ($99/month)

**In browser (signed in):**
```
1. Go to: http://localhost:3000/dashboard
2. Click "Upgrade" or "Pricing"
3. Select: Architect Tier ($99/month)
4. Click "Subscribe" or "Get Started"
```

**Expected results:**
- ✅ Redirects to Stripe checkout page
- ✅ Shows correct price ($99.00/month)
- ✅ Shows your product name

**On Stripe Checkout page:**
```
Use Stripe test card:
- Card number: 4242 4242 4242 4242
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- Name: Test User
- Email: Your test email
```

**Click "Subscribe" or "Pay"**

**Expected results:**
- ✅ Payment processes (no real charge!)
- ✅ Redirects back to your app
- ✅ Success message appears
- ✅ NO REAL MONEY charged (test mode)

**⚠️ Important**:
- Using test card `4242 4242 4242 4242` ensures NO REAL CHARGE
- Your live Stripe key works with test cards for testing
- Real cards will NOT work in test mode (intentional safety)

**✅ Checkout flow works?**

### Test 2: Verify Webhook (If Webhook Configured)

**Check terminal logs:**
```
In your Control Plane terminal, look for:
"Received webhook: checkout.session.completed"
```

**If no webhook logs:**
- That's OK! Webhooks won't work locally without ngrok
- We'll test webhooks after deployment
- Checkout still works, just no automatic tier update

**Note**: Local webhook testing requires ngrok (advanced, skip for now)

---

## 🏗️ Step 6: Test Build Process

### Test Production Build

**In terminal (stop dev server first):**
```bash
cd aaa-platform/control-plane

# Build for production
npm run build
```

**Expected output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (15/15)
✓ Finalizing page optimization

Route (app)                              Size
┌ ○ /                                    [X] kB
├ ○ /dashboard                           [X] kB
└ ...
```

**✅ Build successful?**

### Test Production Server Locally

```bash
# Start production server
npm start
```

**Open browser:**
```
http://localhost:3000
```

**Expected results:**
- ✅ App loads
- ✅ Authentication still works
- ✅ No console errors

**✅ Production build works?**

---

## ✅ Testing Checklist

### Authentication (Clerk)
- [ ] Sign up creates new user
- [ ] User appears in Clerk dashboard
- [ ] Sign in works
- [ ] Protected routes redirect to sign-in
- [ ] Session persists across page refreshes

### Blueprint Generation (OpenRouter)
- [ ] Blueprint generation completes
- [ ] Content appears (not empty)
- [ ] Blueprint saves to database
- [ ] Blueprint appears in dashboard list
- [ ] No console errors

### Payments (Stripe)
- [ ] Checkout page loads with correct product
- [ ] Test card 4242... processes successfully
- [ ] Redirects back to app after payment
- [ ] No real money charged (test mode safety)

### Application
- [ ] Dev server starts without errors
- [ ] Production build completes successfully
- [ ] Production server runs
- [ ] No TypeScript errors
- [ ] No console errors

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" or "Invalid API key"

**Solution:**
- Verify you copied keys correctly (no extra spaces)
- Verify keys start with correct prefix:
  - Clerk: `pk_live_*` and `sk_live_*`
  - Stripe: `sk_live_*`
  - OpenRouter: `sk-or-v1-*`
- Restart dev server after changing .env.local

### Issue: Blueprint generation fails

**Check:**
- OpenRouter account has credits
- API key is correct
- GenAI Core is running (http://localhost:8000)
- Check GenAI Core terminal for errors

**Test API directly:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Issue: Stripe checkout fails

**Solutions:**
- Use test card: 4242 4242 4242 4242 (DO NOT use real card)
- Verify price IDs are correct in .env.local
- Check you copied all 4 price IDs
- Verify Stripe secret key is live key (sk_live_*)

### Issue: "Module not found" errors

**Solution:**
```bash
cd aaa-platform/control-plane
npm install
```

### Issue: Port already in use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Issue: Database errors

**Solution:**
```bash
cd aaa-platform/control-plane

# Reset local database
rm dev.db

# Run migrations
npx prisma migrate dev
```

---

## 🔒 Security Notes

### Safe Testing Practices

**DO:**
- ✅ Use .env.local (gitignored automatically)
- ✅ Use Stripe test card for checkout testing
- ✅ Test with small amounts on OpenRouter
- ✅ Delete test users from Clerk after testing

**DON'T:**
- ❌ Commit .env.local to git
- ❌ Use real credit cards for testing
- ❌ Share your .env.local file
- ❌ Test with production database URL

### Cleanup After Testing

**Remove test data:**
```
1. Clerk Dashboard → Users → Delete test users
2. Stripe Dashboard → Customers → Delete test customers
3. Local database: rm dev.db (if you want fresh start)
```

---

## 📊 Cost Summary

| Service | Testing Cost | Notes |
|---------|-------------|-------|
| Clerk | $0 | Free tier |
| Stripe | $0 | Test mode - no real charges |
| OpenRouter | $0.10-0.50 | Per blueprint generated |
| Total | **~$0.50 max** | Very cheap to test! |

---

## ✅ All Tests Passed?

### If Everything Works:

**You're ready for production! ✅**

**Next steps:**
1. Clean up test data
2. Proceed to Phase 2: Railway Deployment
3. Deploy with confidence!

### If Something Doesn't Work:

**Don't deploy yet!**

**Instead:**
1. Review error messages
2. Check troubleshooting section
3. Verify all keys are correct
4. Ask for help if needed

---

## 🚀 Ready to Deploy?

**Checklist before deployment:**
- [ ] All local tests passed
- [ ] No errors in console
- [ ] Authentication works
- [ ] Blueprint generation works
- [ ] Stripe checkout works
- [ ] Production build succeeds
- [ ] Keys verified and saved securely

**Ready?** → Proceed to Phase 2: Railway Deployment!

---

## 📞 Need Help?

**Common questions:**

**Q: Can I skip local testing?**
A: Not recommended! Better to catch issues now than in production.

**Q: Will test users appear in production?**
A: Yes! Clerk users are real. Delete them after testing.

**Q: Did I just charge myself money?**
A: No! Test card 4242... never charges real money.

**Q: How do I know OpenRouter is working?**
A: Generate a blueprint. If you see content, it's working!

**Q: Should I test webhooks locally?**
A: Optional. They're easier to test after deployment with a real domain.

---

**Last Updated**: 2026-02-02
**Estimated Time**: 15-30 minutes
**Next**: Phase 2 - Railway Deployment
