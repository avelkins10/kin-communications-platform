---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ''
---

# Bug Report

## Bug Description
<!-- Provide a clear and concise description of what the bug is -->

## Steps to Reproduce
<!-- Provide detailed steps to reproduce the behavior -->
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
<!-- A clear and concise description of what you expected to happen -->

## Actual Behavior
<!-- A clear and concise description of what actually happened -->

## Screenshots/Videos
<!-- If applicable, add screenshots or videos to help explain your problem -->
<!-- Drag and drop images here -->

## Environment Information
<!-- Please complete the following information -->
- **OS**: [e.g., macOS 14.0, Windows 11, Ubuntu 22.04]
- **Browser**: [e.g., Chrome 120, Firefox 121, Safari 17]
- **Browser Version**: [e.g., 120.0.6099.109]
- **Device**: [e.g., Desktop, Mobile, Tablet]
- **Screen Resolution**: [e.g., 1920x1080, 375x667]

## Deployment Environment
<!-- Mark the relevant option with an "x" -->
- [ ] Local Development (`pnpm dev`)
- [ ] Preview Deployment (Vercel)
- [ ] Production Deployment
- [ ] Staging Environment

## Application Version
<!-- If known, provide the application version or commit hash -->
- **Version**: [e.g., v1.2.3, commit abc123]
- **Branch**: [e.g., main, develop, feature/bug-fix]

## Error Logs
<!-- If applicable, provide error logs or console output -->
```
Paste error logs here
```

## Network Information
<!-- If applicable, provide network-related information -->
- **Connection Type**: [e.g., WiFi, Ethernet, Mobile]
- **Network Speed**: [e.g., Fast, Slow, Intermittent]
- **Proxy/VPN**: [e.g., None, Corporate Proxy, VPN]

## Twilio Integration Issues
<!-- If the bug is related to Twilio integration, complete this section -->
- [ ] Voice calling issues
- [ ] SMS messaging issues
- [ ] Webhook delivery issues
- [ ] TaskRouter functionality issues
- [ ] Recording/transcription issues

### Twilio Details
- **Twilio Account SID**: [if applicable, provide first 8 characters: ACxxxxxx...]
- **Phone Number**: [e.g., +15551234567]
- **Webhook URL**: [e.g., https://your-app.vercel.app/api/webhooks/twilio/voice]
- **Error Code**: [if applicable, e.g., 11200, 20003]

## Socket.io Issues
<!-- If the bug is related to Socket.io, complete this section -->
- [ ] Connection issues
- [ ] Real-time updates not working
- [ ] Event broadcasting issues
- [ ] Authentication issues

### Socket.io Details
- **Connection Status**: [e.g., Connected, Disconnected, Reconnecting]
- **Event Name**: [e.g., 'contact_updated', 'call_status_changed']
- **Client ID**: [if applicable]

## Database Issues
<!-- If the bug is related to database operations, complete this section -->
- [ ] Query performance issues
- [ ] Data inconsistency
- [ ] Migration issues
- [ ] Connection issues

### Database Details
- **Database Type**: [e.g., PostgreSQL, SQLite]
- **Query**: [if applicable, provide the problematic query]
- **Error Message**: [if applicable]

## Authentication Issues
<!-- If the bug is related to authentication, complete this section -->
- [ ] Login issues
- [ ] Session management issues
- [ ] Permission/role issues
- [ ] OAuth integration issues

### Authentication Details
- **Provider**: [e.g., Google, Microsoft, Email/Password]
- **User Role**: [e.g., Admin, User, Guest]
- **Session Status**: [e.g., Active, Expired, Invalid]

## Quickbase Integration Issues
<!-- If the bug is related to Quickbase integration, complete this section -->
- [ ] Data sync issues
- [ ] API rate limiting
- [ ] Authentication issues
- [ ] Field mapping issues

### Quickbase Details
- **Realm**: [e.g., your-realm.quickbase.com]
- **App ID**: [e.g., bqxxxxxx]
- **Table Name**: [e.g., Contacts, Tasks]
- **Error Code**: [if applicable]

## Impact Assessment
<!-- Describe the impact of this bug -->
- **Severity**: [Critical, High, Medium, Low]
- **Affected Users**: [All users, Specific user group, Admin only, etc.]
- **Business Impact**: [e.g., Blocks core functionality, Minor inconvenience, etc.]
- **Workaround Available**: [Yes/No - if yes, describe the workaround]

## Additional Context
<!-- Add any other context about the problem here -->

## Troubleshooting Attempted
<!-- List any troubleshooting steps you've already tried -->
- [ ] Refreshed the page
- [ ] Cleared browser cache
- [ ] Tried different browser
- [ ] Checked network connection
- [ ] Restarted the application
- [ ] Checked browser console for errors
- [ ] Verified environment variables
- [ ] Checked webhook configuration
- [ ] Tested with ngrok tunnel

## Reproduction Rate
<!-- How often does this bug occur? -->
- [ ] Always (100%)
- [ ] Often (75-99%)
- [ ] Sometimes (25-74%)
- [ ] Rarely (1-24%)
- [ ] Once (0%)

## Priority
<!-- How urgent is this bug? -->
- [ ] Critical - Blocks core functionality
- [ ] High - Significant impact on user experience
- [ ] Medium - Moderate impact, workaround available
- [ ] Low - Minor issue, cosmetic problem

## Related Issues
<!-- Link to any related issues -->
- Related to #
- Duplicate of #
- Blocked by #

## Labels
<!-- The following labels will be automatically applied, but you can suggest additional ones -->
- `bug`
- `needs-triage`
- `severity: [critical|high|medium|low]`
- `component: [frontend|backend|database|integration|ui]`
- `browser: [chrome|firefox|safari|edge]`
- `platform: [web|mobile|desktop]`

---

**Note**: Please provide as much detail as possible to help us reproduce and fix the issue quickly. The more information you provide, the faster we can resolve the problem.
