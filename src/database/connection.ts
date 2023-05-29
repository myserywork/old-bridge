const { MySQL } = require("mysql-promisify");

export const connection = new MySQL({
  host: "108.167.132.96",
  user: "eprevsau_eprevgestao",
  password: "gestao1234!@",
  charset: "utf8",
  database: "eprevsau_eprevgestao",
  timeout: 60000,
  // multipleStatements: true,
});
