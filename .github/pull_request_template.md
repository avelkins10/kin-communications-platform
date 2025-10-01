# Pull Request

## Description
<!-- Provide a clear and concise description of what this PR accomplishes -->

## Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🎨 UI/UX improvement
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security improvement
- [ ] 🧹 Code cleanup/refactoring
- [ ] 🧪 Test addition/improvement

## Related Issues
<!-- Link to any related issues using "Fixes #123" or "Closes #123" -->
- Fixes #
- Related to #

## Changes Made
<!-- List the main changes made in this PR -->
- 
- 
- 

## Testing
<!-- Mark completed testing tasks with an "x" -->
### Unit & Integration Tests
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All existing tests pass
- [ ] Test coverage maintained/improved

### End-to-End Tests
- [ ] E2E tests added/updated
- [ ] Critical user flows tested
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested

### Manual Testing
- [ ] Tested locally with `pnpm dev`
- [ ] Tested with ngrok webhook tunneling
- [ ] Tested Twilio integration (voice, SMS, webhooks)
- [ ] Tested Socket.io real-time features
- [ ] Tested Quickbase integration
- [ ] Tested admin panel functionality
- [ ] Tested with different user roles/permissions

### Webhook Testing
- [ ] Voice webhook endpoints tested
- [ ] SMS webhook endpoints tested
- [ ] Status callback webhooks tested
- [ ] Recording webhook endpoints tested
- [ ] Transcription webhook endpoints tested
- [ ] Webhook signature verification tested

## Database Changes
<!-- Mark if applicable -->
- [ ] No database changes
- [ ] Database migration included
- [ ] Migration tested locally
- [ ] Migration tested in staging
- [ ] Data migration script included (if needed)

## Environment Variables
<!-- List any new or changed environment variables -->
- [ ] No new environment variables
- [ ] New environment variables documented in `.env.example`
- [ ] Environment variables added to Vercel deployment
- [ ] Environment variables documented in deployment guide

## Breaking Changes
<!-- If this is a breaking change, describe what breaks and how to migrate -->
- [ ] No breaking changes
- [ ] Breaking changes documented below:

### Migration Guide
<!-- If breaking changes exist, provide migration instructions -->

## Deployment Considerations
<!-- Any special considerations for deployment -->
- [ ] No special deployment considerations
- [ ] Requires database migration
- [ ] Requires environment variable updates
- [ ] Requires manual deployment steps
- [ ] Requires coordination with other services

## Screenshots/Videos
<!-- If applicable, add screenshots or videos demonstrating the changes -->
<!-- Drag and drop images here -->

## Performance Impact
<!-- Describe any performance implications -->
- [ ] No performance impact
- [ ] Performance improvement (describe below)
- [ ] Potential performance impact (describe below)

## Security Considerations
<!-- Describe any security implications -->
- [ ] No security implications
- [ ] Security improvement (describe below)
- [ ] Potential security consideration (describe below)

## Code Quality
<!-- Mark completed quality checks with an "x" -->
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is properly commented
- [ ] No console.log statements left in code
- [ ] No TODO comments left in code
- [ ] Error handling implemented
- [ ] TypeScript types are properly defined
- [ ] ESLint warnings/errors resolved

## Documentation
<!-- Mark completed documentation tasks with an "x" -->
- [ ] No documentation changes needed
- [ ] README updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Code comments added/updated
- [ ] Changelog updated (if applicable)

## Checklist for Reviewers
<!-- Guidelines for reviewers -->
- [ ] Code logic is sound and follows best practices
- [ ] Tests are comprehensive and meaningful
- [ ] Error handling is appropriate
- [ ] Performance implications are acceptable
- [ ] Security considerations are addressed
- [ ] Documentation is clear and complete
- [ ] Breaking changes are properly documented
- [ ] Deployment considerations are addressed

## Additional Notes
<!-- Any additional information for reviewers -->

---

## Reviewer Guidelines

### Before Reviewing
1. Ensure you understand the context and requirements
2. Check if any related issues or discussions exist
3. Verify that CI/CD checks are passing

### During Review
1. Focus on code quality, logic, and maintainability
2. Check for potential security vulnerabilities
3. Verify test coverage and quality
4. Ensure proper error handling
5. Check for performance implications
6. Verify documentation is complete

### After Review
1. Provide constructive feedback
2. Suggest improvements where appropriate
3. Approve when ready for merge
4. Request changes if issues are found

### Testing Checklist for Reviewers
- [ ] Pull the branch and test locally
- [ ] Verify all functionality works as expected
- [ ] Test edge cases and error scenarios
- [ ] Verify webhook integration (if applicable)
- [ ] Check Socket.io real-time features (if applicable)
- [ ] Test admin functionality (if applicable)
- [ ] Verify responsive design (if UI changes)
- [ ] Check browser compatibility (if applicable)

---

**Note**: This PR template ensures consistent code review process and helps maintain high code quality standards. Please complete all relevant sections before requesting review.
