import { Client, Message } from "whatsapp-web.js";
import listComm from "../helpers/list";

export const commands = {
  "!list": {
    name: "!list",
    description: "bikin list dah",
    function: (client: Client, message: Message) => {
      listComm(client, message);
    },
  },
};
