import { Client, Message, MessageId } from "whatsapp-web.js";
import prisma from "../utils/prisma";

const listComm = async (client: Client, message: Message) => {
  const params = message.body.split(" ");
  const chatId = (await message.getChat()).id._serialized;
  switch (params[1]) {
    case "new":
      const messageReact = await client.sendMessage(
        chatId,
        `*React Pesan ini menggunakan 👍 jika ${params.slice(2).join(" ")}*`
      );
      await prisma.list.create({
        data: {
          nama_list: params.slice(2).join(" "),
          messageId: messageReact.id._serialized,
        },
      });
      break;
    case "show":
      const list = await prisma.list.findUnique({
        where: { nama_list: params.slice(2).join(" ") as string },
        include: { siswa: true },
      });
      const userTotal = await prisma.siswa.count();
      if (list) {
        const sortedSiswa = list.siswa.sort((a, b) => a.no_absen - b.no_absen);
        const content = `*List Yang sudah ${list?.nama_list}*\n(${
          list.SiswaIDs.length
        }/${userTotal} siswa sudah)\n\n${sortedSiswa
          .map((i) => `${i.no_absen}. ${i.nama} ✅`)
          .join("\n")}`;
        client.sendMessage(chatId, content);
      }
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
        data: { siswa: { connect: { nomor: message.id._serialized } } },
      });
      await message.react("👍");
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
      const totalSiswa = await prisma.siswa.count();
      const sortedSiswa = siswas.sort((a, b) => a.no_absen - b.no_absen);
      const content = `*List Yang Belum ${dones.nama_list}*\n(${
        siswas.length
      }/${totalSiswa} siswa masih belum melakukan)\n\n${sortedSiswa
        .map((i) => `${i.no_absen}. ${i.nama} ❌`)
        .join("\n")}\n\nSilahkan konfirmasi kepada bot`;
      client.sendMessage(chatId, content);
      break;

    case "total":
      const totalSiswaWok = await prisma.siswa.count();
      const totalSudahWok = await prisma.siswa.count({
        where: { List: { some: { nama_list: params.slice(2).join(" ") } } },
      });
      client.sendMessage(
        chatId,
        `*Total Data Yang Terkumpul Untuk List ${params
          .slice(2)
          .join(
            " "
          )}*\n\n*Yang Sudah ✅:*\n${totalSudahWok}/${totalSiswaWok} Siswa Sudah\n\n*Yang Belum ❌:*\n${
          totalSiswaWok - totalSudahWok
        }/${totalSiswaWok} Siswa Belum`
      );
      break;

    case "semua":
      const userTotalAll = await prisma.siswa.count();
      const doneAll = await prisma.list.findUnique({
        where: { nama_list: params.slice(2).join(" ") as string },
        include: { siswa: true },
      });
      if (!doneAll) return await message.react("❌");
      const havent = await prisma.siswa.findMany({
        where: { nomor: { notIn: doneAll.siswa.map((i) => i.nomor) } },
      });
      const sortedDone = doneAll.siswa.sort((a, b) => a.no_absen - b.no_absen);
      const sortedHavent = havent.sort((a, b) => a.no_absen - b.no_absen);
      const contentAll = `*List Yang sudah ${doneAll.nama_list}*\n(${
        doneAll.SiswaIDs.length
      }/${userTotalAll} siswa sudah)\n\n${sortedDone
        .map((i) => `${i.no_absen}. ${i.nama} ✅`)
        .join("\n")}\n\n*List Yang Belum ${doneAll.nama_list}*\n(${
        sortedHavent.length
      }/${userTotalAll} siswa masih belum melakukan)\n\n${sortedHavent
        .map((i) => `${i.no_absen}. ${i.nama} ❌`)
        .join("\n")}\n\nSilahkan konfirmasi kepada bot`;
      await client.sendMessage(chatId, contentAll);
      break;
  }
};

export default listComm;
