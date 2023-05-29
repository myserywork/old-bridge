require("dotenv").config();

export const getEnv = (key: string, defaultValue: string) => {
    const value = process.env[key] || defaultValue;
    return value;
};

export const setEnv = (key: string, value: string) => {
    process.env[key] = value;
};


export const env = async (key) =>{
   return getEnv(key, "undefined");
};

export  default   {
    getEnv: getEnv,
    setEnv: setEnv,
    env: env
};