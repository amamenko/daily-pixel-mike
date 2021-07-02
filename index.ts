const express = require("express");
const app = express();
const Instagram = require("instagram-web-api");
const FileCookieStore = require("tough-cookie-filestore2");
const cron = require("node-cron");
const WordPOS = require("wordpos");
const wordpos = new WordPOS();
require("dotenv").config();

const port = process.env.PORT || 4000;

// Upload new Pixel Mike post to Instagram every day at 12:00 PM
cron.schedule("00 12 * * *", async () => {
  // Persist cookies after Instagram client log in
  const cookieStore = new FileCookieStore("./cookies.json");

  const client = new Instagram(
    {
      username: process.env.INSTAGRAM_USERNAME,
      password: process.env.INSTAGRAM_PASSWORD,
      cookieStore,
    },
    {
      language: "en-US",
    }
  );

  wordpos.randAdjective({ count: 1 }, async (result: string[]) => {
    const resultWord = result[0].replace("_", " ");
    const newDesc =
      resultWord.slice(result[0].length - 3) === "ing"
        ? resultWord
        : "feeling " + resultWord;
    const newCaption = `Pixel Mike is ${newDesc} today.\nAre you ${newDesc}?\nLet him know in the comments! \n#${result[0]} #PixelMike`;

    await client
      .uploadPhoto({
        photo: "./pixel_mike.jpg",
        caption: newCaption,
        post: "feed",
      })
      .then(async (res: { [key: string]: { [key: string]: string } }) => {
        const media = res.media;

        console.log(`https://www.instagram.com/p/${media.code}/`);

        await client.addComment({
          mediaId: media.id,
          text: "#mikewazowski #monstersinc #disney #pixel #pixar #boo #monsterinc #sulley #nft #pixelart #dailyart #pixelartist #shrek #monstersuniversity #funny #design #8bit #8bitart #nycart #16bit #16bitart #cute #artist #instadaily #artdaily #nfts #digitalart #bitart #illustration #pixelartwork",
        });
      });
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
