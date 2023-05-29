import { minutesToMileSecounds } from "../utils";
import { GSM } from "./gsm_mobile";

const usersDevices = new Map();

const getUserDeviceData = (cpf) => {
  return usersDevices.get(cpf);
};

const isUserSignedIn = (cpf) => {
  return usersDevices.has(cpf);
};

const initGSM = async (user) => {
  const { cpf, deviceId, deviceDecimalId } = user;

  if (isUserSignedIn(cpf)) {
    const deviceData = getUserDeviceData(cpf);
    const timeSinceLastLogin = Date.now() - deviceData.lastLogin.getTime();
    if (timeSinceLastLogin >= minutesToMileSecounds(60)) {
      usersDevices.delete(cpf);
      return initGSM(user);
    } else {
      return deviceData.gsmMobile;
    }
  }

  const initData = {
    deviceId,
    deviceDecimalId,
    cpf,
    deviceToken: "",
    debug: true,
  };

  console.log({ initData });
  const gsmMobile = new GSM(initData);
  await gsmMobile.login(deviceId);

  usersDevices.set(cpf, {
    gsmMobile,
    lastLogin: new Date(),
  });

  return gsmMobile;
};

export const gsmMobileWrapper = {
  initGSM,
  usersDevices,
};
