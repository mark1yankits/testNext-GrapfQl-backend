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
                user:user_id (id, name, email, created_at)
            `)
            .eq('chat_id', chatId);
    
        if (error) throw error;
    
        return data.map(member => ({
            user_id: member.user_id,
            role: member.role,
            joined_at: member.joined_at,
            user: member.user
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
    },

    async getMessages(chatId) {
        const { data, error } = await supabase 
            .from('messages')
            .select(`
                id,
                content,
                chat_id,
                sender_id,
                created_at,
                user:users!sender_id (id, name, email)
            `)
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });
    
        if (error) throw error;
    
        return data.map(msg => ({
            id: msg.id,
            text: msg.content,        
            chatId: msg.chat_id,      
            senderId: msg.sender_id,  
            createdAt: msg.created_at,
            user: msg.user
        }));
    },
    async createMessage(chatId, senderId, text) {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ 
                chat_id: chatId, 
                sender_id: senderId, 
                content: text 
            }])
            .select(`
                id,
                content,
                chat_id,
                sender_id,
                created_at,
                user:users!sender_id (
                    id,
                    name
                )
            `)
            .single();

        if (error) throw new Error(`Помилка створення повідомлення: ${error.message}`);

        return {
            id: data.id,
            text: data.content,
            chatId: data.chat_id,
            senderId: data.sender_id,
            createdAt: data.created_at,
            user: data.user,
            is_read: false
        };
    },
};

export default ChatService;