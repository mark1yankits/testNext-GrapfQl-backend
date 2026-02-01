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
                const token = jwt.sign({userId: user.id, email: user.email}, process.env.JWT_SECRET, {expiresIn: '1h'});
                return { success: true, token, user };
            },
            login: async (_, {email, password}) => {
                const user = await UserService.findUserByEmail(email)
                if(!user) {
                    return { success: false, error: "такого користувача не знайдено" };
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if(!isPasswordValid) {
                    return { success: false, error: "Невірний пароль" };
                }
                const token = jwt.sign({userId: user.id, email: user.email}, process.env.JWT_SECRET, {expiresIn: '1h'});
                return { success: true, token, user };
            },
        },
}


export default resolvers;