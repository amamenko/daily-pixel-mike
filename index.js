"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var express = require("express");
var app = express();
var Instagram = require("instagram-web-api");
var FileCookieStore = require("tough-cookie-filestore2");
var cron = require("node-cron");
var WordPOS = require("wordpos");
var wordpos = new WordPOS();
var fs = require("fs");
require("dotenv").config();
var port = process.env.PORT || 4000;
// Upload new Pixel Mike post to Instagram every day at 12:00 PM
cron.schedule("00 12 * * *", function () { return __awaiter(void 0, void 0, void 0, function () {
    var cookieStore, client, instagramPostFunction, loginFunction;
    return __generator(this, function (_a) {
        cookieStore = new FileCookieStore("./cookies.json");
        client = new Instagram({
            username: process.env.INSTAGRAM_USERNAME,
            password: process.env.INSTAGRAM_PASSWORD,
            cookieStore: cookieStore,
        }, {
            language: "en-US",
        });
        instagramPostFunction = function (currentClient) {
            var triesCounter = 0;
            while (triesCounter < 3) {
                console.log("Try #" + triesCounter);
                try {
                    wordpos.randAdjective({ count: 5 }, function (res) {
                        var resultArr = res.filter(function (item) {
                            // Must contain at least one vowel
                            return /[aeiouy]/i.test(item) &&
                                // If digits present, allow only digits with letters on both sides
                                (/\d/.test(item)
                                    ? /(?<=[a-zA-Z])\d+(?=[a-zA-Z])/i.test(item)
                                    : true) &&
                                // No words with two or more dots
                                !/^(?:[^.]*[.]){2,}[^.]*$/.test(item) &&
                                // No lower-case Roman numerals
                                !/^(?=[mdclxvi])m*(c[md]|d?c{0,3})(x[cl]|l?x{0,3})(i[xv]|v?i{0,3})$/i.test(item) &&
                                // No spelled-out numbers (other than one or ten)
                                !/(two|three|four|five|six|seven|eight|nine|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)/i.test(item);
                        });
                        var result = [""];
                        if (resultArr.length > 0) {
                            result = resultArr;
                        }
                        else {
                            result = res;
                        }
                        var resultWord = result[0].replace(/_/g, " ");
                        var newDesc = resultWord.slice(result[0].length - 3) === "ing"
                            ? resultWord
                            : "feeling " + resultWord;
                        wordpos.lookupAdjective(result[0], function (res) { return __awaiter(void 0, void 0, void 0, function () {
                            var definition, firstWordDef, secondWordDef, newDef, newCaption;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        definition = res[0].def;
                                        firstWordDef = definition.split(" ")[0];
                                        secondWordDef = definition.split(" ")[1];
                                        newDef = (firstWordDef
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
                                        newCaption = "Pixel Mike is " + newDesc + " today.\nIn other words, he " + newDef
                                            .replace(/\w*(?<! of )being/g, "")
                                            .replace(/\s{2,}/g, " ")
                                            .replace("your", "his")
                                            .replace("you", "he")
                                            .replace(/is having(?! or)/g, "has")
                                            .trim() + ".\nAre you " + newDesc + "?\nLet him know in the comments!\n#" + result[0].replace(/_|'|-/g, "") + " #PixelMike";
                                        return [4 /*yield*/, currentClient
                                                .uploadPhoto({
                                                photo: "./pixel_mike.jpg",
                                                caption: newCaption,
                                                post: "feed",
                                            })
                                                .then(function (res) { return __awaiter(void 0, void 0, void 0, function () {
                                                var media;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            media = res.media;
                                                            console.log("https://www.instagram.com/p/" + media.code + "/");
                                                            return [4 /*yield*/, currentClient.addComment({
                                                                    mediaId: media.id,
                                                                    text: "#mikewazowski #monstersinc #disney #pixel #pixar #nft #pixelart #dailyart #shrek #monstersuniversity #funny #8bit #cute #digitalart #illustration",
                                                                })];
                                                        case 1:
                                                            _a.sent();
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    break;
                }
                catch (err) {
                    console.log(err);
                }
                triesCounter++;
            }
        };
        loginFunction = function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Logging in...");
                        return [4 /*yield*/, client
                                .login()
                                .then(function () {
                                console.log("Login successful!");
                                instagramPostFunction(client);
                            })
                                .catch(function (err) { return __awaiter(void 0, void 0, void 0, function () {
                                var newCookieStore, newClient, delayedLoginFunction;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            console.log("Login failed!");
                                            console.log(err);
                                            console.log("Deleting cookies, waiting 2 minutes, then logging in again and setting new cookie store");
                                            fs.unlinkSync("./cookies.json");
                                            newCookieStore = new FileCookieStore("./cookies.json");
                                            newClient = new Instagram({
                                                username: process.env.INSTAGRAM_USERNAME,
                                                password: process.env.INSTAGRAM_PASSWORD,
                                                cookieStore: newCookieStore,
                                            }, {
                                                language: "en-US",
                                            });
                                            delayedLoginFunction = function (timeout) { return __awaiter(void 0, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0:
                                                                    console.log("Logging in again.");
                                                                    return [4 /*yield*/, newClient
                                                                            .login()
                                                                            .then(function () {
                                                                            console.log("Login successful on the second try!");
                                                                            instagramPostFunction(newClient);
                                                                        })
                                                                            .catch(function (err) {
                                                                            console.log("Login failed again!");
                                                                            console.log(err);
                                                                        })];
                                                                case 1:
                                                                    _a.sent();
                                                                    return [2 /*return*/];
                                                            }
                                                        });
                                                    }); }, timeout);
                                                    return [2 /*return*/];
                                                });
                                            }); };
                                            // Wait 2 minutes before trying to log in again
                                            return [4 /*yield*/, delayedLoginFunction(120000)];
                                        case 1:
                                            // Wait 2 minutes before trying to log in again
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        loginFunction();
        return [2 /*return*/];
    });
}); });
app.listen(port, function () {
    console.log("Listening on port " + port + "...");
});
