const { MongoClient } = require('mongodb');
const mongourl = 'mongodb://localhost:27017';

const client = new MongoClient(mongourl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dbName = "message_webhook";

module.exports = {
  connectToMongodb: async () => {
    await client.connect();

    const db = client.db(dbName);

    return db.collection("message");
  },
  closeDb: () => {
    client.close();
  }
}