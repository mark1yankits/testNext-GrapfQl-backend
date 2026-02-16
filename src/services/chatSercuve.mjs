import supabase from '../config/supabase.mjs';

const ChatService = {
    async getChats() {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Помилка при отриманні чатів:', error);
            throw new Error(`Помилка при отриманні чатів: ${error.message}`);
        }
        return data || [];
    },

    async createChat(name, description, ownerId) {
        const { data, error } = await supabase
            .from('chats')
            .insert([
                {
                    name,
                    description: description ?? null,
                    ownerid: ownerId,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Помилка при створенні чату:', error);
            throw new Error(`Помилка при створенні чату: ${error.message}`);
        }
        return data;
    },
};

export default ChatService;