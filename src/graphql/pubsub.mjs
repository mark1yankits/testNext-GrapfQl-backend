import { PubSub } from 'graphql-subscriptions';

// Спробуємо створити інстанс різними способами, якщо стандартний не спрацює
let pubsubInstance;
try {
    pubsubInstance = new PubSub();
} catch (e) {
    console.error('⚠️ [PUBSUB] Failed to create with "new PubSub()", trying alternative...', e.message);
    // Деякі старі версії або специфічні білди можуть потребувати такого підходу
    if (PubSub.PubSub) {
        pubsubInstance = new PubSub.PubSub();
    } else {
        throw e;
    }
}

export const pubsub = pubsubInstance;

/**
 * Ручна реалізація asyncIterator для ситуацій, коли стандартний метод недоступний
 */
export function createAsyncIterator(triggers) {
    if (typeof pubsub.asyncIterator === 'function') {
        return pubsub.asyncIterator(triggers);
    }

    console.log('⚠️ [PUBSUB] Using manual AsyncIterator fallback for triggers:', triggers);
    
    // Власна реалізація на основі подій
    const pullQueue = [];
    const pushQueue = [];
    let listening = true;

    const pushValue = (value) => {
        if (pullQueue.length > 0) {
            pullQueue.shift()(value);
        } else {
            pushQueue.push(value);
        }
    };

    const pullValue = () => {
        return new Promise((resolve) => {
            if (pushQueue.length > 0) {
                resolve(pushQueue.shift());
            } else {
                pullQueue.push(resolve);
            }
        });
    };

    // Підписуємося на всі тригери
    const subscriptionPromises = triggers.map(trigger => 
        pubsub.subscribe(trigger, (payload) => {
            pushValue({ value: payload, done: false });
        })
    );

    return {
        next() {
            return listening ? pullValue() : Promise.resolve({ value: undefined, done: true });
        },
        return() {
            listening = false;
            subscriptionPromises.forEach(async (promise) => {
                const subId = await promise;
                pubsub.unsubscribe(subId);
            });
            return Promise.resolve({ value: undefined, done: true });
        },
        throw(error) {
            listening = false;
            return Promise.reject(error);
        },
        [Symbol.asyncIterator]() {
            return this;
        },
    };
}

console.log('🚀 [PUBSUB] Final instance keys:', Object.keys(pubsub));