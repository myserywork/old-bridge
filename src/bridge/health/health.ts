import { insertAferition } from "../../database/queries/aferitions";
import { IDEncryption } from "../../functions/functions";
import { logger } from "../../log/log";
import { broadcastEletroCardiogramToMis, broadcastTemperatureToMis } from "../../mis/misBroadcaster";
import { getEndDate, getStartDate, insertAlerted, isAlerted, minutesToMileSecounds } from "../../utils";
import { gsmMobileWrapper } from "../bridgeUtils";
import { pegar_eletro_web, pegar_oxigenacao_web, pegar_temperatura_web } from "../web_functions";
let md5 = require("md5");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const requestBodyTemp = async (user) => {
    try {
        let gsmMobile = await gsmMobileWrapper.initGSM(user);
        await gsmMobile.requestBodyTemp();
        logger.logInfo("Requisição de temperatura enviada");
    } catch (err) {
        console.error(err);
    }
}

const requestDeviceLocation = async (user) => {
    try {
        let gsmMobile = await gsmMobileWrapper.initGSM(user);
        await gsmMobile.requestDeviceLocation();
        logger.logInfo("Requisição de localização enviada");
    } catch (err) {
        console.error(err);
    }
}

const requestPAHR = async (user) => {
    try {
        let gsmMobile = await gsmMobileWrapper.initGSM(user);
        await gsmMobile.requestPAHR();
        logger.logInfo("Requisição de PAHR enviada");
    } catch (err) {
        console.error(err);
    }
}

const fullUserRequest = async (user) => {
  try {
      let waitTime = 0;
      await sleep(minutesToMileSecounds(waitTime));
      let gsmMobile = await gsmMobileWrapper.initGSM(user);
      await gsmMobile.requestBodyTemp();
      await sleep(minutesToMileSecounds(1.2));
      await gsmMobile.requestDeviceLocation();
      await sleep(minutesToMileSecounds(1.2));
      await gsmMobile.requestPAHR();
      logger.logInfo("Requisições enviadas");
  } catch (err) {
      console.error(err);
  }
}

const fullyRequest = async (users) => {
    try {
        let waitTime = 0;
        for(const user of users) {
            waitTime = waitTime + 0.2;
            await sleep(minutesToMileSecounds(waitTime));
            let gsmMobile = await gsmMobileWrapper.initGSM(user);
            await gsmMobile.requestBodyTemp();
            await sleep(minutesToMileSecounds(1.5));
            await gsmMobile.requestDeviceLocation();
            await sleep(minutesToMileSecounds(1.5));
            await gsmMobile.requestPAHR();
            logger.logInfo("Requisições enviadas");
        }
    } catch (err) {
        console.error(err);
    }
}


