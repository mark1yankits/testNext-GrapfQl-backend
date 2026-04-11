import supabase from '../config/supabase.mjs';

const UserService = {

    async findUserByEmail(email) {
        const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

        if(error && error.code !== 'PGRST116') {
            console.error("Помилка при пошуку:", error);
        }

        return data;
        
    },

    async createUser(name,email,password) {
        const {data,error} = await supabase
        .from('users')
        .insert([
            {
                name: name,
                email: email,
                password: password
            }
        ])
        .select()
        .single();

        if(error ) {
            console.error("Помилка при створенні користувача:", error);
        }

        return data;
    },
    async updateUser (id,updateData) {
        const {data,error} = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

        if(error) {
            console.error("Помилка при оновленні користувача:", error);
            throw new Error(`Помилка при оновленні: ${error.message}`);
        }

        return data;
    },
    async getAllUsers() {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, createdAt:created_at')
            .order('name', { ascending: true });
    
        if (error) throw new Error(error.message);
        return data;
    },
    async getUserById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, createdAt:created_at')
            .eq('id', id)
            .single();
    
        if (error) return null;
        return data;
    },
}

export default UserService;