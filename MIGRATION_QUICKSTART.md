# Socket.IO to Centrifugo Migration - Quick Start Guide

This guide will help you quickly migrate all remaining files from Socket.IO to Centrifugo.

## Automated Migration Script

I've created `migrate.js` which will:
- ✅ Backup all original files to `socket-io-backup/`
- ✅ Transform imports from `useSocket` to `useCentrifugo`
- ✅ Update hook declarations
- ✅ Add TODO comments for manual review
- ✅ Create migration notes for each file

## How to Run

```bash
# From your project directory
node migrate.js
```

## What the Script Does

### 1. Automatic Transformations
- Changes `import { useSocket }` to `import { useCentrifugo }`
- Updates hook usage to destructure Centrifugo methods
- Adds migration header with timestamp
- Creates backup of every file

### 2. What You Need to Review Manually

After running the script, each file will have TODO comments. You'll need to:

#### Replace socket.emit calls:
```typescript
// FIND patterns like:
socket.emit("event-name", data)

// REPLACE with appropriate Centrifugo method:
await sendOffer(channel, to, offer)
await sendChatMessage(channel, text, name)
await findRandomMatch()
```

#### Replace socket.on calls:
```typescript
// FIND patterns like:
socket.on("event-name", handler)

// REPLACE with subscribe pattern:
useEffect(() => {
  const unsubscribe = subscribe(channel, (data) => {
    if (data.type === 'event-name') {
      handler(data);
    }
  });
  return unsubscribe;
}, [channel]);
```

#### Replace socket.id:
```typescript
// FIND:
socket.id

// REPLACE with:
clientId
```

## Files That Will Be Migrated

1. `src/app/random/page.tsx` - Random chat
2. `src/app/voice-chat/page.tsx` - Voice chat
3. `src/app/public-rooms/page.tsx` - Public rooms list
4. `src/app/public-rooms/[roomId]/page.tsx` - Public room page
5. `src/app/group/page.tsx` - Group rooms list
6. `src/app/group/[roomId]/page.tsx` - Group room page
7. `src/components/ui/chat-box.tsx` - Chat component
8. `src/components/ui/group-chat-box.tsx` - Group chat component
9. `src/components/public-room/chat.tsx` - Public room chat

## After Running the Script

### For Each File:

1. **Open the file** and look for `// TODO:` comments
2. **Review the migration notes** in `socket-io-backup/[filename].migration-notes.md`
3. **Apply the transformations** using the patterns in `complete_migration_guide.md`
4. **Test the feature** to ensure it works

### Testing Checklist

For each migrated feature:
- [ ] File compiles without TypeScript errors
- [ ] Feature loads without runtime errors
- [ ] WebRTC connections establish correctly
- [ ] Chat messages send and receive
- [ ] All buttons and controls work
- [ ] Presence tracking is accurate

## Quick Reference: Common Transformations

### Random Chat (`src/app/random/page.tsx`)

**Join Queue:**
```typescript
// Before:
socket.emit("join-random");

// After:
const result = await findRandomMatch();
if (result.matched) {
  setRemoteUserId(result.partnerId);
  setRoomId(result.roomId);
} else {
  // Subscribe for match notification
  const unsubscribe = subscribe(`user:${clientId}`, (data) => {
    if (data.type === 'match-found') {
      setRemoteUserId(data.partnerId);
      setRoomId(data.roomId);
    }
  });
}
```

**WebRTC in Room:**
```typescript
// Use the same pattern as page_centrifugo.tsx
// Channel: room:${roomId}
```

### Voice Chat (`src/app/voice-chat/page.tsx`)

**Almost identical to random chat, but:**
```typescript
const result = await findVoiceMatch();
// Channel: voice:${roomId}
```

### Public Rooms (`src/app/public-rooms/page.tsx`)

**Get Rooms:**
```typescript
// Before:
socket.emit("get-public-rooms");
socket.on("public-rooms-list", ({ rooms }) => setRooms(rooms));

// After:
const fetchRooms = async () => {
  const { rooms } = await getPublicRooms();
  setRooms(rooms);
};

useEffect(() => {
  fetchRooms();
  
  const unsubscribe = subscribe('public:updates', (data) => {
    if (data.type === 'room-created') {
      setRooms(prev => [...prev, data.room]);
    }
  });
  return unsubscribe;
}, []);
```

**Create Room:**
```typescript
// Before:
socket.emit("create-public-room", { name, description });

// After:
const result = await createPublicRoom(name, description, creatorName);
if (result.success) {
  router.push(`/public-rooms/${result.roomId}`);
}
```

### Public Room Page (`src/app/public-rooms/[roomId]/page.tsx`)

**Join Room:**
```typescript
// Channel: public:${roomId}

useEffect(() => {
  joinRoom(roomId, userName, 'public');
  
  const unsubscribe = subscribe(`public:${roomId}`, (data) => {
    if (data.type === 'user-joined') {
      // Add participant
    } else if (data.type === 'chat-message') {
      // Add message
    } else if (data.type === 'offer' && data.to === clientId) {
      // Handle WebRTC offer
    }
  });
  
  return () => {
    leaveRoom(roomId, 'public');
    unsubscribe();
  };
}, [roomId]);
```

### Chat Components

**Send Message:**
```typescript
// Before:
socket.emit("send-message", { room, text, sender });

// After:
await sendChatMessage(channel, text, senderName);
```

**Receive Message:**
```typescript
// Before:
socket.on("chat-message", (data) => {
  setMessages(prev => [...prev, data]);
});

// After:
useEffect(() => {
  const unsubscribe = subscribe(channel, (data) => {
    if (data.type === 'chat-message') {
      setMessages(prev => [...prev, data]);
    }
  });
  return unsubscribe;
}, [channel]);
```

## Manual Migration Alternative

If you prefer to migrate manually instead of using the script:

1. Use `page_centrifugo.tsx` as your reference
2. Follow the patterns in `complete_migration_guide.md`
3. Copy the subscribe/publish patterns
4. Test each file as you go

## Rollback

If you need to rollback:
```bash
# Restore from backup
cp socket-io-backup/src/app/random/page.tsx src/app/random/page.tsx
```

All original files are safely stored in `socket-io-backup/`.

## Support

- **Example File:** `src/app/room/[roomId]/page_centrifugo.tsx`
- **Complete Guide:** `complete_migration_guide.md`
- **Migration Notes:** `socket-io-backup/[filename].migration-notes.md` (after running script)

## Success Criteria

Migration is complete when:
- ✅ All files compile without errors
- ✅ All features work as before
- ✅ No Socket.IO imports remain
- ✅ All tests pass

---

**Ready to migrate?** Run `node migrate.js` to get started!