const checkEletros = async (user) => {
    let token = IDEncryption(user.deviceDecimalId);
    let eletros = await pegar_eletro_web(user.deviceDecimalId, token);
    let oxigenacoes = await pegar_oxigenacao_web(user.deviceDecimalId, token);
    if (!eletros) return;
    for (let i = 0; i < eletros.length; i++) {
      let isAlert = await isAlerted(eletros[i].id_unico);
  
      if (isAlert) {
        logger.logInfo("Aferição já foi enviada");
        continue;
      }
  
      let broadCastEletroCardiogramResponse = await broadcastEletroCardiogramToMis({
        user_cpf: user.cpf,
        bpm: eletros[i].bpm,
        dbp: eletros[i].diastolica,
        sbp: eletros[i].sistolica,
        blood_oxygen: !oxigenacoes[i].oxigenacao ? 99 : oxigenacoes[i].oxigenacao,
      });
  
      if (broadCastEletroCardiogramResponse) {
        let write = await insertAlerted(eletros[i].id_unico);
        let hearthrate = await insertAferition({
          device_id: user.id_dispositivo,
          aferition_data: eletros[i].bpm,
          aferition_type: "hearthrate",
          aferition_id: md5(eletros[i].id_unico + "hearthrate"),
          user_id : user.usuario_id
        });
        let pressure = await insertAferition({
          device_id: user.id_dispositivo,
          aferition_data: eletros[i].sistolica + "/" + eletros[i].diastolica,
          aferition_type: "pressure",
          aferition_id: md5(eletros[i].id_unico + "pressure"),
          user_id : user.usuario_id
        });
        let oxigenacao = await insertAferition({
          device_id: user.id_dispositivo,
          aferition_data: !oxigenacoes[i].oxigenacao
            ? 99
            : oxigenacoes[i].oxigenacao,
          aferition_type: "oxygen",
          aferition_id: md5(eletros[i].id_unico + "oxygen"),
          user_id : user.usuario_id
        });
  
        logger.logSuccess("JOB - Aferição de Eletrocardiograma");
      }
    }
  
  };
  
  const startEletroMonitoringJob = async (monitoredUsers) => {
    try {
      let waitTime = 0;  
      for (const element of monitoredUsers) {
        waitTime = waitTime + 0.2;  
        let user = element;
        if (element != undefined) {
          setTimeout(() => {
            logger.logSuccess("Iniciando job de Eletro");
            checkEletros(user);
          }, waitTime);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const checkTemperature = async (user) => {
    let token = IDEncryption(user.deviceDecimalId);
    let initData = {
      deviceId: user.id_dispositivo,
      cpf: user.cpf,
      deviceToken: "",
      deviceDecimalId: user.deviceDecimalId,
      debug: true,
    };
  
    let gsmMobile = await gsmMobileWrapper.initGSM(user);
    await gsmMobile.login(user.id_dispositivo);
  
    let startDate = getStartDate();
    let endDate = getEndDate();
    let temperaturas = await gsmMobile.getTemperature(startDate, endDate);
    let temperaturasWeb = await pegar_temperatura_web(user.deviceDecimalId, token);
    console.log({ temperaturas: temperaturas, temperaturasWeb: temperaturasWeb });
   
    await gsmMobile.requestBodyTemp();
  
    if (!temperaturas) return;
    for (let i = 0; temperaturas.length > i; i++) {
      let temperatura = temperaturas[i];
  
      let isAlert = await isAlerted(temperatura.id_unico);
  
      if (isAlert) {
        logger.logInfo("Aferição já foi enviada");
        continue;
      }
  
      let broadCastTemperatureResponse = await broadcastTemperatureToMis({
        user_cpf: user.cpf,
        real_temperature: temperatura.temperatura,
      });
  
      console.log({ broadCastTemperatureResponse: broadCastTemperatureResponse });
      if (broadCastTemperatureResponse) {
        await insertAlerted(temperatura.id_unico);
        await insertAferition({
          device_id: user.id_dispositivo,
          aferition_data: temperatura.temperatura,
          aferition_type: "temperature",
          aferition_id: md5(temperatura.id_unico + "temperature"),
          user_id : user.usuario_id
        });
      } else {
         await insertAlerted(temperatura.id_unico);
         await insertAferition({
            device_id: user.id_dispositivo,
            aferition_data: temperatura.temperatura,
            aferition_type: "temperature",
            aferition_id: md5(temperatura.id_unico + "temperature"),
            user_id : user.usuario_id
          });
      }
    }
    
  };
  
  const startTemperatureJob = async (monitoredUsers) => {
    try {
      let waitTime = 0;  
      for (const element of monitoredUsers) {
        let user = element;
        if (element != undefined) {
            waitTime = waitTime + 0.2;
          setTimeout(async () => {
            logger.logSuccess("Iniciando job de Temperatura");
            checkTemperature(user);
          }, waitTime);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };


export const health = {
    checkEletros: checkEletros,
    fullUserRequest: fullUserRequest,
    checkTemperature: checkTemperature,
    requestBodyTemp: requestBodyTemp,
    requestDeviceLocation: requestDeviceLocation,
    requestPAHR: requestPAHR,
    fullyRequest: fullyRequest,
    startEletroMonitoringJob: startEletroMonitoringJob,
    startTemperatureJob: startTemperatureJob     
}


