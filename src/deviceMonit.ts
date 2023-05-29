import { bridge } from "./bridge/bridge";
import { logger } from "./log/log";
import { minutesToMileSecounds } from "./utils";

interface InitData {
  deviceId: string;
  deviceDecimalId: string;
  cpf: string;
  interval: number;
  usuario_id: number;
}

export class Device {
  initData: InitData;

  constructor(initData: InitData) {
    this.initData = initData;
    logger.logSuccess(`Device ${initData.deviceId} initialized`);
    // console.log({ INITBOLADO: this.initData });
    this.startMonitoring();
  }

  async getInitData(): Promise<InitData> {
    return this.initData;
  }

  private async checkAlerts(): Promise<void> {
    try {
      const { initData } = this;
      const startTime = Date.now();
      await bridge.alerts.checkAlerts(initData);
      logger.logText(
        `checkAlerts executed successfully in ${Date.now() - startTime}ms`
      );
    } catch (error) {
      logger.logError("Erro ao executar checkAlerts");
      logger.logError(error);
    }
  }

  private async checkLocation(): Promise<void> {
    const { initData } = this;
    const startTime = Date.now();
    await bridge.location.checkLocation(initData);
    logger.logText(
      `checkLocation executed successfully in ${Date.now() - startTime}ms`
    );
  }

  private async checkTemperature(): Promise<void> {
    const { initData } = this;
    const startTime = Date.now();
    await bridge.health.checkTemperature(initData);
    logger.logText(
      `checkTemperature executed successfully in ${Date.now() - startTime}ms`
    );
  }

  private async requestPAHR(): Promise<void> {
    const { initData } = this;
    const startTime = Date.now();
    await bridge.health.requestPAHR(initData);
    logger.logText(
      `requestPAHR executed successfully in ${Date.now() - startTime}ms`
    );
  }

  private startMonitoring(): void {
    if (!this.initData) {
      return;
    }

    const interval = minutesToMileSecounds(1);
    const actions = [
      this.requestPAHR.bind(this),
      this.checkAlerts.bind(this),
      this.checkLocation.bind(this),
      this.checkTemperature.bind(this),
    ];
    let index = 0;

    const executeAction = async (): Promise<void> => {
      try {
        const action = actions[index];
        const startTime = Date.now();
        await action();
        logger.logText(
          `${action.name} executed successfully in ${Date.now() - startTime}ms`
        );
      } catch (error) {
        const action = actions[index];
        logger.logError(`${action.name} Erro ao executar ação`);
        logger.logError("Erro ao executar ação");
        console.log(this);
        console.log({ error: error });
        logger.logError(error);
      }

      index = (index + 1) % actions.length;
      setTimeout(executeAction, interval);
    };

    setTimeout(executeAction, interval);
  }
}
