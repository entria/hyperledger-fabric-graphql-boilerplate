import mongoose from 'mongoose';

const mongoUri = 'mongodb://localhost/database';

// mongoose.set('debug', true);

mongoose.Promise = Promise;
mongoose.connect(mongoUri, {
  server: {
    auto_reconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
  },
});

export const connection = mongoose.connection;

connection.on('error', (e) => {
  if (e.message.code === 'ETIMEDOUT') {
    console.log(e);
    mongoose.connect(mongoUri, opts);
  }
  console.log(e);
});

function clearDB() {
  console.log('cleardb');
  for (const i in mongoose.connection.collections) {
    mongoose.connection.collections[i].remove(() => {});
  }
  console.log('cleardb end');
}

connection.once('open', () => {
  console.log(`MongoDB successfully connected to ${mongoUri}`);

  // TODO - figure it out how to clean database
  // clearDB();
});
