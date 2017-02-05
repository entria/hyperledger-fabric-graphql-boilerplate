import mongoose from 'mongoose';

// Data - http://openflights.org/data.html#airline

const Schema = new mongoose.Schema({
  name: {
    type: String,
    description: 'Airline Name',
    required: true,
    unique: true,
  },
  alias: {
    type: String,
    description: 'Airline alias', // All Nippon Airways is commonly known as "ANA".
  },
  iata: {
    type: String,
    description: 'Airline code in the IATA scheme',
  },
  icao: {
    type: String,
    description: 'Airline code in the ICAO scheme',
  },
  callsign: {
    type: String,
    index: true,
    description: 'Airline callsign',
  },
  country: {
    type: String,
    description: 'Airline country',
  },
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'Airline',
});

export default mongoose.model('Airline', Schema);
