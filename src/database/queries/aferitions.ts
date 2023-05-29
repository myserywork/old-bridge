const { connection } = require("../connection");
const { v4: uuidv4 } = require("uuid");
import { parseCustomID } from "../../utils";
import axios from "axios";
import { logger } from "../../log/log";

interface Aferition {
  device_id?: String;
  aferition_data?: String;
  aferition_type?: String;
  aferition_id?: String;
  id?: String;
  user_id?: String;
}

export const insertAferition = async (aferition: Aferition) => {
  const { device_id, aferition_type, aferition_data, aferition_id, user_id } =
    aferition;
  try {
    const insertAPIRequest = await axios.post(
      `http://eprevsaude.com.br/sys/v2api/create_aferition`,
      {
        device_id: device_id,
        type: aferition_type,
        data: aferition_data,
        user_id: user_id,
        aferition_id: aferition_id,
      }
    );

    console.log({ insertAferition: insertAPIRequest });

    return insertAPIRequest;
  } catch (error) {
    logger.logError(error);
    return false;
  }
};

export const verifyAferition = async (aferition: Aferition) => {
  const { aferition_id } = aferition;
  const { results } = await connection.query({
    sql: `
         SELECT * FROM aferitions WHERE aferition_id = :aferition_id;
     `,
    params: {
      aferition_id: aferition_id,
    },
  });

  if (results.length > 0) return true;
  return false;
};

export const getPendingNotifications = async (aferition: Aferition) => {
  const { device_id, aferition_type } = aferition;
  const { results } = await connection.query({
    sql: `
         SELECT * FROM aferitions WHERE device_id = :device_id AND type = :aferition_type AND alerted = 0;
     `,
    params: {
      device_id: device_id,
      aferition_type: aferition_type,
    },
  });

  if (results.length < 0) return false;
  return results;
};

export const markAlerted = async (aferition: Aferition) => {
  const { id } = aferition;
  const { results } = await connection.query({
    sql: `
         UPDATE aferitions SET alerted = 1 WHERE id = :id;
     `,
    params: {
      id: id,
    },
  });

  if (results.affectedRows < 0) return false;
  return true;
};

export const markAlertedAferitionId = async (aferition: Aferition) => {
  const { aferition_id } = aferition;
  const { results } = await connection.query({
    sql: `
         UPDATE aferitions SET alerted = 1 WHERE aferition_id = :aferition_id;
     `,
    params: {
      aferition_id: aferition_id,
    },
  });

  if (results.affectedRows < 0) return false;
  return true;
};
