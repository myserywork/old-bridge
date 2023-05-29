var figlet = require("figlet");

export const wellcome = async () => {
  figlet("Moriarty's Bridge v2.05312", function (err, data) {
    if (err) {
      console.log("Something went wrong...");
      console.dir(err);
      return;
    }
    console.log(data);
  });
};
