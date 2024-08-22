#! /usr/bin/env node

const args = require("minimist")(process.argv.slice(2));
const dotenv = require("dotenv");
dotenv.config();

const fs = require('fs');
const logFolder = process.env.LOG_FOLDER;

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatID = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(token, { polling: true });

let yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
let logDate = "";

// if a date is given we use it, if not, yesterday log is used
args["date"] ? (logDate = args["date"].replace(/-/g, "_")) : (logDate = yesterday.toISOString().split('T')[0].replace(/-/g, "_"));

let proofs = 0,
    blocks = 0,
    rewards = 0,
    dummyBlocks = 0,
    blockHeights = "",
    eligiblePlotsTotal = 0,
    eligiblePlotsTotalTime = 0,
    eligiblePlotsCount = 0,
    eligiblePlotsMax = "",
    eligiblePlotsMin = "",
    eligibleOver1s = 0,
    eligibleOver5s = 0,
    eligibleOver15s = 0,
    plotsInitial = 0,
    plotsFinal = 0,
    message;


let fileExists = fs.existsSync(logFolder + '/mmx_node_' + logDate + '.txt');

if (fileExists) {
    const allFileContents = fs.readFileSync(logFolder + '/mmx_node_' + logDate + '.txt', 'utf-8');

    allFileContents.split(/\r?\n/).forEach(line => {
        processLine(line);
    });

    createMessage();
    sendMessage();
} else {
    console.log("No log file to the specified date.");
    process.exit();
}

function createMessage() {

    message = "🚜 MMX Node Health Report - " + logDate.replace(/_/g, "-") + "\n";

    message += "\n";
    message += "MMX earned 💰: " + Math.round(rewards * 100) / 100 + " MMX\n";
    message += "Proofs 🧾: " + proofs + "\n";
    message += " - " + blocks + " Created blocks 🍀\n";
    if (blocks > 0) {
        message += "   (" + blockHeights + ")\n";
    }
    message += " - " + dummyBlocks + " Dummy blocks 💩\n";
    message += "\n";
    message += "Search 🔎: \n";
    message += " - average: " + Math.round(eligiblePlotsTotalTime / eligiblePlotsCount * 1000) / 1000 + "s over " + eligiblePlotsCount + " searches\n";
    message += " - over 1s: " + eligibleOver1s + " occasions (" + Math.round(eligibleOver1s / eligiblePlotsCount * 1000) / 10 + "%)\n";
    message += " - over 5s: " + eligibleOver5s + " occasions (" + Math.round(eligibleOver5s / eligiblePlotsCount * 1000) / 10 + "%)\n";
    message += " - over 15s: " + eligibleOver15s + " occasions (" + Math.round(eligibleOver15s / eligiblePlotsCount * 1000) / 10 + "%)\n";
    message += "\n";
    message += "Plots 🌱: " + plotsFinal;
    if (plotsFinal !== plotsInitial) {
        const diff = plotsFinal - plotsInitial;
        let sign = "";
        if (diff > 0) {
            sign = "+";
        }
        message += " (" + sign + diff + ")\n";
    } else {
        message += "\n";
    }
    message += "Eligible plots 🏆: " + Math.round(eligiblePlotsTotal / eligiblePlotsCount * 100) / 100 + " average (Min: " + eligiblePlotsMin + " / Max: " + eligiblePlotsMax + ")\n";
    message += "\n";
}

function sendMessage() {
    bot.sendMessage(chatID, message).then(r => {
        // console.log(r);
        console.log("sent!");

        process.exit();
    });
    // console.log(message);
}

function processLine(l) {
    const lineparts = l.split(" ");

    // Found proof
    if (lineparts[5] == "Found" && lineparts[6] == "proof") {
        dealWithProof(lineparts);
    }

    // Created block
    if (lineparts[5] == "Created" && lineparts[6] == "block") {
        dealWithBlock(lineparts);
    }

    // plots were eligible
    if (lineparts[8] == "plots" && lineparts[9] == "were" && lineparts[10] == "eligible") {
        dealWithEligible(lineparts);
    }
}

function dealWithProof(lp) {
    proofs++;
}

function dealWithBlock(lp) {
    if (lp[13] == "0,") {
        blocks++;
        if (blockHeights !== "") {
            blockHeights += ", ";
        }
        blockHeights += lp[9];
        rewards = rewards + lp[19] * 1;
    } else if (lp[13] == "dummy,") {
        dummyBlocks++;
    }
}

function dealWithEligible(lp) {
    const ep = lp[5] * 1;
    const lookup = lp[16] * 1;

    eligiblePlotsTotal = eligiblePlotsTotal + ep;

    if (!eligiblePlotsMin || ep < eligiblePlotsMin) {
        eligiblePlotsMin = ep;
    }

    if (!eligiblePlotsMax || ep > eligiblePlotsMax) {
        eligiblePlotsMax = ep;
    }

    if (plotsInitial == 0) {
        plotsInitial = lp[7] * 1;
    }

    plotsFinal = lp[7] * 1;

    eligiblePlotsTotalTime = eligiblePlotsTotalTime + lookup;
    if (lookup > 1 && lookup <= 5) {
        eligibleOver1s++;
    }
    if (lookup > 5 && lookup <= 15) {
        eligibleOver5s++;
    }
    if (lookup > 15) {
        eligibleOver15s++;
    }
    eligiblePlotsCount++;
}

// 2024-08-22 06:28:03 [Node] INFO: 🤑 Created block at height 595448 with: ntx = 0, score = 377, reward = 0.5 MMX, fees = 0 MMX, took 0.035 sec