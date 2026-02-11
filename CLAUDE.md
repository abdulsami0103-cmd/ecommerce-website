# Claude Code Rules for E-commerce Project

## Database Change Rules

### BEFORE Making Any Database Changes:
1. **ALWAYS explain** what changes you are going to make
2. **ALWAYS ask for confirmation** before executing database changes
3. **NEVER delete or modify existing data** without explicit permission
4. **NEVER drop collections/tables** without explicit permission

### Protected Items (DO NOT MODIFY without permission):
- Existing user accounts and passwords
- Order history and payment records
- Product inventory counts
- Vendor earnings and wallet balances
- Customer personal information

### When Adding New Fields to Models:
- Use `default` values so existing documents remain valid
- Explain what the new field does
- Show example of how existing data will be affected

### When Modifying Existing Fields:
1. First show current field structure
2. Explain why change is needed
3. Show new field structure
4. Confirm no data loss will occur
5. Wait for user approval

### Migration Rules:
- Create backup strategy before migrations
- Test on sample data first if possible
- Provide rollback plan

## Example Communication:

**BAD:**
```
I'll update the User model now.
[makes changes]
```

**GOOD:**
```
I need to add a new field 'phoneVerified' to the User model.

Current structure: User has email, password, profile
New field: phoneVerified (Boolean, default: false)

Impact on existing users: None - they will get phoneVerified=false by default

Should I proceed? (Yes/No)
```

## Server Restart Rules
- Always inform user when server restart is needed
- Provide the command to restart
- Confirm server is running after restart

## Code Change Rules
- Prefer editing existing files over creating new ones
- Don't add unnecessary comments or documentation
- Keep changes minimal and focused
- Test changes work before moving on

## Language Preference
- User communicates in Roman Urdu (Urdu written in English)
- Respond in same style when appropriate
- Technical terms can remain in English
