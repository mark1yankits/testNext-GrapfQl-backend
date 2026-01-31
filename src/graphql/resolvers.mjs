import UserService from '../services/userService.mjs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

 const resolvers = {
    Query: {
        me: async (_, __, context) => {
            if (!context || !context.user || !context.user.email) {
                throw new Error("Не авторизовано");
            }
            const user = await UserService.findUserByEmail(context.user.email);
            return user;
        },
    },
        Mutation: {
            register: async (_, { name, email, password }) => {
                const newUser =  await UserService.findUserByEmail(email);
                if(newUser) {
                    throw new Error("Користувач з таким email вже існує");
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                const user = await UserService.createUser(name, email, hashedPassword);
                const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET, {expiresIn: '1h'});
                return { success: true, token, user };
            },
            login: (_, {email, password}) => {
                const user = user.find(
                    user=> user.email === email && user.password === password
                )

                if(!user) {
                    throw new Error("Невірний email або пароль");
                }

                return "Успішний вхід!";
            }
    }
 };

 export default resolvers;