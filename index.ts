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

  const instagramPostFunction = () => {
    let triesCounter = 0;

    while (triesCounter < 3) {
      console.log(`Try #${triesCounter}`);
      try {
        wordpos.randAdjective({ count: 1 }, (result: string[]) => {
          const resultWord = result[0].replace(/_/g, " ");
          const newDesc =
            resultWord.slice(result[0].length - 3) === "ing"
              ? resultWord
              : "feeling " + resultWord;

          wordpos.lookupAdjective(
            result[0],
            async (res: { [key: string]: string }[]) => {
              const definition = res[0].def;
              const firstWordDef = definition.split(" ")[0];
              const secondWordDef = definition.split(" ")[1];

              const newDef =
                (firstWordDef
                  ? firstWordDef.slice(firstWordDef.length - 3) === "ing"
                  : "") ||
                (secondWordDef
                  ? secondWordDef.slice(secondWordDef.length - 3) === "ing"
                  : "") ||
                firstWordDef === "of" ||
                firstWordDef === "in" ||
                firstWordDef === "most" ||
                (firstWordDef
                  ? firstWordDef.slice(firstWordDef.length - 2) === "ed"
                  : "") ||
                (firstWordDef
                  ? firstWordDef.slice(firstWordDef.length - 2) === "en"
                  : "")
                  ? "is " + (firstWordDef === "most" ? "the " : "") + definition
                  : "is feeling " + definition;

              const newCaption = `Pixel Mike is ${newDesc} today.\nIn other words, he ${newDef
                .replace(/\w*(?<! of )being/g, "")
                .replace(/\s{2,}/g, " ")
                .replace("your", "his")
                .replace("you", "him")
                .replace(/is having(?! or)/g, "has")
                .trim()}.\nAre you ${newDesc}?\nLet him know in the comments!\n#${result[0].replace(
                /_|'|-/g,
                ""
              )} #PixelMike`;

              await client
                .uploadPhoto({
                  photo: "./pixel_mike.jpg",
                  caption: newCaption,
                  post: "feed",
                })
                .then(
                  async (res: { [key: string]: { [key: string]: string } }) => {
                    const media = res.media;

                    console.log(`https://www.instagram.com/p/${media.code}/`);

                    await client.addComment({
                      mediaId: media.id,
                      text: "#mikewazowski #monstersinc #disney #pixel #pixar #nft #pixelart #dailyart #shrek #monstersuniversity #funny #8bit #cute #digitalart #illustration",
                    });
                  }
                );
            }
          );
        });
        break;
      } catch (err) {
        console.log(err);
      }
      triesCounter++;
    }
  };

  const loginFunction = async () => {
    console.log("Logging in...");

    await client
      .login()
      .then(() => {
        console.log("Login successful!");
        instagramPostFunction();
      })
      .catch((err: Error) => {
        console.log("Login failed!");
        console.log(err);
      });
  };

  loginFunction();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
