const fs = require("fs");
import { insertAlertedDB, verifyAlertedDB } from "./database/queries/logs";

export const parseCustomID = (id: string) => {
  let custom = {
    "1": "data_nascimento",
    "2": "cpf",
    "3": "pin",
    "4": "tipo_dispositivo",
    "5": "id_dispositivo",
    "7": "cerca_ativada",
    "8": "cerca_latitude",
    "9": "cerca_longitude",
    "10": "raio_cerca",
    "11": "nome_contato_emergencia_1",
    "12": "telefone_contato_emergencia_1",
    "13": "nome_contato_emergencia_2",
    "14": "telefone_contato_emergencia_2",
    "15": "nome_contato_emergencia_3",
    "16": "telefone_contato_emergencia_3",
    "17": "alarme_de_queda_ativo",
    "18": "nivel_alarme_de_queda",
    "20": "ultima_posicao_latitude",
    "21": "ultima_posicao_longitude",
    "22": "email",
  };

  return custom[id];
};

export const parseMisAlertType = (warn): String | boolean => {
  if (warn.includes("Fall Alarm")) {
    return "falldown_exam";
  } else if (warn.includes("SOS Alarm")) {
    return "sos_exam";
  } else if (warn.includes("GEO-fence out")) {
    return "fence_exam";
  } else if (warn.includes("GEO-fence in")) {
    return "fence_exam";
  }
  return false;
};

export const getStartDate = () => {
  let yourDate = new Date();
  let formated = yourDate.toISOString().split("T")[0];
  formated = formated.replace("-", "/");
  return formated.replace("-", "/") + " 00:01:00";
};

export const getEndDate = () => {
  let yourDate = new Date();
  let formated = yourDate.toISOString().split("T")[0];
  formated = formated.replace("-", "/");
  return formated.replace("-", "/") + " 23:59:59";
};

export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

export const parseAlertType = (id: string) => {
  let custom = {
    "1": "fence_exam",
    "2": "fence_exam",
    "3": "lowbattery_exam",
    "4": "tipo_dispositivo",
    "5": "sos_exam",
    "91": "wifi_in",
    "92": "wifi_out",
    "93": "high_hr_exam",
    "94": "low_hr_exam",
    "53": "falldown_exam",
    "9": "device_offline_exam",
  };

  return custom[id];
};

export const insertAlerted = async (id_unico: any) => {
  return await insertAlertedDB(id_unico);
};

export const isAlerted = async (id_unico: any) => {
  return await verifyAlertedDB(id_unico);
};

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function delayAction(action: any, params: any, delay: number) {
  console.log("RUNNING PROMISSE");
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      action(params)
        .then((data) => {
          console.log("PROMISSE RESOLVED");
          resolve(data);
        })
        .catch((err) => reject(err));
    }, delay);
  });
}

export const minutesToMileSecounds = (minutes: number) => {
  return minutes * 60 * 1000;
};

export const getFiles = (dir, files_?) => {
  files_ = files_ || [];
  let files = fs.readdirSync(dir);
  for (let i in files) {
    let name = dir + "/" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
};

export const parse = (string, start, end) => {
  var indexOfStart = string.indexOf(start);
  indexOfStart = indexOfStart + start.length;
  var newString = string.slice(indexOfStart);
  var indexOfEnd = newString.indexOf(end);
  return newString.slice(0, indexOfEnd);
};

export const fixJSON = (badJSON) => {
  let ok = badJSON

    // Replace ":" with "@colon@" if it's between double-quotes
    .replace(/:\s*"([^"]*)"/g, function (match, p1) {
      return ': "' + p1.replace(/:/g, "@colon@") + '"';
    })

    // Replace ":" with "@colon@" if it's between single-quotes
    .replace(/:\s*'([^']*)'/g, function (match, p1) {
      return ': "' + p1.replace(/:/g, "@colon@") + '"';
    })

    // Add double-quotes around any tokens before the remaining ":"
    .replace(/(['"])?([a-z0-9A-Z_]+)(['"])?\s*:/g, '"$2": ')

    // Turn "@colon@" back into ":"
    .replace(/@colon@/g, ":");
  // console.log({ ok: ok });
  return ok;
};
