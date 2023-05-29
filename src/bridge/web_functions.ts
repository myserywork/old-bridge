var md5 = require("md5");
import fetch from "node-fetch";
import { parseAlertType, parse, fixJSON } from "../utils";

export const pegar_temperatura_web = async (deviceId, token) => {
  try {
    const response = await fetch(
      `https://www.gps123.org/Jiankang3Charts.aspx?selDeviceID=${deviceId}&p=${token}&timeZone=-3:00`,
      {}
    );
    const body = await response.text();
    const temperatura = parse(
      body,
      '<input name="hidjkTempStr" type="hidden" id="hidjkTempStr" value="',
      '" />'
    ).split(",");
    const tempo_temperatura = parse(
      body,
      '<input name="hidjkTimeStr" type="hidden" id="hidjkTimeStr" value="',
      '" />'
    ).split(",");
    let output_final = [
      {
        temperatura: "",
        tempo_temperatura: "",
        id_unico: "",
      },
    ];

    if (temperatura[0].length > 6) return false; // se não tem oxigenacao, retorna false

    for (let i = 0; i < temperatura.length; i++) {
      let id_unico = md5(temperatura[i] + tempo_temperatura[i]);
      output_final.push({
        temperatura: temperatura[i],
        tempo_temperatura: tempo_temperatura[i],
        id_unico: id_unico,
      });
    }

    return output_final.slice(1);
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const pegar_oxigenacao_web = async (deviceId, token) => {
  try {
    let url = `https://www.gps123.org/Jiankang2Charts.aspx?selDeviceID=${deviceId}&p=${token}&timeZone=-3:00`;

    const response = await fetch(
      `https://www.gps123.org/Jiankang2Charts.aspx?selDeviceID=${deviceId}&p=${token}&timeZone=-3:00`,
      {}
    );
    const body = await response.text();
    const oxigenacao = parse(
      body,
      '<input name="hidjkXuetangStr" type="hidden" id="hidjkXuetangStr" value="',
      '" />'
    ).split(",");
    const tempo_oxigencao = parse(
      body,
      '<input name="hidjkTimeStr" type="hidden" id="hidjkTimeStr" value="',
      '" />'
    ).split(",");
    let output_final = [{}];

    if (oxigenacao[0].length > 4) return false; // se não tem oxigenacao, retorna false

    for (let i = 0; i < oxigenacao.length; i++) {
      let id_unico = md5(oxigenacao[i] + tempo_oxigencao[i]);
      output_final.push({
        oxigenacao: oxigenacao[i],
        tempo_oxigenacao: tempo_oxigencao[i],
        id_unico: id_unico,
      });
    }

    return output_final.slice(1);
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const pegar_eletro_web = async (deviceId, token) => {
  try {
    const response = await fetch(
      `https://www.gps123.org/JiankangCharts.aspx?selDeviceID=${deviceId}&p=${token}&timeZone=-3:00`,
      {}
    );
    const body = await response.text();
    const sistolica = parse(
      body,
      '<input name="hidjkGaoyaStr" type="hidden" id="hidjkGaoyaStr" value="',
      '" />'
    ).split(",");
    const diastolica = parse(
      body,
      '<input name="hidjkDiyaStr" type="hidden" id="hidjkDiyaStr" value="',
      '" />'
    ).split(",");
    const bpm = parse(
      body,
      '<input name="hidjkMaiboStr" type="hidden" id="hidjkMaiboStr" value="',
      '" />'
    ).split(",");
    const tempo_eletro = parse(
      body,
      '<input name="hidjkTimeStr" type="hidden" id="hidjkTimeStr" value="',
      '" />'
    ).split(",");

    if (
      bpm[0].length > 4 ||
      sistolica[0].length > 4 ||
      diastolica[0].length > 4 ||
      tempo_eletro[0].length > 40
    )
      return false; // se tiver mais de 40 registros, não é eletrocardiograma

    let output_final = [
      {
        sistolica: "",
        diastolica: "",
        bpm: "",
        tempo_eletro: "",
        id_unico: "",
      },
    ];
    for (let i = 0; i < sistolica.length; i++) {
      let id_unico = md5(
        sistolica[i] + diastolica[i] + " " + bpm[i] + " " + tempo_eletro[i]
      );
      output_final.push({
        sistolica: sistolica[i],
        diastolica: diastolica[i],
        bpm: bpm[i],
        tempo_eletro: tempo_eletro[i],
        id_unico: id_unico,
      });
    }

    return output_final.slice(1);
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const pegar_lista_de_comandos_executados = async (
  sn,
  PageNo = 1,
  pageCount = 10,
  timeZone = "-3:00"
) => {
  try {
  } catch (e) {
    console.log(e);
    return false;
  }
  const postBody = {
    SN: sn,
    DeviceID: 0,
    PageNo: PageNo,
    PageCount: pageCount,
    TimeZones: timeZone,
  };
  const response = await fetch(
    `https://gps123.org/Ajax/CommandQueueAjax.asmx/GetCommandList`,
    {
      method: "post",
      body: JSON.stringify(postBody),
      headers: { "Content-Type": "application/json" },
    }
  );

  try {
    const body = await response.json();
    if (body.d) {
      let json = fixJSON(body.d);
      return JSON.parse(json);
    } else {
      console.log("Erro ao pegar lista de comandos executados");
      return false;
    }
  } catch (e) {
    console.log("Erro ao pegar lista de comandos executados Catch");
    return false;
  }
};

export const verifica_comando_executado = async (sn, id) => {
  try {
    let comandos = await pegar_lista_de_comandos_executados(sn);
    if (!comandos) return false;
    for (let i = 0; i < comandos.commandArr.length; i++) {
      if (comandos.commandArr[i].id == id) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const pegar_geofence = async (deviceId, timeZone = "-3") => {
  try {
    const postBody = { DeviceID: deviceId, MapType: "1", TimeZone: timeZone };
    const response = await fetch(
      `https://www.gps123.org/Ajax/GeofenceAjax.asmx/GetGeofence`,
      {
        method: "post",
        body: JSON.stringify(postBody),
        headers: { "Content-Type": "application/json" },
      }
    );

    const body = await response.json();
    if (body.d) {
      let json = JSON.parse(fixJSON(body.d));
      return json;
    } else {
      console.log("Erro ao pegar lista GeoFence");
      return false;
    }
  } catch (e) {
    console.log("Erro ao pegar lista  GeoFence Catch");
    return false;
  }
};

export const salvar_geofence = async (
  deviceId,
  radius,
  latitude,
  longitude,
  nome,
  remark,
  geofenceId = 0
) => {
  try {
    const postBody = {
      UserID: 0,
      DeviceID: deviceId,
      GeofenceName: nome,
      Remark: remark,
      MapType: 1,
      TypeID: 0,
      GeofenceID: geofenceId,
      Radius: radius,
      Lng: longitude,
      Lat: latitude,
    };

    const response = await fetch(
      `https://gps123.org/Ajax/GeofenceAjax.asmx/SaveGeofence`,
      {
        method: "post",
        body: JSON.stringify(postBody),
        headers: { "Content-Type": "application/json" },
      }
    );

    const body = await response.json();
    if (body.d) {
      let json = JSON.parse(body.d);
      return json > 0;
    } else {
      console.log("Erro ao Salvar lista GeoFence");
      return false;
    }
  } catch (e) {
    console.log(e);
    console.log("Erro ao Salvar lista  GeoFence Catch");
    return false;
  }
};

export const deletar_geofence = async (deviceId, geofenceId) => {
  try {
    const postBody = { DeviceID: deviceId, GeofenceID: geofenceId };
    const response = await fetch(
      `https://www.gps123.org/Ajax/GeofenceAjax.asmx/DelGeofence`,
      {
        method: "post",
        body: JSON.stringify(postBody),
        headers: { "Content-Type": "application/json" },
      }
    );

    const body = await response.json();
    if (body.d) {
      return body.d > 0;
    } else {
      console.log("Erro ao deletar lista GeoFence");
      return false;
    }
  } catch (e) {
    console.log(e);
    console.log("Erro ao deletar lista  GeoFence Catch");
    return false;
  }
};

export const deletar_todas_geofence = async (deviceId) => {
  try {
    let geofence = await pegar_geofence(deviceId);
    for (let i = 0; i < geofence.geofences.length; i++) {
      let deletada_geofence = await deletar_geofence(
        deviceId,
        geofence.geofences[i].geofenceID
      );
      console.log({ GeoFenceDeletada: deletada_geofence });
    }
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const pegar_ultima_localizacao = async (
  deviceId,
  timeZone = "-3:00"
) => {
  const postBody = { DeviceID: deviceId, TimeZone: timeZone };
  try {
    const response = await fetch(
      `https://www.gps123.org/Ajax/DevicesAjax.asmx/GetTracking`,
      {
        method: "post",
        body: JSON.stringify(postBody),
        headers: { "Content-Type": "application/json" },
      }
    );

    const body = await response.json();
    try {
      if (body.d) {
        let json = JSON.parse(fixJSON(body.d));

        return {
          latitude: json.oLat,
          longitude: json.oLng,
          dataContext: json.dataContext,
          speed: json.speed,
          status: json.status,
          id_unico: await md5(
            json.latitude + json.serverUtcDate + json.longitude
          ),
        };
      } else {
        console.log("Erro ao pegar ultima localização");
        return false;
      }
    } catch (e) {
      console.log(e);
      console.log("Erro ao deletar lista  GeoFence Catch");
      return false;
    }
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const pegarAlertas = async (deviceId, timeZone = "-3") => {
  try {
    const postBody = { DeviceID: deviceId, TimeZones: timeZone };
    const response = await fetch(
      `https://www.gps123.org/Ajax/ExceptionMessageAjax.asmx/GetExceptionMessageByDeviceID`,
      {
        method: "post",
        body: JSON.stringify(postBody),
        headers: { "Content-Type": "application/json" },
      }
    );

    const body = await response.json();
    try {
      if (body.d) {
        let alertas = JSON.parse(fixJSON(body.d));
        let output_final = [
          { tipo_alerta: "0", tempo_alerta: "0", id_unico: "0" },
        ];
        for (let i = 0; i < alertas.ems.length; i++) {
          let id_unico = md5(
            alertas.ems[i].id + alertas.ems[i].name + alertas.ems[i].deviceDate
          );
          output_final.push({
            tipo_alerta: parseAlertType(alertas.ems[i].notificationType),
            tempo_alerta: alertas.ems[i].deviceDate,
            id_unico: id_unico,
          });
        }

        return output_final.slice(1);
      } else {
        console.log("Erro ao Listar Alertas");
        return [];
      }
    } catch (e) {
      console.log(e);
      console.log("Erro ao Listar Alertas Catch");
      return [];
    }
  } catch (e) {
    console.log(e);
    return false;
  }
};
