#! /usr/bin/env node
Tail = require("tail").Tail;
const dotenv = require("dotenv");
dotenv.config();
const fs = require('fs');
const exec = require('child_process').exec;

const log_folder = process.env.LOG_FOLDER;
const mmx_log_folder = process.env.MMX_LOG_FOLDER;
const home_folder = process.env.HOME_FOLDER;
const mmxFolder = process.env.MMX_FOLDER;

const TelegramBot = require('node-telegram-bot-api');
const { parse } = require("path");
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatID = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(token, { polling: false });

let logToday = "",
    logYesterday = "",
    tail;

let lastDate = new Date(),
    dailyBlockCount = 0,
    farmData = {},
    blocks = [];

initialize();

async function initialize() {
    if (tail) {
        tail.unwatch();
    }

    dailyBlockCount = 0;
    let today = new Date();
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    logToday = today.toISOString().split('T')[0].replace(/-/g, "_");
    logYesterday = yesterday.toISOString().split('T')[0].replace(/-/g, "_");

    let fileTodayExists = fs.existsSync(mmx_log_folder + '/mmx_node_' + logToday + '.txt');
    let fileYesterdayExists = fs.existsSync(mmx_log_folder + '/mmx_node_' + logYesterday + '.txt');

    if (fileTodayExists && blocks.length == 0) {
        const todayData = await getLogData(logToday);

        if (fileYesterdayExists && blocks.length == 0) {
            const yesterdayData = await getLogData(logYesterday);
        }
    }

    farmData["netspace"] = await getNetSpace();
    farmData["farmspace"] = await getFarmSpace();
    // farmData["netspace"] = 113324309360000000;
    // farmData["farmspace"] = 240942856626176;

    console.log(
        "Listening to " +
        mmx_log_folder +
        "/mmx_node_" + logToday + ".txt"
    );

    while (!fs.existsSync(mmx_log_folder + "/mmx_node_" + logToday + ".txt")) {
        sleep(500);
    }

    tail = new Tail(mmx_log_folder + "/mmx_node_" + logToday + ".txt");

    tail.on("line", function (data) {
        parseData(data);
    });
}



// parseData("Phase 1 took 1315.98 sec");
async function parseData(d) {

    const l_parts = d.split(" ");

    // Created block
    if (l_parts[5] == "Created" && l_parts[6] == "block") {
        if (l_parts[13] == "dummy,") {
            log(d);
        } else {
            const eff = await computeEffort(d);
            let effort = "";
            (eff != "N/A") && (effort = ", effort = " + eff + "%");
            log(d + effort);
            blocks.push(createBlock(d));
            log(l_parts[0] + " " + l_parts[1] + " Farmdata: " + JSON.stringify(farmData));
            sendTelegramMessage("🍀 *New block* \\[#" + dailyBlockCount + "\] @ height: " + l_parts[9] + "\nscore: " + l_parts[16].replace(",", "") + effort + " | reward: " + l_parts[19] + " " + l_parts[20].replace(",", "") + " | fees: " + l_parts[23] + " " + l_parts[24].replace(",", ""));
        }
    }

    // Found proof
    if (l_parts[5] == "Found" && l_parts[6] == "proof") {
        log(d);
    }

    lastDate = new Date(l_parts[0] + " " + l_parts[1]);
    const now = new Date();
    if (now.getDate() != lastDate.getDate()) {
        // tail.unwatch();
        initialize();
    }
}

function createBlock(l) {
    const lp = l.split(" ");

    const now = new Date();
    const l_date = new Date(lp[0] + " " + lp[1]);
    if (l_date.getDate() == now.getDate()) {
        dailyBlockCount++;
    }

    return {
        height: lp[9],
        rewards: lp[19] * 1,
        dateTime: lp[0] + " " + lp[1],
        fees: lp[23] * 1,
    }
}

function log(msg) {
    console.log(msg);

    let log = fs.createWriteStream(log_folder + "/processed_mmx_log.log", {
        flags: "a",
    });
    log.write(msg + "\n");
}

function sendTelegramMessage(msg) {
    bot.sendMessage(chatID, msg, { parse_mode: 'Markdown' });
}

async function getNetSpace() {

    return new Promise(function (resolve, reject) {
        exec(mmxFolder + "/build/mmx node get netspace", function (err, stdout, stderr) {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                const result = stdout.split("\n");
                resolve(result[0]);
            }
        });
    });
}

async function getFarmSpace() {

    return new Promise(function (resolve, reject) {
        exec(mmxFolder + "/build/mmx farm info", function (err, stdout, stderr) {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                const result = stdout.split("\n");
                let total = result[3].split(" ");
                resolve(total[6] * 1000000000000);
            }
        });
    });
}

async function computeEffort(l) {
    farmData["netspace"] = await getNetSpace();
    farmData["farmspace"] = await getFarmSpace();

    const lp = l.split(" ");

    if (blocks.length == 0) {
        return "N/A";
    } else {
        const etw = await computeRelatedFarmData();
        let currentBlockTime = new Date(lp[0] + " " + lp[1]).getTime();
        let lastBlockTime = new Date(blocks[blocks.length - 1].dateTime).getTime();
        let diff = Math.abs(currentBlockTime - lastBlockTime) / 36e5;
        let effort = Math.round(diff / etw * 100);
        return effort;
    }
}

async function computeRelatedFarmData() {
    return 24 / (farmData.farmspace / farmData.netspace * 8640);
}

async function getLogData(l) {
    return parseLog(l, true);
}

function parseLog(lf) {

    const allFileContents = fs.readFileSync(mmx_log_folder + '/mmx_node_' + lf + '.txt', 'utf-8');

    allFileContents.split(/\r?\n/).forEach(line => {
        processLines(line);
    });
}

function processLines(l) {
    const lp = l.split(" ");

    // Created block
    if (lp[5] == "Created" && lp[6] == "block") {
        if (lp[13] == "0,") {
            blocks.push(createBlock(l));
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}