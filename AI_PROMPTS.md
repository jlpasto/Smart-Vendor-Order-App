# 🤖 AI Assistant Prompt Templates

Copy and paste these prompts when you need help from AI (Claude, ChatGPT, etc.)

---

## 📋 How to Use These Prompts

1. Copy the entire prompt (including the context section)
2. Paste into your AI assistant
3. The AI will read the relevant documentation
4. Follow the AI's instructions

---

## 🚀 Deployment Prompts

### Deploy to Render (Easiest)
```
I want to deploy my Wholesale Order App to production using Render.

Please read DEPLOYMENT.md and help me deploy using Option A (Render).

Guide me through:
1. Setting up GitHub repository
2. Creating PostgreSQL database on Render
3. Deploying backend service
4. Seeding production database
5. Deploying frontend
6. Testing the production app

Walk me through each step carefully.
```

### Deploy to Vercel + Railway
```
I want to deploy my Wholesale Order App using Vercel for frontend
and Railway for backend + database.

Please read DEPLOYMENT.md and help me deploy using Option B (Vercel + Railway).

Guide me step by step through the entire process.
```

### Deploy to VPS
```
I want to deploy my Wholesale Order App to a VPS (DigitalOcean/Linode).

Please read DEPLOYMENT.md and help me deploy using Option C (VPS).

I need help with:
1. Server setup
2. Installing dependencies
3. Configuring Nginx
4. Setting up SSL
5. Running with PM2

Please guide me through each step.
```

---

## 🎨 Customization Prompts

### Change Colors
```
I want to customize the colors of my Wholesale Order App.

Please read:
- NEXT_STEPS.md (customization section)
- client/tailwind.config.js

Help me:
1. Understand the current color scheme
2. Change the primary color to [YOUR COLOR]
3. Update all related colors
4. Test the changes

Show me exactly what to edit.
```

### Add Logo
```
I want to add my logo to the Wholesale Order App.

Please read:
- client/public/LOGO_INSTRUCTIONS.md
- NEXT_STEPS.md

Help me:
1. Understand what logo files I need (sizes)
2. Where to place them
3. How to create them if I don't have them
4. Test the logo on the PWA

Give me step-by-step instructions.
```

### Modify UI Layout
```
I want to modify the [SPECIFIC PAGE/COMPONENT] in my app.

Please read:
- PROJECT_SUMMARY.md (understand structure)
- The relevant component file

Help me:
1. Locate the correct file
2. Understand the current structure
3. Make changes to [DESCRIBE WHAT YOU WANT]
4. Test the changes

Guide me through the edit.
```

---

## 🐛 Troubleshooting Prompts

### General Issue
```
I'm having an issue with my Wholesale Order App.

The problem is: [DESCRIBE YOUR ISSUE IN DETAIL]

Error message (if any): [PASTE ERROR]

Please read TROUBLESHOOTING.md and help me:
1. Identify the root cause
2. Find the solution
3. Implement the fix
4. Verify it's resolved

What should I do?
```

### Database Connection Error
```
I can't connect to my PostgreSQL database.

Error: [PASTE ERROR MESSAGE]

Please read:
- TROUBLESHOOTING.md (Database Connection Error section)
- .env file configuration

Help me:
1. Check my database configuration
2. Verify credentials
3. Test connection
4. Fix the issue

Walk me through troubleshooting.
```

### Deployment Issue
```
My deployment failed/isn't working properly.

Platform: [Render/Vercel/Railway/VPS]
Issue: [DESCRIBE ISSUE]
Error: [PASTE ANY ERRORS]

Please read:
- DEPLOYMENT.md (my platform section)
- TROUBLESHOOTING.md (Deployment section)

Help me diagnose and fix the issue.
```

### Frontend Not Loading
```
My frontend isn't loading properly.

What I see: [DESCRIBE WHAT HAPPENS]
Browser console errors: [PASTE ERRORS]

Please read TROUBLESHOOTING.md and help me:
1. Check common causes
2. Verify configuration
3. Test solutions
4. Fix the issue
```

