import envManager from "./misc/envManager";
import httpRouter from "./http/http";
import { wellcome } from "./wellcome";
import { userWrapper } from "./functions/userWrapper";
import { logger } from "./log/log";
import { sleep } from "./utils";
import { Device } from "./deviceMonit";

wellcome();

const port = envManager.getEnv("http_client_port", "8080");

// Roteamento de HTTP
const statsRoute = (req, res) => {
  // console.log("STATS REQUESTED");
  res.send({ stats });
};

const usersRoute = (req, res) => {
  // console.log("USERS REQUESTED");
  res.send({ monitoredUsers });
};

const clientsRoute = (req, res) => {
  // console.log("CLIENTS REQUESTED");
  res.send({ clients });
};

const refreshRoute = async (req, res) => {
  monitoredUsers.users = await userWrapper.getMonitoredUsers();
  res.send({ monitoredUsers });
};

httpRouter.get("/stats", statsRoute);
httpRouter.get("/users", usersRoute);
httpRouter.get("/clients", clientsRoute);
httpRouter.get("/refresh", refreshRoute);

httpRouter.listen(port, () => {
  console.log(`Rodando na porta: ${port}`);
});

// Dados estatísticos
const stats = {
  users: 0,
  locations: 0,
  commandRequests: 0,
  alerts: 0,
  eletro: 0,
  temperature: 0,
};

// Usuários monitorados
const monitoredUsers = {
  users: [],
};

// Clientes
const clients = [];

// Inicia o monitoramento de usuários
(async () => {
  logger.logInfo("Iniciando monitoramento de usuários");

  const users = await userWrapper.getMonitoredUsers();

  let waitTime = 5000;

  for (const user of users) {
    waitTime += 10000;

    await sleep(waitTime);

    try {
      const device = new Device({
        deviceId: user.deviceId,
        deviceDecimalId: user.deviceDecimalId,
        cpf: user.cpf,
        interval: 1,
        usuario_id: user.usuario_id,
      });

      clients.push({
        device,
        user,
      });

      logger.logInfo(
        `Iniciando monitoramento do usuário: ${user.usuario_id} - ${user.cpf} - ${user.name} - ${user.deviceId} - ${user.deviceDecimalId}`
      );
    } catch (error) {
      logger.logError(error);
    }
  }
})();
