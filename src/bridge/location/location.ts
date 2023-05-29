import { insertRouteHistory } from "../../database/queries/routeHistory";
import { updateDeviceStatus } from "../../database/queries/usuario";
import { IDEncryption } from "../../functions/functions";
import { logger } from "../../log/log";
import { insertAlerted, isAlerted, minutesToMileSecounds } from "../../utils";
import { pegar_ultima_localizacao } from "../web_functions";

const startLocationJob = async (monitoredUsers) => {
    try {
      let waitTime = 0;
      for (const element of monitoredUsers) {
        waitTime = waitTime + 1;
        let user = element;
        if (element != undefined) {
          setTimeout(() => {
            logger.logSuccess("Iniciando job de localização");
            checkLocation(user);
          }, 3000);
        }
      }
    } catch (err) {
      console.error(err);
    }
};

const checkLocation = async (user) => {
    let token = IDEncryption(user.deviceDecimalId);
    let location = await pegar_ultima_localizacao(user.deviceDecimalId, token);


    console.log({
      location : location,
      user : user
    })


    if (!location) return;
    let isAlert = await isAlerted(location.id_unico);
    let status = {
      updated: await updateDeviceStatus(
        user.cpf,
        location.status,
        location.dataContext.split("-").pop()
      ),
    };
  
    logger.logSuccess("Status atualizado: " + status.updated);

    if (isAlert) {
      logger.logInfo("Localização já foi enviada");
      return;
    }


    let write = await insertAlerted(location.id_unico);
    console.log({
      device_id: user.id_dispositivo,
      latitude: location.latitude,
      longitude: location.longitude,
      location_id: location.id_unico,
      user_id: user.usuario_id,
    });

    let locationDTO = await insertRouteHistory({
      device_id: user.id_dispositivo,
      latitude: location.latitude,
      longitude: location.longitude,
      location_id: location.id_unico,
      user_id: user.usuario_id
    });


  };


export const location = {
    startLocationJob: startLocationJob,
    checkLocation: checkLocation
}