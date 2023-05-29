import chalk from 'chalk';
const { Logtail } = require("@logtail/node");

const logtail = new Logtail("LokwZRLF23ikuTHZJ8kKPKZz");

const formatDate = () => {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');

    return `[${day}/${month}/${year} ${hour}:${minute}:${second}]`;
};

export const log = async (data, log_data = true) => {
    let date = formatDate();
    if (log_data) console.log(chalk.yellow(date));
    await logtail.info(data);
    console.log(data);
};

export const logError = async (error) => {
    return log(chalk.red.bold(`[ERROR] ${error}`));
};

export const logInfo = async (info) => {
    return log(chalk.blue.bold(`[INFO] ${info}`));
};

export const logText = async (text) => {
    return log(text);
};

export const logWarning = async (warning) => {
    return log(chalk.yellow.bold(`[WARNING] ${warning}`));
};

export const logSuccess = async (success) => {
    return log(chalk.green.bold(`[SUCCESS] ${success}`));
};

export const logger = {
    logInfo: logInfo,
    logText: logText,
    logWarning: logWarning,
    logError: logError,
    logSuccess: logSuccess
};