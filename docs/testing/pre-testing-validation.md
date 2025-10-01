# Pre-Testing Validation Guide

## Overview

This guide provides comprehensive procedures for validating the KIN Communications Platform before business testing begins. The validation ensures all components are functional and properly integrated.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Redis server for caching (optional but recommended)
- Google OAuth credentials configured
- Test user accounts created

## Environment Setup Checklist

### 1. Configure Environment Variables

1. Copy `.env.example` to `.env.local` (if exists) or create new `.env.local`
2. Configure all required variables:
   - [ ] `DATABASE_URL` - PostgreSQL connection string
   - [ ] `NEXTAUTH_URL` - Application URL (http://localhost:3000)
   - [ ] `NEXTAUTH_SECRET` - Secure random string
   - [ ] `GOOGLE_CLIENT_ID` - OAuth client ID
   - [ ] `GOOGLE_CLIENT_SECRET` - OAuth client secret
   - [ ] `NEXT_PUBLIC_SOCKET_URL` - Socket.io URL
   - [ ] `TWILIO_*` - Twilio credentials (can use test values)
   - [ ] `QUICKBASE_*` - QuickBase credentials (can use test values)

### 2. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed
```

### 3. Install Dependencies

```bash
# Install all dependencies
npm install

# Build the application
npm run build
```

## Component Validation Procedures

### 1. Database Connectivity Validation

**Test Objective**: Verify database connection and schema integrity

**Steps**:
1. Run health check: `curl http://localhost:3000/api/health`
2. Verify Prisma client generation
3. Test database queries via Prisma Studio: `npm run db:studio`
4. Check migration status: `npx prisma migrate status`

**Expected Outcome**:
- Health endpoint returns 200 OK with database status
- Prisma Studio opens and displays all tables
- All migrations are applied successfully

**Troubleshooting**:
- Connection refused: Check PostgreSQL is running
- Authentication failed: Verify DATABASE_URL credentials
- Schema mismatch: Run `npm run db:migrate`

### 2. Authentication Flow Testing

**Test Objective**: Validate Google OAuth and session management

**Steps**:
1. Navigate to http://localhost:3000
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify redirect to dashboard
5. Check session persistence across page refreshes
6. Test logout functionality

**Expected Outcome**:
- OAuth flow completes without errors
- User is redirected to dashboard after login
- Session persists across refreshes
- Logout properly clears session

**Troubleshooting**:
- OAuth error: Check Google client credentials
- Redirect issues: Verify NEXTAUTH_URL configuration
- Session errors: Check NEXTAUTH_SECRET is set

### 3. UI Component Verification

**Test Objective**: Ensure all UI components render and function correctly

**Steps**:
1. Navigate through all dashboard tabs:
   - Queue Management
   - Contacts
   - History
   - Settings
2. Test form interactions:
   - Add new contact
   - Edit existing contact
   - Delete contact
3. Verify responsive design:
   - Test on desktop (1920x1080)
   - Test on tablet (768x1024)
   - Test on mobile (375x667)
4. Check component states:
   - Loading states
   - Error states
   - Empty states

**Expected Outcome**:
- All tabs load without errors
- Forms submit successfully
- UI is responsive across devices
- Component states display correctly

**Troubleshooting**:
- Component errors: Check browser console
- Styling issues: Verify Tailwind CSS build
- Form errors: Check API endpoints

### 4. Socket.io Testing

**Test Objective**: Validate real-time features and WebSocket connectivity

**Steps**:
1. Open developer tools Network tab
2. Look for Socket.io connection
3. Test real-time features:
   - User presence indicators
   - Live notifications
   - Real-time updates
4. Test connection recovery:
   - Disconnect network briefly
   - Verify automatic reconnection

**Expected Outcome**:
- Socket.io connects successfully
- Real-time events are received
- Presence indicators update
- Connection recovers after disconnect

**Troubleshooting**:
- Connection failed: Check NEXT_PUBLIC_SOCKET_URL
- CORS errors: Verify SOCKET_CORS_ORIGIN
- Auth errors: Check token generation

### 5. API Endpoint Validation

**Test Objective**: Verify all API endpoints are accessible and functional

**Steps**:
1. Test health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Test contacts CRUD:
   ```bash
   # GET all contacts
   curl http://localhost:3000/api/contacts \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   
   # POST new contact
   curl -X POST http://localhost:3000/api/contacts \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{"name":"Test Contact","email":"test@example.com"}'
   ```

3. Test webhook endpoints:
   ```bash
   # Test webhook security
   npm run test:webhook-security
   ```

**Expected Outcome**:
- All endpoints return appropriate status codes
- CRUD operations complete successfully
- Authentication is properly enforced
- Webhook validation works correctly

**Troubleshooting**:
- 401 errors: Check authentication token
- 500 errors: Check server logs
- Timeout errors: Verify database connection

### 6. Error Handling Verification

**Test Objective**: Ensure proper error handling and recovery

**Steps**:
1. Test error boundaries:
   - Trigger component errors
   - Verify error UI displays
2. Test API error handling:
   - Send malformed requests
   - Test rate limiting
3. Test validation:
   - Submit forms with invalid data
   - Verify error messages

**Expected Outcome**:
- Error boundaries catch and display errors
- API returns appropriate error responses
- Validation messages are clear and helpful

**Troubleshooting**:
- Uncaught errors: Check error boundary implementation
- Missing validation: Review form validation rules

## Performance Checks

### Quick Performance Validation

1. **Page Load Times**:
   - Dashboard: < 3 seconds
   - Contact list: < 2 seconds
   - Forms: < 1 second

2. **API Response Times**:
   - Health check: < 100ms
   - CRUD operations: < 500ms
   - Search operations: < 1 second

3. **Memory Usage**:
   - Initial load: < 100MB
   - After navigation: < 200MB
   - No memory leaks detected

## Validation Criteria for Business Testing Readiness

### ✅ Must Pass
- [ ] Database connectivity confirmed
- [ ] Authentication flow working
- [ ] All dashboard tabs accessible
- [ ] Basic CRUD operations functional
- [ ] No console errors on main flows

### ⚠️ Should Pass
- [ ] Socket.io real-time features working
- [ ] All forms validating correctly
- [ ] Responsive design verified
- [ ] Error handling implemented
- [ ] Performance within targets

### 💡 Nice to Have
- [ ] All integrations configured
- [ ] Comprehensive test data seeded
- [ ] Monitoring configured
- [ ] Documentation complete

## Running Automated Validation

```bash
# Run all validation tests
npm run validate:platform

# Run specific validation suites
npm run validate:ui
npm run validate:api
npm run validate:socket
npm run validate:auth

# Generate validation report
npm run validate:report
```

## Common Issues and Solutions

### Issue: Authentication Redirect Loop
**Solution**: Clear browser cookies and check NEXTAUTH_URL matches actual URL

### Issue: Database Connection Timeout
**Solution**: Verify PostgreSQL is running and DATABASE_URL is correct

### Issue: Socket.io Connection Failed
**Solution**: Check that Socket.io server is running on correct port

### Issue: API Returns 500 Errors
**Solution**: Check server logs and verify all environment variables are set

### Issue: UI Components Not Styling Correctly
**Solution**: Run `npm run build` to ensure Tailwind CSS is compiled

## Next Steps

After successful validation:
1. Document any issues found in validation report
2. Address critical issues before business testing
3. Create test user accounts for business testers
4. Prepare test data and scenarios
5. Schedule business testing sessions

## Support

For validation issues:
- Check server logs: `npm run dev` output
- Review browser console for client-side errors
- Run specific test suites for detailed diagnostics
- Consult troubleshooting guide in docs/troubleshooting/
