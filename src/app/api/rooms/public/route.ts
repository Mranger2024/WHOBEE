import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { centrifugoClient } from '@/lib/centrifuge';

// Get all public rooms
export async function GET() {
    try {
        const supabase = createClient();

        const { data: rooms, error } = await supabase
            .from('public_rooms')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Get participant counts from Centrifugo presence
        const roomsWithCounts = await Promise.all(
            (rooms || []).map(async (room) => {
                try {
                    const presence = await centrifugoClient.getPresence(`public:${room.id}`);
                    const participantCount = presence.result?.num_clients || 0;

                    return {
                        ...room,
                        participantCount,
                        isFull: participantCount >= room.max_participants,
                    };
                } catch (error) {
                    console.error(`Error getting presence for room ${room.id}:`, error);
                    return {
                        ...room,
                        participantCount: 0,
                        isFull: false,
                    };
                }
            })
        );

        return NextResponse.json({ rooms: roomsWithCounts });
    } catch (error) {
        console.error('Get public rooms error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch public rooms' },
            { status: 500 }
        );
    }
}

// Create a new public room
export async function POST(request: NextRequest) {
    try {
        const { name, description, creatorName, creatorAvatar } = await request.json();

        if (!name || !creatorName) {
            return NextResponse.json(
                { error: 'Room name and creator name are required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Check if room with same name exists
        const { data: existing } = await supabase
            .from('public_rooms')
            .select('id')
            .eq('name', name)
            .eq('is_active', true)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'A room with this name already exists', roomId: existing.id },
                { status: 409 }
            );
        }

        // Create new room
        const { data: room, error } = await supabase
            .from('public_rooms')
            .insert({
                name,
                description: description || 'No description',
                created_by: creatorName,
                creator_avatar: creatorAvatar,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Broadcast room creation to all clients
        await centrifugoClient.publish('public:rooms', {
            type: 'room-created',
            room: {
                ...room,
                participantCount: 0,
                isFull: false,
            },
        });

        return NextResponse.json({
            success: true,
            roomId: room.id,
            room,
        });
    } catch (error) {
        console.error('Create public room error:', error);
        return NextResponse.json(
            { error: 'Failed to create public room' },
            { status: 500 }
        );
    }
}

// Delete/deactivate a room
export async function DELETE(request: NextRequest) {
    try {
        const { roomId, creatorId } = await request.json();

        if (!roomId || !creatorId) {
            return NextResponse.json(
                { error: 'Room ID and creator ID are required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Verify creator
        const { data: room } = await supabase
            .from('public_rooms')
            .select('created_by')
            .eq('id', roomId)
            .single();

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // Deactivate room instead of deleting
        const { error } = await supabase
            .from('public_rooms')
            .update({ is_active: false })
            .eq('id', roomId);

        if (error) {
            throw error;
        }

        // Broadcast room deletion
        await centrifugoClient.publish('public:rooms', {
            type: 'room-deleted',
            id: roomId,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete public room error:', error);
        return NextResponse.json(
            { error: 'Failed to delete public room' },
            { status: 500 }
        );
    }
}
