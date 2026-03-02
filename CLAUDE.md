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

## Deployment Rules (MANDATORY)

### Server Details:
- **Domain**: marketplace.byredstone.com
- **Host Server IP**: 135.181.162.188
- **LXC Container ID**: 107
- **Hostname**: marketplace
- **Container IP**: 10.10.10.242
- **SSH Access**: `ssh root@135.181.162.188 "pct exec 107 -- bash"`
- **Project Path**: `/var/www/project`
- **PM2 Process**: `ecommerce-backend`

### Deployment Workflow (After EVERY code change):
1. **Push to GitHub** from local MacBook
2. **Pull from GitHub** on server (inside LXC container)
3. **If frontend (client/) changed**: Rebuild client (`npm run build`) on server
4. **Restart PM2** backend: `pm2 restart ecommerce-backend`
5. **Verify** server is running: `pm2 status`

### Deployment Commands (run on server via SSH):
```bash
ssh root@135.181.162.188 "pct exec 107 -- bash -c 'cd /var/www/project && git pull origin main && npm run build && pm2 restart ecommerce-backend && pm2 status'"
```

### Important:
- ALWAYS push to GitHub first, then pull on server
- NEVER edit files directly on the server
- ALWAYS restart PM2 after pulling changes
- If only backend changes: skip `npm run build`, just restart PM2
- If frontend changes: MUST run `npm run build` before PM2 restart
- Server access is via LXC container (pct exec 107) on host 135.181.162.188

## Website & Mobile App Connectivity Rules
- Website and Mobile App MUST use the **same backend server and database**
- Production backend: `https://marketplace.byredstone.com`
- Both website and mobile app connect to the SAME production server
- Mobile app API base: `https://marketplace.byredstone.com/api`
- Socket.io: `https://marketplace.byredstone.com`
- Any changes to backend APIs must work for BOTH website and mobile app
- User accounts, orders, products, chat - everything is shared between website and app

## Language Preference
- User communicates in Roman Urdu (Urdu written in English)
- Respond in same style when appropriate
- Technical terms can remain in English
