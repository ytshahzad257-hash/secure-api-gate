import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const mode = process.env.SECUREAPI_DEMO_MODE === "fixed" ? "fixed" : "vulnerable";
const app = createApp({ mode });

app.listen(port, () => {
  console.log(`SecureAPI-Gate demo API listening on http://localhost:${port} in ${mode} mode`);
});
