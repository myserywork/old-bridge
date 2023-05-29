import { logger } from "../log/log";
import { minutesToMileSecounds } from "../utils";

const axios = require("axios");


const misEndpoint = "https://mis.spezi.com.br/api/";
const apiVersion = "v1";
const user = "990.099.099-99";
const password = "123456";

let token = null;

const getMisAuthToken = async (): Promise<string | boolean> => {
  if (token) return token;

  logger.logInfo("Iniciando autenticação no MIS");

  try {
    const requestToken = await axios.post(
      `${misEndpoint}${apiVersion}/login?user[cpf]=${user}&user[password]=${password}`
    );

    if (!requestToken.data?.token) {
      logger.logError("Erro ao autenticar no MIS");
      return false;
    }

    token = requestToken.data.token;
    logger.logSuccess("Autenticação no MIS realizada com sucesso");
    return token;
  } catch (error) {
    logger.logError(`Erro ao autenticar no MIS: ${error}`);
    return false;
  }
};

const postToMIS = async (url, data, authToken) => {
  const config = { headers: { Authorization: `Bearer ${authToken}` } };

  try {
    const response = await axios.post(`${misEndpoint}${apiVersion}/${url}`, data, config);

    if (!response.data?.id) {
      throw new Error("Não foi possível enviar dados para o MIS");
    }

    return response.data.id;
  } catch (error) {
    throw error;
  }
};

interface MisAlert {
  user_cpf: string;
  exam_type: string;
}

export const broadCastAlertToMIS = async (misAlert: MisAlert) => {
  logger.logInfo("Iniciando envio de alerta para o MIS");

  try {
    const authToken = await getMisAuthToken();

    if (!authToken) {
      throw new Error("Não foi possível obter token de autenticação");
    }

    const data = { exam: { ...misAlert, data: 1 } };
    const id = await postToMIS("exams", data, authToken);

    return id > 1;
  } catch (error) {
    console.error("AFERITIONS NOT IMPLEMENTED YET");
    console.error(error);
    return false;
  }
};
interface MisEletroCardiogram {
  user_cpf: string;
  bpm: string;
  dbp: string;
  sbp: string;
  blood_oxygen: string;
}

interface MisTemperature {
  user_cpf: string;
  real_temperature: string;
}

const sendDataToMis = async <T>(endpoint: string, data: T) => {
  try {
    const authToken = await getMisAuthToken();
    if (!authToken) return false;

    const config = {
      headers: { Authorization: `Bearer ${authToken}` },
    };

    const response = await axios.post(
      `${misEndpoint}${apiVersion}/${endpoint}`,
      data,
      config
    );

    return response.data;
  } catch (error) {
    console.error("Error sending data to MIS");
    console.error(error);
    return false;
  }
};

export const broadcastAlertToMis = async (misAlert: MisAlert) => {
  return await sendDataToMis("exams", { exam: misAlert });
};

export const broadcastEletroCardiogramToMis = async (misEletroCardiogram: MisEletroCardiogram) => {
  return await sendDataToMis("electro_cardiograms", { electro_cardiogram: misEletroCardiogram });
};

export const broadcastTemperatureToMis = async (misTemperature: MisTemperature) => {
  return await sendDataToMis("temperatures", { temperature: misTemperature });
};


export const misQueryUserByCPF = async (cpf: string) => {
  logger.logInfo("Iniciando consulta de usuário no MIS");
  return sendDataToMis<{ cpf: string }>("users", { cpf });
};


(async () => {
  await getMisAuthToken();
  
  setInterval(async () => {
    await getMisAuthToken();
  }, minutesToMileSecounds(240));

})();