---

## 🔧 Development Prompts

### Add New Feature
```
I want to add a new feature to my Wholesale Order App.

Feature description: [DESCRIBE YOUR FEATURE]

Please read:
- PROJECT_SUMMARY.md (understand project structure)
- FEATURES.md (understand existing features)

Help me:
1. Understand where to add the code
2. What files to modify
3. How to implement it
4. Test the new feature

Guide me through the implementation.
```

### Modify Existing Feature
```
I want to modify the [FEATURE NAME] in my app.

Current behavior: [DESCRIBE CURRENT]
Desired behavior: [DESCRIBE WHAT YOU WANT]

Please read:
- FEATURES.md (understand the feature)
- Relevant component files

Help me:
1. Locate the code
2. Understand how it works
3. Make the modification
4. Test the changes
```

### Add Email Notifications
```
I want to configure email notifications for my Wholesale Order App.

Please read:
- NEXT_STEPS.md (email configuration section)
- SETUP.md (email settings)
- server/utils/email.js

Help me:
1. Choose an email service (Gmail, SendGrid, etc.)
2. Get SMTP credentials
3. Configure .env variables
4. Test email sending
5. Customize email templates

Guide me through the entire process.
```

---

## 📱 Mobile Prompts

### Test on Mobile
```
I want to test my Wholesale Order App on my mobile device.

Please read:
- NEXT_STEPS.md (mobile testing section)

Help me:
1. Find my computer's IP address
2. Access the app from my phone
3. Test all features
4. Install as PWA
5. Verify offline functionality

What are the steps?
```

### Convert to Native App
```
I want to convert my PWA to a native mobile app.

Target platform: [iOS / Android / Both]

Please read:
- DEPLOYMENT.md (Mobile App Deployment section)

Help me choose between:
1. PWABuilder (easiest)
2. Capacitor (full native)
3. Staying with PWA

Then guide me through the chosen option.
```

---

## 📊 Understanding Prompts

### Understand Project Structure
```
I want to understand how my Wholesale Order App is organized.

Please read:
- PROJECT_SUMMARY.md
- README.md

Explain:
1. Overall architecture
2. Frontend structure
3. Backend structure
4. Database schema
5. How everything connects

Give me a clear overview.
```

### Understand Specific Feature
```
I want to understand how [FEATURE NAME] works in my app.

Please read:
- FEATURES.md (feature details)
- Relevant code files

Explain:
1. How the feature works
2. What files are involved
3. Database interactions
4. User flow
5. Admin capabilities (if any)

Help me understand the complete picture.
```

### Understand Database
```
I want to understand my database structure.

Please read:
- PROJECT_SUMMARY.md (Database Schema section)
- FEATURES.md (database info)
- server/config/database.js

Explain:
1. All tables and their purposes
2. Relationships between tables
3. Key fields
4. How data flows
5. How to query the data

Give me a complete understanding.
```

---

## 🎓 Learning Prompts

### Learn React Concepts
```
I want to understand the React concepts used in my app.

Specifically: [useState / useEffect / Context API / React Router / etc.]

Please read:
- Relevant component files
- PROJECT_SUMMARY.md (Tech Stack section)

Explain:
1. What it is
2. Why it's used
3. How it's used in my app
4. Show me examples from my code

Teach me this concept.
```

### Learn Backend Concepts
```
I want to understand the backend concepts in my app.

Specifically: [Express / PostgreSQL / JWT / REST API / etc.]

Please read:
- Relevant backend files
- PROJECT_SUMMARY.md (Tech Stack section)

Explain:
1. What it is
2. Why it's used
3. How it's implemented
4. Show examples from my code

Help me learn this.
```

---

## 💡 Optimization Prompts

