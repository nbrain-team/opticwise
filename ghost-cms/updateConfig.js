const fs = require("fs");

const contents = fs.readFileSync("config.production.json");
const config = JSON.parse(contents);
const externalURL = process.env.url || process.env.RENDER_EXTERNAL_URL;
if (externalURL) {
  config.url = externalURL;
  fs.writeFileSync("config.production.json", JSON.stringify(config, null, 2));
}
