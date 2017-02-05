// @flow

import DataLoader from 'dataloader';
import {
  query,
} from '../../../blockchain/helpers';

const getAirline = async (id, webUser, chaincodeID) => {
  const queryRequest = {
    chaincodeID,
    fcn: 'AirlineGet',
    args: [id.toString()],
  };

  try {
    const results = await query(webUser, queryRequest);

    console.log('results: ', results);

    return results;
  } catch (err) {
    console.log('err: ', err);
    return err.toString();
  }
};

export default class Airline {
  constructor(webUser, chaincodeID) {
    this.webUser = webUser;
    this.chaincodeID = chaincodeID;
    this.loader = new DataLoader(
      ids => Promise.all(
        ids.map(id => getAirline(id, webUser, chaincodeID)),
      ),
    );
  }

  convert = (data) => {
    return {
      id: data.Id,
      _id: data.Id,
      name: data.Name,
      icao: data.Icao,
    };
  };

  load = async (id) => {
    const data = await this.loader.load(id);

    console.log('load: ', data);

    // convert to mongo data
    return this.convert(data);
  }

  loadAirlines = async () => {
    const queryRequest = {
      // Name (hash) required for query
      chaincodeID: this.chaincodeID,
      // Function to trigger
      fcn: 'AirlineGetAll',
      // Existing state variable to retrieve
      args: [],
    };

    try {
      const results = await query(this.webUser, queryRequest);

      console.log('all: ', results, results.length);

      // TODO - handle connections and pagination

      return results.map(this.convert);
    } catch (err) {
      console.log('err: ', err);
      return err.toString();
    }
  }
}
