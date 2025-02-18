import { Client, Message, MessageId } from "@open-wa/wa-automate";
import prisma from "../utils/prisma";

const listComm = async (client: Client, message: Message) => {
  // The command will form '!spam <times> <message>'
  const params = message.body.split(" ");
  switch (params[1]) {
    case "new":
      if (
        message.sender.id === "6281235525759@c.us" ||
        message.sender.id === "6282197774490@c.us" ||
        message.fromMe
      ) {
        await prisma.list.create({
          data: {
            nama_list: params.slice(2).join(" "),
          },
        });
        await client.sendText(
          message.chatId,
          `Salin dan Kirim Pesan di bawah jika ${params.slice(2).join(" ")}`
        );
        await client.sendText(
          message.chatId,
          `!list done ${params.slice(2).join(" ")}`
        );
      }
      break;
    case "show":
      const list = await prisma.list.findUnique({
        where: { nama_list: params.slice(2).join(" ") as string },
        include: { siswa: true },
      });
      const userTotal = await prisma.siswa.count();
      if (list) {
        const sortedSiswa = list.siswa.sort((a, b) => a.no_absen - b.no_absen);
        const content = `*List Yang sudah mengisi ${list?.nama_list}*\n(${
          list.SiswaIDs.length
        }/${userTotal} siswa sudah mengisi)\n\n${sortedSiswa
          .map((i) => `${i.no_absen}. ${i.nama} ✅`)
          .join("\n")}`;
        client.sendText(message.chatId, content);
      }
      break;
    case "daftar":
      await prisma.siswa.create({
        data: {
          nama: params[2] as string,
          no_absen: parseInt(params[3]),
          nomor: message.sender.id,
        },
      });
      client.react(message.id, "👍");
      break;
    case "done":
      if (message.fromMe) break;
      const listFind = await prisma.list.findUnique({
        where: { nama_list: params.slice(2).join(" ") as string },
        select: { id: true },
      });
      if (!listFind) break;
      await prisma.list.update({
        where: { nama_list: params.slice(2).join(" ") as string },
        data: { siswa: { connect: { nomor: message.sender.id } } },
      });
      client.react(message.id, "👍");
      break;

    case "belum":
      const dones = await prisma.list.findUnique({
        where: { nama_list: params.slice(2).join(" ") as string },
        include: { siswa: true },
      });
      if (!dones) break;
      const siswas = await prisma.siswa.findMany({
        where: { nomor: { notIn: dones.siswa.map((i) => i.nomor) } },
      });
      const sortedSiswa = siswas.sort((a, b) => a.no_absen - b.no_absen);
      const content = `*List Yang belum mengisi ${dones.nama_list}*\n(${
        siswas.length
      }/36 siswa masih belum mengisi)\n\n${sortedSiswa
        .map((i) => `${i.no_absen}. ${i.nama} ❌`)
        .join("\n")}\nSilahkan mengisi listnya`;
      client.sendText(message.chatId, content);
  }
};

export default listComm;
