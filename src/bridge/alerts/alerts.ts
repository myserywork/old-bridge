import { logger } from "../../log/log";
import { broadCastAlertToMIS } from "../../mis/misBroadcaster";
import { getRandomInt, insertAlerted, isAlerted, minutesToMileSecounds } from "../../utils";
import { pegarAlertas } from "../web_functions";


const startcheckAlertsJob = async (monitoredUsers) => {
    try {
      let waitTime = 0;  
      for (const element of monitoredUsers) {
        waitTime = waitTime + 1;
        let user = element;
        if (element != undefined) {
            setTimeout(() => {
            logger.logInfo("Iniciando job de alertas");     
            checkAlerts(user);
          }, minutesToMileSecounds(waitTime));
        }
      }
    } catch (err) {
      console.error(err);
    }
};



const checkAlerts = async (user) => {
    
    try {
      let alertas = await pegarAlertas(user.deviceDecimalId);
      if (!alertas) return;
      for (const element of alertas) {
        let isAlert = await isAlerted(element.id_unico);
        if (isAlert) {
          logger.logInfo("Alerta já foi enviado");
          continue;
        }
    
        if(element.tipo_alerta == undefined) continue;
  
        let broadCastAlertToMISReponse = await broadCastAlertToMIS({
          user_cpf: user.cpf,
          exam_type: "" + element.tipo_alerta,
        });
    
        if (broadCastAlertToMISReponse) {
          await insertAlerted(element.id_unico);
        } else {
          logger.logError(
            "Erro ao enviar alerta para o MIS " +
              user.deviceDecimalId +
              " - " +
              element.tipo_alerta
          );
  
          await insertAlerted(element.id_unico);
        }
      }
    } catch (error) {
        logger.logError(error);
    }
  };

  export const alerts = {
        startcheckAlertsJob: startcheckAlertsJob,
        checkAlerts: checkAlerts
  }

