# Quick Start Guide: Using This Spec with Claude Code CLI

## How to Use This Specification

### 1. Place the spec file in your project root
```bash
mv CLAUDE_CODE_SPEC.md /path/to/your/floinvite-project/
```

### 2. Start Claude Code and reference the spec
```bash
cd /path/to/your/floinvite-project
claude-code
```

### 3. Example prompts to get started

**Phase 1 - Smart Triage Interface:**
```
Read CLAUDE_CODE_SPEC.md and implement the Smart Triage Interface (Section 1).
Create the SmartTriage.tsx component with the two-path flow for Expected 
and Walk-In visitors. Make it mobile-responsive with large touch targets.
```

**Phase 2 - Host Management:**
```
Implement the Host Management System from Section 2 of CLAUDE_CODE_SPEC.md.
Create HostManagement.tsx with CSV import, inline editing, and the ability
to add/remove hosts. Include the CSV template download feature.
```

**Phase 3 - Data Persistence:**
```
Add localStorage persistence as specified in Section 7 of CLAUDE_CODE_SPEC.md.
Create the usePersistedState hook and apply it to hosts, guests, and settings.
```

**Phase 4 - Expected Guests:**
```
Implement Expected Guest Pre-Registration from Section 3. Add CSV import
for expected guests and the quick-search check-in flow for pre-registered visitors.
```

### 4. Iterative development prompts

**After each implementation:**
```
Test the [feature name] implementation. Check for:
- Mobile responsiveness
- Error handling
- TypeScript types
- Data persistence
Show me any issues found.
```

**For refinements:**
```
Based on CLAUDE_CODE_SPEC.md Section [X], improve the [feature] by:
- Adding better error messages
- Improving the UI/UX
- Optimizing performance
```

### 5. Useful incremental prompts

```
Add validation to the sign-in form as specified in Section 14

Implement the returning visitor fast-track from Section 5

Add SMS notification support using email gateways (Section 6)

Create the CSV export functionality for the logbook

Add the success screen with auto-redirect (Section 1)

Implement search and filter for the logbook

Add the "No Show" status for expected guests who don't arrive
```

### 6. Review and test prompts

```
Review the entire implementation against CLAUDE_CODE_SPEC.md.
List any missing features or deviations from the spec.

Test all user flows from Section 13 (Testing Scenarios).
Report any issues or edge cases.

Check the code against the Success Metrics in Section 18.
```

### 7. Documentation prompts

```
Create a README.md based on CLAUDE_CODE_SPEC.md that explains:
- How to set up the project
- How to use each feature
- CSV template formats

Generate user documentation for the Settings page showing how to
import hosts and manage the team directory.
```

## Tips for Best Results

1. **Reference sections explicitly**: Always mention section numbers when asking Claude Code to implement features

2. **Build incrementally**: Implement one section at a time, test, then move to the next

3. **Keep the context**: Start each session by asking Claude Code to "Read CLAUDE_CODE_SPEC.md"

4. **Test frequently**: After each feature, run the testing scenarios from Section 13

5. **Ask for clarifications**: If the spec is unclear, ask Claude Code to explain the intended behavior

6. **Request alternatives**: If a feature seems complex, ask: "Based on the spec, what's a simpler way to implement [feature]?"

## Common Issues and Solutions

**Issue**: Feature too complex to implement at once
**Solution**: Break it into sub-tasks
```
Let's implement the Smart Triage interface in stages:
1. First, create the welcome screen with two buttons
2. Then add the walk-in flow
3. Finally add the expected visitor search
```

**Issue**: Unclear requirements
**Solution**: Ask for specification
```
Section 6 mentions SMS notifications. What exactly should happen when:
- The host doesn't have a phone number?
- The SMS gateway is not configured?
- The notification fails to send?
```

**Issue**: Performance concerns
**Solution**: Request optimization
```
The CSV import in Section 2 might be slow for large files.
Implement chunked processing with a progress indicator.
```

## Project Milestones

Use these prompts to track progress:

```
# Week 1 Checkpoint
Complete Phase 1 implementation from the checklist in Section 18.
Show me what's been completed and what's remaining.

# Week 2 Checkpoint
Complete Phase 2 "Should Have" features. Test all core flows.
Prepare for user testing.

# Week 3 Checkpoint
Polish the UI, fix all bugs, prepare for deployment.
Review against Success Metrics.
```

## Deployment

When ready to deploy:
```
Based on Section 16 of CLAUDE_CODE_SPEC.md, help me:
1. Set up the build process
2. Configure environment variables
3. Deploy to Vercel/Netlify
4. Test the production build
```

---

**Remember**: The spec is comprehensive but flexible. Work with Claude Code to adapt it to your specific needs while keeping the core simplicity and SME focus.

Good luck building floinvite! 🚀
