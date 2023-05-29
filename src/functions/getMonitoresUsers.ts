import { pegarUsuariosComPulseiraGSM } from "../database/queries/usuario";

export const getMonitoredUsers = async () => {
  const usuariosComPulseira = await pegarUsuariosComPulseiraGSM();
  return usuariosComPulseira.filter(usuario => usuario.tipo_dispositivo === 'GSM' && usuario.device_id && usuario.id && usuario.device_decimal_id)
    .map(usuario => ({
      dispositivo: "gsm",
      usuario_id: usuario.id,
      deviceId: usuario.device_id,
      cpf: usuario.cpf,
      deviceDecimalId: usuario.device_decimal_id,
      name: `${usuario.first_name} ${usuario.last_name}`
    }));
};