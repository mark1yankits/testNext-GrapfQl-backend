import pkg from 'graphql-subscriptions';
console.log('--- Debug graphql-subscriptions ---');
console.log('Package keys:', Object.keys(pkg));
const { PubSub } = pkg;
console.log('PubSub type:', typeof PubSub);
if (typeof PubSub === 'function') {
    const ps = new PubSub();
    console.log('Instance keys:', Object.keys(ps));
    console.log('asyncIterator type:', typeof ps.asyncIterator);
}
console.log('---------------------------------');
