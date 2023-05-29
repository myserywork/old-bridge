import fetch from "node-fetch";
import { logger } from "../log/log";
var md5 = require("md5");

interface GSM_Interface {
  deviceId?: Number;
  cpf?: Number;
  deviceToken?: String;
  deviceDecimalId?: Number;
  debug?: Boolean;
}

export class GSM {
  deviceId?: Number;
  cpf?: Number;
  deviceToken?: String;
  deviceDecimalId?: Number;
  debug?: Boolean;

  constructor(GSM_OBJECT: GSM_Interface) {
    this.deviceId = GSM_OBJECT.deviceId;
    this.cpf = GSM_OBJECT.cpf;
    this.deviceToken = GSM_OBJECT.deviceToken;
    this.deviceDecimalId = GSM_OBJECT.deviceDecimalId;
    this.debug = GSM_OBJECT.debug;
  }

  sendXML = async (xml: string): Promise<any> => {
    try {
      let enclosure = `
              <v:Envelope 
                  xmlns:i="http://www.w3.org/2001/XMLSchema-instance" 
                  xmlns:d="http://www.w3.org/2001/XMLSchema" 
                  xmlns:c="http://schemas.xmlsoap.org/soap/encoding/"
                  xmlns:v="http://schemas.xmlsoap.org/soap/envelope/">
            <v:Header /> 
                  <v:Body>
                  ${xml}
                  </v:Body>
              </v:Envelope>
              `;

      if (this.debug) {
        console.log({ DEBUG_PAYLOAD: xml });
      }
      let response = await fetch(`http://www.gps123.org:8080/openapiv3.asmx`, {
        method: "post",
        body: enclosure,
        headers: {
          "Content-Type": "text/xml;charset=utf-8",
          SOAPActio: "http://tempuri.org/Login",
          "User-Agent": "ksoap2-android/2.6.0+",
          Accept: "application/xml",
        },
      });

      if (this.debug) {
        console.log({ DEBUG_RESPONSE: response });
      }
      return response.text();
    } catch (e) {
      console.log(e);
      this.sendXML(xml);
      return false;
    }
  };

  verifyLogin = async (): Promise<boolean> => {
    if (this.deviceId != null && this.deviceToken != null) {
      return true;
    }
    return false;
  };

