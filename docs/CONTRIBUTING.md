# Contributing to KIN Communications Platform

Thank you for your interest in contributing to the KIN Communications Platform! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Git Branch Strategy](#git-branch-strategy)
- [Commit Message Standards](#commit-message-standards)
- [Pull Request Process](#pull-request-process)
- [Code Quality Standards](#code-quality-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Deployment Procedures](#deployment-procedures)
- [Webhook Testing](#webhook-testing)
- [Troubleshooting](#troubleshooting)

## Code of Conduct

This project follows a code of conduct that ensures a welcoming environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm 8+
- PostgreSQL 15+
- Twilio account with API credentials
- Quickbase account with API access
- ngrok for webhook testing

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/kin-communications-platform.git
   cd kin-communications-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   pnpm prisma migrate dev
   pnpm prisma generate
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Set up webhook tunneling (in another terminal)**
   ```bash
   pnpm webhook:tunnel
   ```

For detailed setup instructions, see [Development Setup Guide](development/setup.md).

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
# or
git checkout -b chore/maintenance-task
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the established patterns
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run end-to-end tests
pnpm e2e

# Run all tests
pnpm test:all
```

### 4. Commit Your Changes

Use conventional commit format:

```bash
git add .
git commit -m "feat: add user management functionality"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request using the provided template.

## Git Branch Strategy

### Branch Naming Conventions

- `feature/` - New features or enhancements
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `chore/` - Maintenance tasks, dependencies, tooling
- `docs/` - Documentation updates
- `refactor/` - Code refactoring without functional changes
- `test/` - Test improvements or additions

### Examples

```bash
feature/voice-calling-integration
bugfix/fix-sms-delivery-issue
hotfix/critical-security-patch
chore/update-dependencies
docs/api-documentation-update
refactor/optimize-database-queries
test/add-voicemail-e2e-tests
```

### Branch Protection Rules

- `main` branch is protected
- Requires pull request reviews
- Requires status checks to pass
- Requires up-to-date branches
- No direct pushes to `main`

## Commit Message Standards

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
feat(voice): add call recording functionality
fix(sms): resolve message delivery timeout issue
docs(api): update webhook documentation
test(e2e): add admin panel test coverage
chore(deps): update Twilio SDK to v4.0
perf(db): optimize contact search queries
ci(github): add automated testing workflow
```

## Pull Request Process

### Before Creating a PR

1. **Ensure your branch is up to date**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run all tests locally**
   ```bash
   pnpm test:all
   pnpm lint
   pnpm type-check
   ```

3. **Test webhook functionality** (if applicable)
   ```bash
   pnpm webhook:tunnel
   # Test your webhook endpoints
   ```

### PR Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Webhook testing completed (if applicable)
- [ ] Database migrations included (if applicable)
- [ ] Environment variables documented (if applicable)

### PR Template

Use the provided pull request template to ensure all requirements are met.

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: At least one team member must approve
3. **Testing**: Reviewer tests the changes locally
4. **Approval**: PR is approved and merged

## Code Quality Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper types for all functions and variables
- Use interfaces for object shapes
- Avoid `any` type unless absolutely necessary

### React Components

- Use functional components with hooks
- Implement proper error boundaries
- Use proper prop types and interfaces
- Follow component naming conventions

### API Routes

- Use proper HTTP status codes
- Implement error handling
- Validate input data
- Use proper authentication/authorization

### Database

- Use Prisma ORM for database operations
- Implement proper migrations
- Use transactions for complex operations
- Optimize queries for performance

### File Organization

```
src/
├── app/                 # Next.js app directory
├── components/          # Reusable React components
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── pages/              # Additional pages (if needed)
```

## Testing Requirements

### Unit Tests

- Test all utility functions
- Test business logic
- Test error handling
- Aim for 80%+ code coverage

### Integration Tests

- Test API endpoints
- Test database operations
- Test third-party integrations
- Test authentication flows

### End-to-End Tests

- Test critical user workflows
- Test admin functionality
- Test real-time features
- Test cross-browser compatibility

### Webhook Testing

- Test Twilio webhook endpoints
- Test signature verification
- Test payload validation
- Test error handling

For detailed testing guidelines, see [Testing Guide](development/testing.md).

## Documentation Standards

### Code Documentation

- Document complex functions and classes
- Use JSDoc for function documentation
- Include examples for complex APIs
- Keep comments up to date

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error codes and messages
- Keep OpenAPI specs updated

### User Documentation

- Write clear user guides
- Include screenshots for complex workflows
- Document troubleshooting steps
- Keep documentation current

## Deployment Procedures

### Development Deployment

- Automatic deployment on PR creation
- Preview URLs for testing
- Environment variables configured
- Database migrations applied

### Production Deployment

- Automatic deployment on merge to main
- Blue-green deployment strategy
- Database migrations applied
- Health checks performed
- Rollback capability available

### Environment Variables

- Document all required variables
- Use secure storage for secrets
- Validate configuration on startup
- Provide clear error messages for missing variables

## Webhook Testing

### Setting Up ngrok

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start ngrok tunnel**
   ```bash
   pnpm webhook:tunnel
   ```

3. **Configure Twilio webhooks**
   - Use the ngrok URL for webhook endpoints
   - Test webhook delivery
   - Verify signature validation

### Testing Checklist

- [ ] Voice webhook endpoints
- [ ] SMS webhook endpoints
- [ ] Status callback webhooks
- [ ] Recording webhook endpoints
- [ ] Transcription webhook endpoints
- [ ] Webhook signature verification
- [ ] Error handling and retries

For detailed webhook testing guide, see [Webhook Testing Guide](development/webhook-testing.md).

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check DATABASE_URL configuration
   - Verify PostgreSQL is running
   - Check network connectivity

2. **Twilio Integration Issues**
   - Verify API credentials
   - Check webhook URLs
   - Test signature validation

3. **Socket.io Connection Issues**
   - Check CORS configuration
   - Verify server is running
   - Check network connectivity

4. **Build Issues**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify environment variables

### Getting Help

- Check existing issues and discussions
- Create a new issue with detailed information
- Join our development chat
- Contact the maintainers

## Additional Resources

- [Development Setup Guide](development/setup.md)
- [Testing Guide](development/testing.md)
- [Webhook Testing Guide](development/webhook-testing.md)
- [API Documentation](api-standards.md)
- [Database Patterns](database-patterns.md)
- [Performance Optimization](performance-optimization.md)

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to the KIN Communications Platform! 🚀
