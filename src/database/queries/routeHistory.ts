const { connection } = require("../connection");
const { v4: uuidv4 } = require("uuid");
import { parseCustomID } from "../../utils";
import axios from "axios";
import { logger } from "../../log/log";

interface RouteHistory {
  device_id?: String;
  latitude?: String;
  longitude?: String;
  location_id?: String;
  id?: Number;
  user_id?: String;
}

export const insertRouteHistory = async (routeHistory: RouteHistory) => {
  const { device_id, latitude, longitude, location_id, user_id } = routeHistory;

  try {
    const insertAPIRequest = await axios.post(
      `http://eprevsaude.com.br/sys/v2api/create_location`,
      {
        device_id: device_id,
        latitude: latitude,
        longitude: longitude,
        location_id: location_id,
        user_id: user_id,
      }
    );

    console.log({ intertRouteHistory: insertAPIRequest });

    return insertAPIRequest;
  } catch (error) {
    logger.logError(error);
    return false;
  }
};

export const verifyRouteHistory = async (routeHistory: RouteHistory) => {
  const { location_id } = routeHistory;
  const { results } = await connection.query({
    sql: ` SELECT * FROM locations WHERE location_id = :location_id; `,
    params: {
      location_id: location_id,
    },
  });

  if (results.length > 0) return true;
  return false;
};