### Improve Performance
```
I want to improve the performance of my Wholesale Order App.

Areas of concern: [Load time / Database queries / API speed / etc.]

Please read:
- PROJECT_SUMMARY.md
- Relevant code sections

Help me:
1. Identify bottlenecks
2. Suggest optimizations
3. Implement improvements
4. Test performance gains

Guide me through optimization.
```

### Improve Security
```
I want to improve the security of my app before deployment.

Please read:
- DEPLOYMENT.md (Security Checklist)
- .env configuration

Help me:
1. Review current security
2. Identify vulnerabilities
3. Implement improvements
4. Verify security measures

Make sure my app is secure.
```

---

## 🔄 Maintenance Prompts

### Update Dependencies
```
I want to update the dependencies in my Wholesale Order App.

Please read:
- package.json (both root and client)
- PROJECT_SUMMARY.md

Help me:
1. Check for outdated packages
2. Identify breaking changes
3. Update safely
4. Test after updating
5. Fix any issues

Guide me through the update process.
```

### Backup Database
```
I want to set up database backups for my production app.

Platform: [Render / Railway / VPS]

Please read:
- DEPLOYMENT.md (Monitoring & Maintenance section)

Help me:
1. Understand backup options
2. Set up automated backups
3. Test backup restore
4. Create backup schedule

Guide me through backup setup.
```

---

## 📝 Documentation Prompts

### Generate API Documentation
```
I want to create API documentation for my backend.

Please read:
- server/routes/ (all route files)
- PROJECT_SUMMARY.md

Help me:
1. Document all endpoints
2. Include request/response formats
3. Add authentication requirements
4. Include examples

Create comprehensive API docs.
```

### Create User Guide
```
I want to create a user guide for my Wholesale Order App.

Please read:
- FEATURES.md
- All relevant page components

Help me create a guide covering:
1. How to browse products
2. How to place orders
3. How to view order history
4. Admin features (if admin)

Make it simple and clear for non-technical users.
```

---

## 🎯 Quick Action Prompts

### Quick Deploy Checklist
```
I'm ready to deploy. Give me a quick pre-deployment checklist.

Please read:
- DEPLOYMENT.md (Pre-Deployment Checklist)
- NEXT_STEPS.md

Create a checklist of things I must do before deploying.
```

### Quick Test Checklist
```
Give me a quick testing checklist to verify everything works.

Please read:
- DEPLOYMENT.md (Post-Deployment Testing)

Create a checklist of features to test.
```

---

## 💬 General Help Prompt

### Get Oriented
```
I'm working on my Wholesale Order App and need to get oriented.

Please read:
- DOCS_INDEX.md
- PROJECT_SUMMARY.md
- NEXT_STEPS.md

Then tell me:
1. What documentation is available
2. What stage I'm at (setup/testing/deploying)
3. What I should do next
4. What resources are available

Help me understand where I am and what to do.
```

---

## 🎓 Best Practices for Prompting

### Good Prompt Structure:
1. **State your goal clearly**
2. **Reference relevant documentation**
3. **Be specific about what you need**
4. **Ask for step-by-step guidance**
5. **Include error messages if applicable**

### Example of a Good Prompt:
```
I want to [SPECIFIC GOAL].

Please read:
- [RELEVANT_DOC_1.md]
- [RELEVANT_DOC_2.md]

Help me:
1. [STEP 1]
2. [STEP 2]
3. [STEP 3]

[Any additional context or errors]
```

---

## 📚 Documentation Files Reference

Always reference these when prompting:

- **DOCS_INDEX.md** - Find any documentation
- **PROJECT_SUMMARY.md** - Understand project
- **NEXT_STEPS.md** - Know what to do next
- **DEPLOYMENT.md** - Deploy to production
- **FEATURES.md** - Understand features
- **TROUBLESHOOTING.md** - Fix issues
- **SETUP.md** - Setup help
- **QUICK_START.md** - Quick start guide

---

## 🎉 You're Ready!

These prompts will help you get expert guidance from AI assistants.
Always reference the documentation for context!

**Happy prompting! 🚀**
