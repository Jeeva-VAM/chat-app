// Database debug script
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDatabase() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        const db = client.db('chat-app');
        
        console.log('🔍 Complete Database Analysis - chat-app\n');
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('📁 Collections in database:');
        collections.forEach(col => console.log(`  - ${col.name}`));
        console.log('');
        
        // Check profiles collection - get ALL documents without any filters
        console.log('🔍 Checking ALL documents in profiles collection...\n');
        const allProfiles = await db.collection('profiles').find({}).toArray();
        console.log(`📊 PROFILES Collection: ${allProfiles.length} total documents`);
        
        allProfiles.forEach((profile, index) => {
            console.log(`\n👤 Profile ${index + 1}:`);
            console.log(`  - _id: ${profile._id}`);
            console.log(`  - userId: ${profile.userId || 'MISSING'}`);
            console.log(`  - name: ${profile.name || 'MISSING'}`);
            console.log(`  - email: ${profile.email || 'MISSING'}`);
            console.log(`  - profileImage: ${profile.profileImage ? 'Present' : 'Missing'}`);
            console.log(`  - status: ${profile.status || 'Missing'}`);
            console.log(`  - createdAt: ${profile.createdAt || 'Missing'}`);
            console.log(`  - All fields:`, Object.keys(profile));
        });
        
        // Also check with different queries to make sure we're not missing anything
        console.log('\n🔍 Testing different queries...');
        const countTotal = await db.collection('profiles').countDocuments({});
        const countWithUserId = await db.collection('profiles').countDocuments({ userId: { $exists: true } });
        const countWithName = await db.collection('profiles').countDocuments({ name: { $exists: true } });
        
        console.log(`📊 Total documents: ${countTotal}`);
        console.log(`📊 Documents with userId: ${countWithUserId}`);
        console.log(`📊 Documents with name: ${countWithName}`);
        
        // Check chat-users collection (if exists)
        try {
            const chatUsers = await db.collection('chat-users').find({}).toArray();
            console.log(`\n📊 CHAT-USERS Collection: ${chatUsers.length} documents`);
            chatUsers.forEach((user, index) => {
                console.log(`\n👥 Chat-User ${index + 1}:`);
                console.log(`  - _id: ${user._id}`);
                console.log(`  - userId: ${user.userId || 'MISSING'}`);
                console.log(`  - name: ${user.name || 'MISSING'}`);
                console.log(`  - email: ${user.email || 'MISSING'}`);
                console.log(`  - profileImage: ${user.profileImage ? 'Present' : 'Missing'}`);
                console.log(`  - createdAt: ${user.createdAt || 'Missing'}`);
            });
        } catch (err) {
            console.log('\n📊 CHAT-USERS Collection: Does not exist or empty');
        }
        
        // Check conversations
        const conversations = await db.collection('conversations').find({}).toArray();
        console.log(`\n💬 CONVERSATIONS Collection: ${conversations.length} documents`);
        
        // Check messages
        const messages = await db.collection('messages').find({}).toArray();
        console.log(`📨 MESSAGES Collection: ${messages.length} documents`);
        
        await client.close();
        
    } catch (error) {
        console.error('❌ Database check error:', error);
    }
}

checkDatabase();