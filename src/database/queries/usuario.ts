const { connection } = require("../connection");
const { v4: uuidv4 } = require("uuid");
import { parseCustomID } from "../../utils";

export const pegarCamposCustomizados = async (idUsuario) => {
  return true;
};

export const updateDeviceStatus = async (
  cpfUsuario: String,
  device_status: String,
  device_battery: String
) => {
  if(cpfUsuario == undefined) return false;


  let usuario = await pegarUsuarioCPF(cpfUsuario);

  if(!usuario.id) return false;

  const { results } = await connection.query({
    sql: `
         UPDATE users SET device_status = :device_status, device_battery = :device_battery WHERE id = :id 
     `,
    params: {
      id: usuario.id,
      device_status: device_status,
      device_battery: device_battery,
    },
  });

  console.log({ resuots: results });

  if (results.affectedRows < 0) return false;
  return true;

};

export const pegarUsuarioId = async (idUsuario: Number) => {
  const { results } = await connection.query({
    sql: `SELECT * FROM users WHERE id = ':id' ;`,
    params: {
      id: idUsuario,
    },
  });

  if (results) {
    return results[0];
  } else {
    return false;
  }
  
};

export const pegarUsuarioCPF = async (cpf: String) => {
  const { results } = await connection.query({
    sql: `SELECT * FROM users WHERE cpf = :cpf;`,
    params: {
      cpf: cpf,
    },
  });

  if (!results) return false;
  
  return results[0];
};



export const pegarUsuarioIDPulseira = async (idPulseira: String) => {
  const { results } = await connection.query({
    sql: `SELECT * FROM users WHERE device_id = :idPulseira;`,
    params: {
      idPulseira: idPulseira,
    },
  });

  if (!results) return false;
  return results[0];

};

export const pegarUsuariosComPulseiraGSM = async (): Promise<any> => {
  const { results } = await connection.query({
    sql: "SELECT * FROM `users` WHERE `device_id` > 1 AND `device_decimal_id` > 1",
  });

  if (!results) return [{}];
  return results;
};
