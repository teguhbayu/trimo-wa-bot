import qrcode from "qrcode-terminal";
import { Client, LocalAuth } from "whatsapp-web.js";
import isCommand from "./utils/isCommand";
import { logWithColor } from "./utils/logger";
import prisma from "./utils/prisma";
import { commands } from "./utils/userCommands";

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "/home/trimo/wasap-auth",
  }),
});

client.on("message_create", async (message) => {
  const messageBody = message.body;
  const splitMessage = messageBody.split(" ");
  const commandName = splitMessage[0];
  const messageIsCommand = isCommand(commandName);
  if (
    messageIsCommand &&
    (message.author === "6281235525759@c.us" ||
      message.author === "6282197774490@c.us" ||
      message.author === "6285156795782@c.us" ||
      message.fromMe)
  ) {
    logWithColor.green(`Executing command ${commandName}`);
    commands[commandName as keyof typeof commands].function(client, message);

    logWithColor.green(`Executed ${commandName} successfully\n`);
  }
});

client.on("message_reaction", async (ctx) => {
  const checkMsg = await prisma.list.findUnique({
    where: { messageId: ctx.msgId._serialized },
  });

  if (checkMsg && ctx.reaction !== "") {
    const checkUser = await prisma.siswa.findUnique({
      where: { nomor: ctx.senderId },
    });
    if (!checkUser) return logWithColor.red("User Not Found!");

    const hasReacted = checkMsg.SiswaIDs.find((i) => i === ctx.senderId);

    if (!hasReacted)
      await prisma.list.update({
        where: { messageId: ctx.msgId._serialized },
        data: { siswa: { connect: { nomor: ctx.senderId } } },
      });
  }
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  logWithColor.green("ready wok");
});

client.initialize();
