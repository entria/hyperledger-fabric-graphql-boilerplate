/**
 Helper Function for Mocha tests
 Modified from https://github.com/elliotf/mocha-mongoose
 ***/
import mongoose from 'mongoose';
// import kue from 'kue';

const { ObjectId } = mongoose.Types;

process.env.NODE_ENV = 'test';

const config = {
  db: {
    test: 'mongodb://localhost/feedback-models-test',
  },
  connection: null,
};

// ensure the NODE_ENV is set to 'test'
// this is helpful when you would like to change behavior when testing

function connect() {
  return new Promise((resolve, reject) => {
    if (config.connection) {
      return resolve();
    }

    const mongoUri = 'mongodb://localhost/feedback-models-test';

    mongoose.Promise = Promise;

    const options = {
      server: {
        auto_reconnect: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 1000,
      },
    };

    mongoose.connect(mongoUri, options);

    config.connection = mongoose.connection;

    config.connection
      .once('open', resolve)
      .on('error', (e) => {
        if (e.message.code === 'ETIMEDOUT') {
          console.log(e);

          mongoose.connect(mongoUri, options);
        }

        console.log(e);
        reject(e);
      });
  });
}

function clearDatabase() {
  return new Promise(resolve => {
    for (const i in mongoose.connection.collections) {
      mongoose.connection.collections[i].remove(function() {});
    }

    resolve();
  });
}

export async function setupTest() {
  await connect();
  await clearDatabase();

  // kue.clearJobs();
}

function dropCollection(collection) {
  return new Promise((resolve, reject) => {
    mongoose.connection.collections[collection].drop((err) => {
      if (err) reject(err);

      resolve();
    })
  });
}

export function disconnect() {
  return new Promise(async (resolve, reject) => {
    mongoose.disconnect((err) => {
      resolve();
    });
  });
}

function isValidDate(val) {
  if (val === false) {
    return false;
  }

  let temp;
  if (val instanceof Date) {
    temp = val;
  } else {
    temp = new Date(val);
  }

  return isNaN(temp.getTime()) === false;
}

/**
 * Prepare an object to be snapshoted by jest
 * replace objectID
 * replace datetime
 * frozen same specific keys
 * @param obj
 * @param frozenKeys
 * @returns {{}}
 */
export function prepareObject(obj, frozenKeys = []) {
  const placeholder = {};
  let counter = 0;

  const objectIdToNumber = {};

  Object.keys(obj).map((key) => {
    const value = obj[key];

    if (frozenKeys.indexOf(key) > -1) {
      placeholder[key] = `${key}-FROZED`;
      return;
    }

    // Handle objectID
    if (value !== 0 && ObjectId.isValid('' + value)) {
      if (value in objectIdToNumber) {
      } else {
        objectIdToNumber[value] = counter;
        counter++;
      }

      const internalId = objectIdToNumber[value];

      placeholder[key] = `OBJECTID_${internalId}`;
      return;
    }

    // Handle Date
    if (typeof value !== 'number' && isValidDate(value)) {
      placeholder[key] = 'FAKE-DA-TET00:00:00.000Z';
      return;
    }

    // Handle array
    if (Array.isArray(value)) {
      placeholder[key] = value.map((item) => prepareObject(item));
      return;
    }

    if (typeof value === 'object') {
      placeholder[key] = prepareObject(value);
      return;
    }

    // if (value && typeof value !== 'undefined') {
    //   console.log('valid: ', value);
    //
    //   if (value._id) {
    //     placeholder[key] = prepareMongooseObject(value);
    //     return;
    //   }
    // }

    placeholder[key] = value;
  });

  return placeholder;
}


/**
 * Prepare a koa response
 * @param res
 * @param frozenKeys
 * @returns {{status, body: {}}}
 */
export function prepareResponse(res, frozenKeys = []) {
  return {
    status: res.status,
    body: prepareObject(res.body, frozenKeys),
  };
}

/**
 * Extract object ids from mongoose objects to make it possible to use with snapshot feature
 * @param obj
 * @returns {{}}
 */
export function prepareMongooseObject(obj, frozenKeys = []) {
  return prepareObject(obj.toJSON(), frozenKeys);
}

export const worker = {
  job: {
    data: {},
    log: log => console.log('Job log', log),
  },
  done: message => console.log('Finished', message),
};

/**
 * Sanitize a test text removing the mentions of a `ObjectId`
 * @param text {string} The text to be sanitized
 * @returns {string} The sanitized text
 */
export const sanitizeTestText = (text) => {
  const values = text.split(' ');
  return values.map((value) => {
    // Remove any non-alphanumeric character from value
    const cleanValue = value.replace(/[^a-z0-9]/gi, '');

    // Check if it's a valid `ObjectId`, if so, replace it with a static value
    if (ObjectId.isValid(cleanValue)) {
      return value.replace(cleanValue, 'ObjectId');
    }

    return value;
  }).join(' ');
};

/**
 * Sanitize a test object removing the mentions of a `ObjectId`
 * @param payload {object} The object to be sanitized
 * @param keys {[string]} Array of keys to redefine the value on the payload
 * @param ignore {[string]} Array of keys to ignore
 * @returns {object} The sanitized object
 */
export const sanitizeTestObject = (payload, keys = ['id'], ignore = []) => {
  return Object.keys(payload).reduce((sanitized, field) => {
    if (ignore.indexOf(field) !== -1) {
      return sanitized;
    }

    const value = payload[field];

    // If value is empty, return `EMPTY` value so it's easier to debug
    if (!value) {
      return {
        ...sanitized,
        [field]: 'EMPTY',
      };
    }

    // Check if it's not an array and can be transformed into a string
    if (!Array.isArray(value) && typeof value.toString === 'function') {
      // Remove any non-alphanumeric character from value
      const cleanValue = (value).toString().replace(/[^a-z0-9]/gi, '');

      // Check if it's a valid `ObjectId`, if so, replace it with a static value
      if (ObjectId.isValid(cleanValue) && value.toString().indexOf(cleanValue) !== -1) {
        return {
          ...sanitized,
          [field]: value.toString().replace(cleanValue, 'ObjectId'),
        };
      }
    }

    // If this current key is specified on the `keys` array, we simply redefine it
    // so it stays the same on the snapshot
    if (keys.indexOf(field) !== -1) {
      return {
        ...sanitized,
        [field]: `FROZEN-${field.toUpperCase()}`,
      };
    }

    // If it's an object, we call this function again to handle nested fields
    if (typeof payload[field] === 'object') {
      return {
        ...sanitized,
        [field]: sanitizeTestObject(value, keys),
      };
    }

    return {
      ...sanitized,
      [field]: value,
    };
  }, {});
};