  getResponse = async (id: string): Promise<any> => {
    try {
      let xml = `
      <GetResponse xmlns="http://tempuri.org/">
        <CommandID>${id}</CommandID>
        <TimeZones>-3:00</TimeZones>
        <Key>rENLL6LPlnd4N6efOEzA7f9/j7KrJRrMaScTpDXc7RC3M60tk4TLEuVMj0pjzlkwbZsYUOjXjkUTYlIjRdflyg==</Key>
      </GetResponse>
      `;

      let response = await this.sendXML(xml);
      if (!response.includes("Result")) return false;
      let result = parseInt(response.split("Result>")[1].split("</S")[0]);

      console.log({ RESPONSE: result });
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  login = async (sn: string): Promise<any> => {
    try {
      let xml = `
            <Login xmlns="http://tempuri.org/" id="o0" c:root="1">
                <Pass i:type="d:string">123456</Pass>
                <project i:type="d:string">RFHZ</project>
                <LoginType i:type="d:int">1</LoginType>
                <Key i:type="d:string">7DU2DJFDR8321</Key>
                <Name i:type="d:string">${sn}</Name>
                <GMT i:type="d:string">-3:00</GMT>
            </Login>
            `;
      let response = await this.sendXML(xml);
      if (!response.includes("<LoginResult>")) return false;
      // console.log({ RESPONSE: response });
      let result = response
        .split("<LoginResult>")[1]
        .split("</LoginResult>")[0];
      console.log({ JSON: result });
      let json = JSON.parse(result);
      console.log({ JSON: json });
      logger.logWarning("GSM LOGIN");
      console.log({
        GSM_LOGIN: json,
        sn: sn,
      });
      this.deviceId = json.deviceInfo.sn;
      this.deviceDecimalId = json.deviceInfo.deviceID;
      this.deviceToken = json.deviceInfo.key2018;
      return json;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  findDevice = async (): Promise<any> => {
    if (!this.verifyLogin) return false;
    let xml = `
          <SendCommandByAPP xmlns="http://tempuri.org/" id="o0" c:root="1">
            <CommandType i:type="d:string">FIND</CommandType>
            <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
            <Model i:type="d:int">0</Model>
            <Paramter i:type="d:string">0</Paramter>
            <SN i:type="d:string"></SN>
            <Key i:type="d:string">${this.deviceToken}</Key>
         </SendCommandByAPP>
          `;

    let response = await this.sendXML(xml);
    if (!response.includes("<SendCommandByAPPResult>")) return false;
    let result = parseInt(
      response
        .split("<SendCommandByAPPResult>")[1]
        .split("</SendCommandByAPPResult>")[0]
    );
    return result > 1 ? result : false;
  };

  getDeviceLocation = async (): Promise<any> => {
    if (!this.verifyLogin) return false;
    let xml = `
      <GetTracking xmlns="http://tempuri.org/" id="o0" c:root="1">
        <TimeZones i:type="d:string">-3:00</TimeZones>
        <Language i:type="d:string">pt_BR</Language>
        <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
        <Model i:type="d:int">0</Model>
        <MapType i:type="d:string">Google</MapType>
         <Key i:type="d:string">${this.deviceToken}</Key>
      </GetTracking>`;
    let response = await this.sendXML(xml);
    if (!response.includes("<GetTrackingResult>")) return false;
    let result = response
      .split("<GetTrackingResult>")[1]
      .split("</GetTrackingResult>")[0];
    let json = JSON.parse(this.fixJSON(result));
    return json;
  };

  getWarnList = async (): Promise<any> => {
    if (!this.verifyLogin) return false;
    let xml = `
        <GetWarnList
            xmlns="http://tempuri.org/" id="o0" c:root="1">
            <TypeID i:type="d:int">1</TypeID>
            <TimeZones i:type="d:string">-3:00</TimeZones>
            <PageCount i:type="d:int">30</PageCount>
            <Language i:type="d:string">pt</Language>
            <PageNo i:type="d:int">1</PageNo>
            <ID i:type="d:int">${this.deviceDecimalId}</ID>
            <Key i:type="d:string">${this.deviceToken}</Key>
      </GetWarnList>`;
    let response = await this.sendXML(xml);
    console.log({ warnList: response });
    if (!response.includes("<GetWarnListResult>")) return false;
    let result = response
      .split("<GetWarnListResult>")[1]
      .split("</GetWarnListResult>")[0];
    let json = JSON.parse(this.fixJSON(result));
    if (!json.arr) return false;
    let output_final = [{}];
    for (let i = 0; i < json.arr.length; i++) {
      let id_unico = md5(
        json.arr[i].warn +
          json.arr[i].name +
          json.arr[i].createDate +
          json.arr[i].deviceDate +
          this.deviceToken
      );
      output_final.push({
        id_unico: id_unico,
        alerta: json.arr[i].warn,
        horario_servidor: json.arr[i].createDate,
        horario_dispositivo: json.arr[i].deviceDate,
        nome: json.arr[i].name,
        modelo: json.arr[i].model,
      });
    }

    return output_final.slice(1);
  };

  isOnline = async (): Promise<any> => {
    if (!this.verifyLogin) return false;
    let response = await this.getDeviceLocation();
    return response.status.includes("2-Batter");
  };

  requestDeviceLocation = async (): Promise<any> => {
    if (!this.verifyLogin) return false;
    let xml = `
        <SendCommandByAPP xmlns="http://tempuri.org/" id="o0" c:root="1">
            <CommandType i:type="d:string">CR</CommandType>
            <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
            <Model i:type="d:string">220</Model>
            <Paramter i:type="d:string"></Paramter>
            <SN i:type="d:string"></SN>
            <Key i:type="d:string">${this.deviceToken}</Key>
        </SendCommandByAPP>`;
    let response = await this.sendXML(xml);

    if (!response.includes("<SendCommandByAPPResult>")) return false;
    let result = parseInt(
      response
        .split("<SendCommandByAPPResult>")[1]
        .split("</SendCommandByAPPResult>")[0]
    );
    return result > 1 ? result : false;
  };

  getDeviceHistoricalRoute = async (
    startTime: string,
    endTime: string
  ): Promise<any> => {
    if (!this.verifyLogin) return false;
    let xml = `
        <GetDevicesHistory xmlns="http://tempuri.org/" id="o0" c:root="1">
            <ShowLBS i:type="d:string">1</ShowLBS>
            <TimeZones i:type="d:string">-3:00</TimeZones>
            <EndTime i:type="d:string">${startTime}</EndTime>
            <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
            <SelectCount i:type="d:int">10000</SelectCount>
            <StartTime i:type="d:string">${endTime}</StartTime>
            <MapType i:type="d:string">Google</MapType>
            <Key i:type="d:string">${this.deviceToken}</Key>
        </GetDevicesHistory>
        `;

    let response = await this.sendXML(xml);
    if (!response.includes("<GetDevicesHistoryResult>")) return false;

    let result = parseInt(
      response
        .split("<GetDevicesHistoryResult>")[1]
        .split("</GetDevicesHistoryResult>")[0]
    );
    return result > 1 ? result : false;
  };

  getPAHR = async (startTime: string, endTime: string): Promise<any> => {
    if (!this.verifyLogin) {
      return Promise.reject(new Error("Not logged in"));
    }

    const xml = `
      <GetJiankang xmlns="http://tempuri.org/" id="o0" c:root="1">
        <TimeZones i:type="d:string">-3:00</TimeZones>
        <EndTime i:type="d:string">${endTime}</EndTime>
        <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
        <StartTime i:type="d:string">${startTime}</StartTime>
        <Key i:type="d:string">${this.deviceToken}</Key>
      </GetJiankang>
    `;

    const response = await this.sendXML(xml);

    if (!response.includes("<GetJiankangResult>")) {
      return Promise.reject(new Error("No results"));
    }

    const result = response
      .split("<GetJiankangResult>")[1]
      .split("</GetJiankangResult>")[0];
    const json = JSON.parse(this.fixJSON(result));

    if (!json.arr) {
      return Promise.reject(new Error("No data"));
    }

    const output = json.arr.map((entry) => {
      const id_unico = md5(
        entry.time + entry.gaoya + entry.diya + entry.maibo + this.deviceToken
      );

      return {
        id_unico,
        tempo_eletro: entry.time,
        sistolica: entry.gaoya,
        diastolica: entry.diya,
        bpm: entry.maibo,
      };
    });

    return output;
  };

  getTemperature = async (startTime: string, endTime: string): Promise<any> => {
    if (!this.verifyLogin) return false;

    const xml = `
      <GetTemperature xmlns="http://tempuri.org/" id="o0" c:root="1">
        <TimeZones i:type="d:string">-3:00</TimeZones>
        <EndTime i:type="d:string">${endTime}</EndTime>
        <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
        <StartTime i:type="d:string">${startTime}</StartTime>
        <Key i:type="d:string">${this.deviceToken}</Key>
      </GetTemperature>
    `;

    const response = await this.sendXML(xml);
    const result = response.match(
      /<GetTemperatureResult>(.*)<\/GetTemperatureResult>/
    );
    if (!result) return false;

    let json;
    try {
      json = JSON.parse(this.fixJSON(result[1]));
    } catch (err) {
      return false;
    }

    if (!json.arr) return false;

    return json.arr.map((item) => {
      const id_unico = md5(item.time + item.temp + this.deviceToken);
      return {
        id_unico,
        tempo_temperatura: item.time,
        temperatura: item.temp,
      };
    });
  };
  getOxygen = async (startTime: string, endTime: string): Promise<any[]> => {
    if (!this.verifyLogin) {
      throw new Error("Não houve login na classe.");
    }

    const xml = `
      <GetXueyang xmlns="http://tempuri.org/" id="o0" c:root="1">
        <TimeZones i:type="d:string">-3:00</TimeZones>
        <EndTime i:type="d:string">${endTime}</EndTime>
        <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
        <StartTime i:type="d:string">${startTime}</StartTime>
        <Key i:type="d:string">${this.deviceToken}</Key>
      </GetXueyang>`;

    const response = await this.sendXML(xml);

    if (!response.includes("<GetXueyangResult>")) {
      throw new Error(
        "A resposta não inclui o resultado esperado da requisição."
      );
    }

    const result = response
      .split("<GetXueyangResult>")[1]
      .split("</GetXueyangResult>")[0];
    const json = JSON.parse(this.fixJSON(result));

    if (!json.arr) {
      throw new Error("O resultado da requisição não contém o array esperado.");
    }

    return json.arr.map((item) => ({
      id_unico: md5(item.time + item.xueyang + this.deviceToken),
      tempo_oxigenacao: item.time,
      oxigenacao: item.xueyang,
    }));
  };

  getDeviceInformation = async (): Promise<any> => {
    if (!this.verifyLogin) return false;
    let xml = `
        <GetDeviceDetail xmlns="http://tempuri.org/" id="o0" c:root="1">
          <TimeZones i:type="d:string">-3:00</TimeZones>
          <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
          <Key i:type="d:string">${this.deviceToken}</Key>
        </GetDeviceDetail>`;

    try {
      let response = await this.sendXML(xml);
      if (!response.includes("<GetDeviceDetailResult>"))
        throw new Error("Invalid response");

      let result = response
        .split("<GetDeviceDetailResult>")[1]
        .split("</GetDeviceDetailResult>")[0];
      let json = JSON.parse(this.fixJSON(result));

      return json;
    } catch (error) {
      return false;
    }
  };

  changeFallDownLevel = async (level: string): Promise<any> => {
    if (!this.verifyLogin) return false;
    let xml = `
        <SendCommandByAPP xmlns="http://tempuri.org/" id="o0" c:root="1">
          <CommandType i:type="d:string">LSSET</CommandType>
          <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
          <Model i:type="d:int">0</Model>
          <Paramter i:type="d:string">${level}</Paramter>
          <SN i:type="d:string" />
          <Key i:type="d:string">${this.deviceToken}</Key>
        </SendCommandByAPP>`;
    try {
      let response = await this.sendXML(xml);
      if (!response.includes("<SendCommandByAPPResult>"))
        throw new Error("Invalid response");

      let result = response
        .split("<SendCommandByAPPResult>")[1]
        .split("</SendCommandByAPPResult>")[0];
      let json = JSON.parse(this.fixJSON(result));

      return json;
    } catch (error) {
      return false;
    }
  };

  requestPAHR = async (): Promise<any> => {
    if (!this.verifyLogin) return false;
    let xml = `
        <SendCommandByAPP xmlns="http://tempuri.org/" id="o0" c:root="1">
            <CommandType i:type="d:string">HRTSTART</CommandType>
            <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
            <Model i:type="d:string">0</Model>
            <Paramter i:type="d:string">1</Paramter>
            <SN i:type="d:string"></SN>
            <Key i:type="d:string">${this.deviceToken}</Key>
        </SendCommandByAPP>`;
    let response = await this.sendXML(xml);

    if (response.includes("<SendCommandByAPPResult>")) {
      let result = parseInt(
        response
          .split("<SendCommandByAPPResult>")[1]
          .split("</SendCommandByAPPResult>")[0]
      );
      return result > 1 ? result : false;
    }
  };

  requestBodyTemp = async (): Promise<any> => {
    if (!this.verifyLogin) return false;
    let xml = `
        <SendCommandByAPP xmlns="http://tempuri.org/" id="o0" c:root="1">
            <CommandType i:type="d:string">BODYTEMP2</CommandType>
            <DeviceID i:type="d:int">${this.deviceDecimalId}</DeviceID>
            <Model i:type="d:string">0</Model>
            <Paramter i:type="d:string">1</Paramter>
            <SN i:type="d:string"></SN>
            <Key i:type="d:string">${this.deviceToken}</Key>
        </SendCommandByAPP>`;
    let response = await this.sendXML(xml);

    if (!response.includes("<SendCommandByAPPResult>")) return false;
    let result = parseInt(
      response
        .split("<SendCommandByAPPResult>")[1]
        .split("</SendCommandByAPPResult>")[0]
    );
    return result > 1 ? result : false;
  };

  parse = (string: string, start: string, end: string): string => {
    const startIndex = string.indexOf(start);
    const slicedString = string.slice(startIndex + start.length);
    const endIndex = slicedString.indexOf(end);
    return slicedString.slice(0, endIndex);
  };

  fixJSON = (badJSON: any): any => {
    return JSON.parse(
      badJSON.replace(/['"]?([a-zA-Z0-9_]+)?['"]?\s*:/g, '"$1": ')
    );
  };
}
