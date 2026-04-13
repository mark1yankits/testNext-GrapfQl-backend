import UserService from '../services/userService.mjs';
import ChatService from '../services/chatSercuve.mjs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pubsub, createAsyncIterator } from './pubsub.mjs'; 
import { withFilter } from 'graphql-subscriptions';

console.log('🚀 [PUBSUB] Instance methods:', Object.keys(pubsub));

const resolvers = {
    Query: {
        me: async (_, __, context) => {
            if (!context?.user?.email) {
                throw new Error("Не авторизовано");
            }
            return await UserService.findUserByEmail(context.user.email);
        },
        chat: async (_, { id }, context) => {
            if (!context.user) throw new Error("Не авторизовано");
            return await ChatService.getChatById(id);
        },
        chats: async (_, __, context) => {
            if (!context.user) throw new Error("Не авторизовано");
            const currentUserId = context.user.userId || context.user.id;
            return ChatService.getChats(currentUserId);
        },
        users: async (_, __, context) => {
            if (!context.user) throw new Error("Не авторизовано");
            return UserService.getAllUsers();
        },
        messages: async (_, { chatId }, context) => {
            if (!context.user) throw new Error("Не авторизовано");
            return await ChatService.getMessages(chatId);
        }
    },

    User: {
        createdAt: (parent) => parent.createdAt || parent.created_at
    },

    Chat: {
        createdAt: (parent) => parent.createdAt || parent.created_at,
        owner_id: (parent) => parent.owner_id || parent.ownerid,
        members: async (parent) => {
            return await ChatService.getChatMembers(parent.id);
        }
    },

    ChatMember: {
        joined_at: (parent) => parent.joined_at || parent.joinedAt,
        user: async (parent) => {
            if (parent.users) return parent.users;
            if (parent.user) return parent.user;
            return await UserService.getUserById(parent.user_id);
        }
    },

    Mutation: {
        register: async (_, { name, email, password }) => {
            const newUser = await UserService.findUserByEmail(email);
            if (newUser) {
                throw new Error("Користувач з таким email вже існує");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await UserService.createUser(name, email, hashedPassword);
            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return { success: true, token, user };
        },

        login: async (_, { email, password }) => {
            const user = await UserService.findUserByEmail(email);
            if (!user) {
                return { success: false, error: "Такого користувача не знайдено" };
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return { success: false, error: "Невірний пароль" };
            }
            const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return { success: true, token, user };
        },

        updateUser: async (_, { name, email, password }, context) => {
            if (!context?.user) {
                throw new Error("Не авторизовано");
            }

            const userId = context.user.userId || context.user.id;
            const updateData = {};
            
            if (name !== undefined) updateData.name = name;

            if (email !== undefined) {
                const existingUser = await UserService.findUserByEmail(email);
                if (existingUser && existingUser.id !== userId) {
                    throw new Error("Цей email вже використовується іншим користувачем");
                }
                updateData.email = email;
            }

            if (password !== undefined) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            if (Object.keys(updateData).length === 0) {
                throw new Error("Немає даних для оновлення");
            }

            const updatedUser = await UserService.updateUser(userId, updateData);
            if (!updatedUser) {
                throw new Error("Не вдалося оновити користувача");
            }

            const token = jwt.sign(
                { userId: updatedUser.id, email: updatedUser.email },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return { success: true, token, user: updatedUser };
        },
        createChat: async (_, { name, description, memberIds }, context) => {
            if (!context.user) throw new Error("Не авторизовано");

            const currentUserId = context.user.userId || context.user.id || context.user.sub;

            if (!currentUserId) {
                throw new Error("ID користувача не знайдено в токені. Спробуйте перелогінитися.");
            }

            const newChat = await ChatService.createChat(
                name,
                description,
                currentUserId,
                memberIds 
            );

            pubsub.publish('CHAT_CREATED', { chatCreated: newChat });
            return newChat;
        },
        createMessage: async (_, { chatId, text }, context) => { 
            if (!context.user) throw new Error('Не авторизовано');
            const currentUserId = context.user.userId || context.user.id;
            const newMessage = await ChatService.createMessage(chatId, currentUserId, text);
            
            console.log(`[SUBSCRIPTION] Публікація повідомлення для чату: ${chatId}`);
            
            if (typeof pubsub.publish !== 'function') {
                console.error('❌ [ERROR] pubsub.publish is not a function! Check pubsub instance.');
            }

            // Використовуємо спільний канал для всіх повідомлень, фільтрація буде в Subscription
            pubsub.publish('MESSAGE_SENT', { messageSent: newMessage });
            
            return newMessage;
        },
    },

    Message: {
        chatId: (parent) => parent.chatId || parent.chat_id,
        userId: (parent) => parent.userId || parent.sender_id || parent.user_id || parent.senderId,
        text: (parent) => parent.text || parent.content,
        createdAt: (parent) => parent.createdAt || parent.created_at,
        user: async (parent) => {
            if (parent.user) return parent.user;
            const uid = parent.userId || parent.sender_id || parent.user_id || parent.senderId;
            return await UserService.getUserById(uid);
        }
    },

    Subscription: {
        chatCreated: {
            subscribe: () => pubsub.asyncIterator(['CHAT_CREATED'])
        },
        messageSent: {
            subscribe: withFilter(
                (_, { chatId }) => {
                    console.log(`🔌 [WS] Створення ітератора для MESSAGE_SENT (chatId: ${chatId})`);
                    return createAsyncIterator(['MESSAGE_SENT']);
                },
                (payload, variables) => {
                    const messageChatId = payload?.messageSent?.chatId || payload?.messageSent?.chat_id;
                    const match = String(messageChatId) === String(variables.chatId);
                    
                    console.log(`📡 [WS] Фільтрація: ${messageChatId} vs ${variables.chatId} -> ${match ? 'SEND' : 'SKIP'}`);
                    return match;
                }
            ),
            resolve: (payload) => payload.messageSent
        }
    }
};

export default resolvers;