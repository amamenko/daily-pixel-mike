import express, { Request, Response } from "express";
// @ts-ignore
import Instagram from "./instagram-web-api/index";
import FileCookieStore from "tough-cookie-filestore2";
import cron from "node-cron";
import WordPOS from "wordpos";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const wordpos = new WordPOS();

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

  const instagramPostFunction = (currentClient: typeof client) => {
    let triesCounter = 0;

    while (triesCounter < 3) {
      console.log(`Try #${triesCounter}`);
      try {
        wordpos.randAdjective({ count: 10 }, (res: string[]) => {
          const resultArr = res.filter(
            (item) =>
              // Must contain at least one vowel
              /[aeiouy]/i.test(item) &&
              // If digits present, allow only digits with letters on both sides
              (/\d/.test(item)
                ? /(?<=[a-zA-Z])\d+(?=[a-zA-Z])/i.test(item)
                : true) &&
              // No words with two or more dots
              !/^(?:[^.]*[.]){2,}[^.]*$/.test(item) &&
              // No lower-case Roman numerals
              !/^(?=[mdclxvi])m*(c[md]|d?c{0,3})(x[cl]|l?x{0,3})(i[xv]|v?i{0,3})$/i.test(
                item
              ) &&
              // No spelled-out numbers (other than one or ten)
              !/(two|three|four|five|six|seven|eight|nine|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)/i.test(
                item
              )
          );

          let result: string[] = [""];

          if (resultArr.length > 0) {
            result = resultArr;
          } else {
            result = res;
          }

          if (result[0]) {
            const resultWord = result[0].replace(/_/g, " ");
            const newDesc =
              resultWord.slice(result[0].length - 3) === "ing"
                ? resultWord
                : "feeling " + resultWord;

            wordpos.lookupAdjective(
              result[0],
              async (res: { [key: string]: string }[]) => {
                let definition = res[0].def;
                definition = definition.replace(/\(([^)]+)\)/gm, "").trim();
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
                    ? "is " +
                      (firstWordDef === "most" ? "the " : "") +
                      definition
                    : "is feeling " + definition;

                const newCaption = `Pixel Mike is ${newDesc} today.\nIn other words, he ${newDef
                  .replace(/\w*(?<! of )being/g, "")
                  .replace(/\s{2,}/g, " ")
                  // Replace possessives with male term
                  .replace(
                    /(?<![a-zA-Z0-9])your(?![a-zA-Z0-9])|(?<![a-zA-Z0-9])her(?![a-zA-Z0-9])|(?<![a-zA-Z0-9])their(?![a-zA-Z0-9])|(?<![a-zA-Z0-9])my(?![a-zA-Z0-9])|(?<![a-zA-Z0-9])our(?![a-zA-Z0-9])/gim,
                    "his"
                  )
                  .replace("you", "he")
                  .replace(/is having(?! or)/g, "has")
                  .trim()}.\nAre you ${newDesc}?\nLet him know in the comments!\n#${result[0].replace(
                  /_|'|-/g,
                  ""
                )} #PixelMike`;

                if (currentClient) {
                  return await currentClient
                    .uploadPhoto({
                      photo: "./pixel_mike.jpg",
                      caption: newCaption,
                      post: "feed",
                    })
                    .then(
                      async (res: {
                        [key: string]: { [key: string]: string };
                      }) => {
                        const media = res.media;

                        console.log(
                          `https://www.instagram.com/p/${media.code}/`
                        );

                        await currentClient.addComment({
                          mediaId: media.id,
                          text: "#mikewazowski #monstersinc #disney #pixel #pixar #nft #pixelart #dailyart #shrek #monstersuniversity #funny #8bit #cute #digitalart #illustration",
                        });
                      }
                    );
                } else {
                  console.log("Instagram client does not exist!");
                  return;
                }
              }
            );
          } else {
            throw "No adjective was supplied to wordpos!";
          }
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
        instagramPostFunction(client);
      })
      .catch(async (err: Error) => {
        console.log("Login failed!");
        console.log(err);

        console.log(
          "Deleting cookies, waiting 2 minutes, then logging in again and setting new cookie store"
        );
        fs.unlinkSync("./cookies.json");
        const newCookieStore = new FileCookieStore("./cookies.json");

        const newClient = new Instagram(
          {
            username: process.env.INSTAGRAM_USERNAME,
            password: process.env.INSTAGRAM_PASSWORD,
            cookieStore: newCookieStore,
          },
          {
            language: "en-US",
          }
        );

        const delayedLoginFunction = async (timeout: number) => {
          setTimeout(async () => {
            console.log("Logging in again.");
            await newClient
              .login()
              .then(() => {
                console.log("Login successful on the second try!");
                instagramPostFunction(newClient);
              })
              .catch((err: Error) => {
                console.log("Login failed again!");
                console.log(err);
              });
          }, timeout);
        };

        // Wait 2 minutes before trying to log in again
        await delayedLoginFunction(120000);
      });
  };

  loginFunction();
});

app.get("/", (req: Request, res: Response) => {
  res.send("Daily Pixel Mike is up and running!");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
