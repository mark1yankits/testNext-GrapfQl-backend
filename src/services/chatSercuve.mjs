import supabase from '../config/supabase.mjs';

const ChatService = {
    async getChats( userId ) {
        const { data, error } = await supabase
            .from('chat_members')
            .select(`
                role,
                joined_at,
                chats(
                    id,
                    name,
                    description,
                    ownerid,
                    created_at,
                )
            `)
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });


        if (error) {
            console.error('Помилка при отриманні чатів:', error);
            throw new Error(`Помилка при отриманні чатів: ${error.message}`);
        }
        return data
        .filter(membership => membership.chats)
        .map(membership => ({
            ...membership.chats,
            userRole: membership.role,
        }));
    },

    async createChat(name, description, ownerId, memberIds) {
        const { data, error } = await supabase
            .from('chats')
            .insert([
                {
                    name,
                    description: description ?? null,
                    ownerid: owner_id,
                },
            ])
            .select()
            .single();

        if (chatError) throw new Error(`Помилка створення чату: ${chatError.message}`);

        const allMembers = Array.from(new Set ([ownerId, ...memberIds]));

        const membersData = allMembers.map(id => ({
            chat_id: data.id,
            user_id: id,
            role: id === ownerId ? 'owner' : 'member',
        }))

        const { error: membersError } = await supabase
        .from('chat_members')
        .insert(membersData);

        if (membersError) throw new Error(`Помилка додавання учасників: ${membersError.message}`);


        return data;
    },


    async getChatMembers(chatId) {
        const {data,error} = await supabase
        .from('chat_members')
        .select(`
            user_id,
            role,
            joined_at,
            users(
                id,
                name,
                email,
            )
        `)
        .eq('chat_id', chatId)

        if (error) throw error;

        return data
    }
    // async getChatById(id) {
    //     const {data, error} = await supabase
    //     .from('chats')
    //     .select('*')
    //     .eq('id', id)
    //     .single();


    //     if(error && error.code !== 'PGRST116') {
    //         console.error('Помилка при отриманні чату:', error);
    //         throw new Error(`Помилка при отриманні чату: ${error.message}`);
    //     }

    //     return data || null;
    // }
};

export default ChatService;