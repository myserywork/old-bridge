const { connection } = require("../connection");
const { v4: uuidv4 } = require("uuid");

export const insertAlertedDB = async (alert_id) => {
 
  const { results } = await connection.query({
    sql: `
            INSERT INTO
                alerts_log
                (
                    action,
                    alert_id
                )
            VALUES
                (
                    :action,
                    :alert_id
                )
            ;
        `,
    params: {
      action: "logAction",
      alert_id: alert_id,
    },
  });

  if (results.affectedRows < 0) return false;
  return results.insertId;

};

export const verifyAlertedDB = async (alert_id) => {
    const { results } = await connection.query({
        sql: ` SELECT * FROM alerts_log WHERE alert_id = :alert_id; `,
        params: {
        alert_id: alert_id,
        },
    });
    
    if (results.length > 0) return true;
    return false;
}