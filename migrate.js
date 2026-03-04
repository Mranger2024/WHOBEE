#!/usr/bin/env node

/**
 * Socket.IO to Centrifugo Migration Script
 * 
 * This script automatically migrates files from Socket.IO to Centrifugo
 * by transforming imports, method calls, and event patterns.
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Files to migrate
const filesToMigrate = [
    'src/app/random/page.tsx',
    'src/app/voice-chat/page.tsx',
    'src/app/public-rooms/page.tsx',
    'src/app/public-rooms/[roomId]/page.tsx',
    'src/app/group/page.tsx',
    'src/app/group/[roomId]/page.tsx',
    'src/components/ui/chat-box.tsx',
    'src/components/ui/group-chat-box.tsx',
    'src/components/public-room/chat.tsx',
];

// Backup directory
const backupDir = 'socket-io-backup';

/**
 * Create backup of original file
 */
function backupFile(filePath) {
    const backupPath = path.join(backupDir, filePath);
    const backupDirPath = path.dirname(backupPath);

    if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
        log(`  ✓ Backed up to ${backupPath}`, 'blue');
        return true;
    }
    return false;
}

/**
 * Transform imports
 */
function transformImports(content) {
    // Replace SocketProvider with CentrifugoProvider
    content = content.replace(
        /import\s+{\s*useSocket\s*}\s+from\s+['"]@\/context\/SocketProvider['"]/g,
        "import { useCentrifugo } from '@/context/CentrifugoProvider'"
    );

    return content;
}

/**
 * Transform hook usage
 */
function transformHookUsage(content) {
    // Simple replacement: const socket = useSocket() -> const centrifugo = useCentrifugo()
    content = content.replace(
        /const\s+socket\s*=\s*useSocket\(\)/g,
        'const { clientId, subscribe, publish, sendOffer, sendAnswer, sendIceCandidate, sendNegotiationNeeded, sendNegotiationDone, sendChatMessage, joinRoom, leaveRoom, findRandomMatch, cancelRandomMatch, findVoiceMatch, cancelVoiceMatch, getPublicRooms, createPublicRoom, reportUser, isConnected } = useCentrifugo()'
    );

    return content;
}

/**
 * Add migration comments
 */
function addMigrationHeader(content, filename) {
    const header = `// MIGRATED FROM SOCKET.IO TO CENTRIFUGO
// Original file backed up in socket-io-backup/${filename}
// Migration date: ${new Date().toISOString()}

`;

    if (!content.includes('MIGRATED FROM SOCKET.IO')) {
        content = header + content;
    }

    return content;
}

/**
 * Add TODO comments for manual review
 */
function addTodoComments(content) {
    const todos = [
        '\n// TODO: Review socket.emit calls and replace with appropriate Centrifugo methods',
        '// TODO: Review socket.on calls and convert to subscribe pattern',
        '// TODO: Replace socket.id with clientId',
        '// TODO: Update channel names to use proper namespaces (room:, public:, group:, voice:, user:)',
        '// TODO: Test all functionality after migration\n',
    ];

    // Add TODOs at the top after imports
    const importEndIndex = content.lastIndexOf('import ');
    if (importEndIndex !== -1) {
        const nextLineEnd = content.indexOf('\n', importEndIndex);
        if (nextLineEnd !== -1) {
            content = content.slice(0, nextLineEnd + 1) +
                todos.join('\n') +
                content.slice(nextLineEnd + 1);
        }
    }

    return content;
}

/**
 * Create migration notes file
 */
function createMigrationNotes(filename) {
    const notes = `# Migration Notes for ${filename}

## Automatic Transformations Applied:
- ✓ Import changed from useSocket to useCentrifugo
- ✓ Hook destructured to get all Centrifugo methods

## Manual Review Required:

### 1. Socket.emit Transformations
Replace Socket.IO emit calls with Centrifugo methods:

**WebRTC Signaling:**
\`\`\`typescript
// Before:
socket.emit("offer", { to: remoteId, offer });

// After:
await sendOffer(\`room:\${roomId}\`, remoteId, offer);
\`\`\`

**Chat Messages:**
\`\`\`typescript
// Before:
socket.emit("send-message", { room, text, sender });

// After:
await sendChatMessage(\`room:\${roomId}\`, text, senderName);
\`\`\`

**Matching:**
\`\`\`typescript
// Before:
socket.emit("join-random");

// After:
const result = await findRandomMatch();
\`\`\`

### 2. Socket.on Transformations
Replace event listeners with subscribe pattern:

\`\`\`typescript
// Before:
socket.on("event-name", (data) => {
  handleData(data);
});

// After:
useEffect(() => {
  const unsubscribe = subscribe(\`room:\${roomId}\`, (data) => {
    if (data.type === 'event-name') {
      handleData(data);
    }
  });
  return unsubscribe;
}, [roomId]);
\`\`\`

### 3. Channel Names
Update to use proper namespaces:
- Private rooms: \`room:\${roomId}\`
- Public rooms: \`public:\${roomId}\`
- Group rooms: \`group:\${roomId}\`
- Voice chat: \`voice:\${roomId}\`
- User-specific: \`user:\${clientId}\`

### 4. Testing Checklist
- [ ] File compiles without errors
- [ ] WebRTC connections work
- [ ] Chat messages send/receive
- [ ] Presence tracking works
- [ ] All features functional

## Reference
See complete_migration_guide.md for detailed patterns and examples.
`;

    const notesPath = path.join(backupDir, `${filename}.migration-notes.md`);
    fs.writeFileSync(notesPath, notes);
    log(`  ✓ Created migration notes: ${notesPath}`, 'blue');
}

/**
 * Migrate a single file
 */
function migrateFile(filePath) {
    log(`\nMigrating: ${filePath}`, 'yellow');

    if (!fs.existsSync(filePath)) {
        log(`  ✗ File not found: ${filePath}`, 'red');
        return false;
    }

    // Create backup
    if (!backupFile(filePath)) {
        log(`  ✗ Failed to backup file`, 'red');
        return false;
    }

    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');

    // Apply transformations
    content = transformImports(content);
    content = transformHookUsage(content);
    content = addMigrationHeader(content, filePath);
    content = addTodoComments(content);

    // Write migrated content
    fs.writeFileSync(filePath, content);

    // Create migration notes
    createMigrationNotes(filePath);

    log(`  ✓ File migrated successfully`, 'green');
    return true;
}

/**
 * Main execution
 */
function main() {
    log('\n========================================', 'bright');
    log('Socket.IO to Centrifugo Migration Tool', 'bright');
    log('========================================\n', 'bright');

    // Create backup directory
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        log(`Created backup directory: ${backupDir}\n`, 'green');
    }

    let successCount = 0;
    let failCount = 0;

    // Migrate each file
    for (const file of filesToMigrate) {
        if (migrateFile(file)) {
            successCount++;
        } else {
            failCount++;
        }
    }

    // Summary
    log('\n========================================', 'bright');
    log('Migration Summary', 'bright');
    log('========================================', 'bright');
    log(`Total files: ${filesToMigrate.length}`, 'blue');
    log(`Successful: ${successCount}`, 'green');
    log(`Failed: ${failCount}`, failCount > 0 ? 'red' : 'green');
    log(`Backups saved to: ${backupDir}`, 'blue');

    log('\n========================================', 'bright');
    log('Next Steps:', 'bright');
    log('========================================', 'bright');
    log('1. Review each migrated file', 'yellow');
    log('2. Check TODO comments for manual updates', 'yellow');
    log('3. Read migration notes in backup directory', 'yellow');
    log('4. Test each feature thoroughly', 'yellow');
    log('5. See complete_migration_guide.md for patterns', 'yellow');

    log('\n✓ Migration complete!\n', 'green');
}

// Run the script
main();
