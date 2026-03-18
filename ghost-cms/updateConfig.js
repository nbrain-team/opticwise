const fs = require("fs");

const contents = fs.readFileSync("config.production.json");
const config = JSON.parse(contents);

const externalURL = process.env.url || process.env.RENDER_EXTERNAL_URL;
if (externalURL) {
  config.url = externalURL;
}

if (process.env.mail__options__auth__user && process.env.mail__options__auth__pass) {
  config.mail = {
    transport: "SMTP",
    options: {
      host: process.env.mail__options__host || "smtp.gmail.com",
      port: parseInt(process.env.mail__options__port || "587"),
      secure: false,
      auth: {
        user: process.env.mail__options__auth__user,
        pass: process.env.mail__options__auth__pass,
      },
    },
    from: process.env.mail__from || "'Opticwise' <bill@opticwise.com>",
  };
  console.log("[Ghost Config] Mail configured via SMTP:", process.env.mail__options__host || "smtp.gmail.com");
} else {
  config.mail = {
    transport: "Direct",
    from: process.env.mail__from || "'Opticwise' <bill@opticwise.com>",
  };
  console.warn("[Ghost Config] No SMTP credentials found. Mail transport set to Direct (emails may not deliver).");
}

fs.writeFileSync("config.production.json", JSON.stringify(config, null, 2));
