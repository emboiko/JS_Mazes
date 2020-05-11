const express = require("express");
const app = express();
app.use(express.static("public"));
const PORT = process.env.PORT || 1337;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
