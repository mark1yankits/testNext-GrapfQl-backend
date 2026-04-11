import supabase from '../config/supabase.mjs';

const ChatService = {
    async getChats(userId) {
        console.log("Запит чатів для користувача ID:", userId);
    
        const { data, error } = await supabase
            .from('chat_members')
            .select(`
                role,
                joined_at,
                chats (
                    id,
                    name,
                    description,
                    owner_id,
                    created_at
                )
            `)
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });
    
        if (error) {
            console.error('Помилка при отриманні чатів:', error);
            throw new Error(`Помилка при отриманні чатів: ${error.message}`);
        }
    
        console.log("Дані з бази (Raw data):", JSON.stringify(data, null, 2));
    
        if (!data) return [];
    
        return data
            .filter(membership => membership.chats)
            .map(membership => {
                const chat = Array.isArray(membership.chats) ? membership.chats[0] : membership.chats;
                
                return {
                    ...chat,
                    id: chat.id,
                    name: chat.name,
                    description: chat.description,
                    owner_id: chat.owner_id,
                    createdAt: chat.created_at,
                    userRole: membership.role
                };
            });
    },

    async createChat(name, description, ownerId, memberIds = []) {
        console.log("Початок створення чату. Власник:", ownerId);

        const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .insert([
                {
                    name: name,
                    description: description || null,
                    owner_id: ownerId,
                },
            ])
            .select()
            .single();

        if (chatError) {
            console.error("Помилка Supabase при створенні чату:", chatError);
            throw new Error(`Помилка створення чату: ${chatError.message}`);
        }

        const allMemberIds = Array.from(new Set([ownerId, ...memberIds])).filter(Boolean);

        console.log("СПИСОК ВСІХ УЧАСНИКІВ ДЛЯ ЗАПИСУ:", allMemberIds);

        const membersToInsert = allMemberIds.map(uid => ({
            chat_id: chatData.id,
            user_id: uid,
            role: uid === ownerId ? 'owner' : 'member',
        }));

        const { error: membersError } = await supabase
            .from('chat_members')
            .insert(membersToInsert);

        if (membersError) {
            console.error("Помилка при додаванні учасників:", membersError);
        }

        return {
            ...chatData,
            createdAt: chatData.created_at,
            owner_id: chatData.owner_id
        };
    },

    async getChatMembers(chatId) {
        const { data, error } = await supabase
            .from('chat_members')
            .select(`
                user_id,
                role,
                joined_at,
                users(
                    id,
                    name,
                    email,
                    created_at
                )
            `)
            .eq('chat_id', chatId);

        if (error) {
            console.error('Помилка при отриманні учасників:', error);
            throw error;
        }

        return data.map(member => ({
            ...member,
            user: member.users ? {
                ...member.users,
                createdAt: member.users.created_at
            } : null
        }));
    },


    async getChatById(id) {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; 
            console.error('Помилка при отриманні чату за ID:', error);
            throw new Error(`Помилка: ${error.message}`);
        }

        return {
            ...data,
            createdAt: data.created_at,
            owner_id: data.owner_id
        };
    }
};

export default ChatService;