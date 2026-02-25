const { Kafka } = require('kafkajs');

let kafka;
let producer;
let consumer;

const connectKafka = async () => {
  try {
    kafka = new Kafka({
      clientId: 'chat-app',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });

    producer = kafka.producer();
    await producer.connect();
    console.log('Kafka producer connected');

    return { kafka, producer };
  } catch (error) {
    console.error('Kafka connection error:', error);
    throw error;
  }
};

const createConsumer = async (groupId, topics) => {
  try {
    if (!kafka) {
      await connectKafka();
    }

    consumer = kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topics });
    
    console.log(`Kafka consumer connected for group: ${groupId}`);
    return consumer;
  } catch (error) {
    console.error('Kafka consumer creation error:', error);
    throw error;
  }
};

const publishMessage = async (topic, message) => {
  try {
    if (!producer) {
      await connectKafka();
    }

    await producer.send({
      topic,
      messages: [{
        partition: 0,
        key: message.userId || Date.now().toString(),
        value: JSON.stringify(message),
        timestamp: Date.now().toString()
      }]
    });
  } catch (error) {
    console.error('Kafka publish error:', error);
    throw error;
  }
};

const subscribeToMessages = async (groupId, topics, messageHandler) => {
  try {
    const consumer = await createConsumer(groupId, topics);
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageData = JSON.parse(message.value.toString());
          await messageHandler(topic, messageData);
        } catch (error) {
          console.error('Message processing error:', error);
        }
      },
    });
  } catch (error) {
    console.error('Kafka subscription error:', error);
    throw error;
  }
};

const disconnectKafka = async () => {
  try {
    if (producer) await producer.disconnect();
    if (consumer) await consumer.disconnect();
    console.log('Kafka disconnected');
  } catch (error) {
    console.error('Kafka disconnect error:', error);
  }
};

module.exports = {
  connectKafka,
  createConsumer,
  publishMessage,
  subscribeToMessages,
  disconnectKafka
};
