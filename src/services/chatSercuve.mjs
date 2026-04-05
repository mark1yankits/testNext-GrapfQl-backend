import supabase from '../config/supabase.mjs';

const ChatService = {
    async getChats( userId ) {
        const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('ownerid', userId)
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

    async getChatById(id) {
        const {data, error} = await supabase
        .from('chats')
        .select('*')
        .eq('id', id)
        .single();


        if(error && error.code !== 'PGRST116') {
            console.error('Помилка при отриманні чату:', error);
            throw new Error(`Помилка при отриманні чату: ${error.message}`);
        }

        return data || null;
    }
};

export default ChatService;