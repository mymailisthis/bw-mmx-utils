#! /usr/bin/env node

const args = require("minimist")(process.argv.slice(2));
const dotenv = require("dotenv");
dotenv.config();

const fs = require('fs');
const exec = require('child_process').exec;
const logFolder = process.env.LOG_FOLDER;
const mmxFolder = process.env.MMX_FOLDER;

const TelegramBot = require('node-telegram-bot-api');
const { parse } = require("path");
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatID = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(token, { polling: false });

let output = "telegram";
let showBlocksInfo = false;
let utc = true;
let tzOffset;

let today = new Date();
let yesterday = new Date();
let dayBefore = new Date();
yesterday.setDate(yesterday.getDate() - 1);
dayBefore.setDate(dayBefore.getDate() - 2);
let logDate = "";
let base = 1000;

if (args["utc"] && args["utc"] == "false") {
    utc = false;
    tzOffset = today.getTimezoneOffset();

    today = new Date(today.getTime() + tzOffset * 60 * 1000);
    yesterday = new Date(yesterday.getTime() + tzOffset * 60 * 1000);
    dayBefore = new Date(dayBefore.getTime() + tzOffset * 60 * 1000);
}

// if a date is given we use it, if not, yesterday log is used
if (args["date"]) {
    if (args["date"] == "live") {
        logDate = today.toISOString().split('T')[0].replace(/-/g, "_");
        logDateBefore = yesterday.toISOString().split('T')[0].replace(/-/g, "_");
    } else {
        let tmpDate = new Date(args["date"]);
        tmpDate.setDate(tmpDate.getDate() - 1);

        logDate = args["date"].replace(/-/g, "_");
        logDateBefore = tmpDate.toISOString().split('T')[0].replace(/-/g, "_");
    }
} else {
    logDate = yesterday.toISOString().split('T')[0].replace(/-/g, "_");
    logDateBefore = dayBefore.toISOString().split('T')[0].replace(/-/g, "_");
}

if (args["base"]) {
    base = args["base"];
}

if (args["output"] && args["output"] == "console") {
    output = "console";
}

if (args["blocks"] && args["blocks"] == "1") {
    showBlocksInfo = true;
}

let dayBeforeLastBlock = {},
    farmData = {},
    proofs = 0,
    blocksCount = 0,
    rewards = 0,
    dummyBlocks = 0,
    blockHeights = "",
    blockHeightsEligible = [],
    heightsCount = 0,
    lastHeight = 0,
    skippedHeightsCount = 0,
    skippedHeightsStr = "",
    blocks = [],
    etw_h = 0,
    eligiblePlotsTotalTime = 0,
    eligiblePlotsCount = 0,
    eligibleOver1s = 0,
    eligibleOver5s = 0,
    eligibleOver15s = 0,
    plots = {},
    message;



let fileExists = fs.existsSync(logFolder + '/mmx_node_' + logDate + '.txt');
let fileBeforeExists = fs.existsSync(logFolder + '/mmx_node_' + logDateBefore + '.txt');

initialize();

async function initialize() {

    if (fileExists) {
        if (fileBeforeExists) {
            const dayBeforeData = await getDayBeforeData();
        }

        farmData["netspace"] = await getNetSpace();
        farmData["farmspace"] = await getFarmSpace();
        // farmData["netspace"] = 113324309360000000;
        // farmData["farmspace"] = 340942856626176;

        parseLog(logDate);

        createMessage();
        sendMessage();
    } else {
        console.log("No log file to the specified date.");
        process.exit();
    }
}

async function computeRelatedFarmData() {
    etw_h = 24 / (farmData.farmspace / farmData.netspace * 8640);
}

async function getDayBeforeData() {
    return parseLog(logDateBefore, true);
}

function parseLog(lf, before = false) {

    const allFileContents = fs.readFileSync(logFolder + '/mmx_node_' + lf + '.txt', 'utf-8');

    allFileContents.split(/\r?\n/).forEach(line => {
        if (before) {
            processLinesDayBefore(line);
        } else {
            processLines(line);
        }
    });
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

function createMessage() {
    computeRelatedFarmData();

    message = "🚜 *MMX Node Health Report* - " + logDate.replace(/_/g, "-") + "\n";

    message += "\n";
    message += "*MMX earned* 💰: " + Math.round(rewards * 100) / 100 + " MMX\n";
    message += "Proofs 🧾: " + proofs + "\n";
    message += " - " + blocksCount + " *Created blocks* 🍀\n";
    if (blocks.length > 0 && showBlocksInfo) {
        message += "   - Blocks details:\n"
        message += "     " + generateBlocksDetails() + "\n";
    }
    message += " - " + dummyBlocks + " Dummy blocks 💩\n";
    message += "\n";
    message += "Search 🔎: \n";
    message += " - average: " + Math.round(eligiblePlotsTotalTime / eligiblePlotsCount * 1000) / 1000 + "s over " + eligiblePlotsCount + " searches\n";
    message += " - over 1s: " + eligibleOver1s + " occasions (" + Math.round(eligibleOver1s / eligiblePlotsCount * 1000) / 10 + "%)\n";
    message += " - over 5s: " + eligibleOver5s + " occasions (" + Math.round(eligibleOver5s / eligiblePlotsCount * 1000) / 10 + "%)\n";
    message += " - over 15s: " + eligibleOver15s + " occasions (" + Math.round(eligibleOver15s / eligiblePlotsCount * 1000) / 10 + "%)\n";
    message += "\n";
    message += "Plots 🌱: ";

    let i = 0;
    Object.entries(plots).forEach(([k, v]) => {
        if (i > 0) {
            message += " / ";
        }
        if (Object.entries(plots).length > 1)
            message += "[" + k + "] ";

        message += v.final + isThereDiff(v);
        i++;
    });
    message += "\n";

    message += "Eligible plots 🏆: ";
    let f = 0;
    Object.entries(plots).forEach(([k, v]) => {
        if (Object.entries(plots).length > 1) {
            message += "\n";
            message += "  [" + k + "] ";
        }

        message += Math.round(v.eligibleTotal / eligiblePlotsCount * 100) / 100 + " average (Min: " + v.eligibleMin + " / Max: " + v.eligibleMax + ")";
        f++;
    });
    message += "\n";

    let iconSH;
    if (skippedHeightsCount > 0) {
        iconSH = "🙈";
    } else {
        iconSH = "👏";
    }
    message += "Skipped heights " + iconSH + ": " + skippedHeightsCount + " (approx " + millisecondsToStr(skippedHeightsCount * 10 * 1000) + ") " + skippedHeightsStr + "\n";
    message += "\n";

    message += "Real data: \n";
    message += " - ETW: " + convertHoursDecimal(etw_h) + "\n";
    message += " - Farm size: " + humanFileSize(farmData.farmspace, base) + "\n";
    message += " - Netspace: " + humanFileSize(farmData.netspace, base) + "\n";
    message += "\n";

    message += "Based on daily gains your estimated farm data is: \n";
    message += " - ETW: " + convertHoursDecimal(getEstimatedETW()) + "\n";
    message += " - Farm size: " + humanFileSize(getEstimatedFarmSize(), base) + "\n";
    let iconPerf;
    if (getEstimatedFarmSize() / farmData.farmspace >= 1) {
        iconPerf = "👍";
    } else {
        iconPerf = "👎";
    }
    message += " - Performance: " + Math.round(getEstimatedFarmSize() / farmData.farmspace * 1000) / 10 + "% " + iconPerf;
}

function isThereDiff(h) {
    if (h.final !== h.initial) {
        const diff = h.final - h.initial;
        let sign = "";
        if (diff > 0) {
            sign = "+";
        }
        return " (" + sign + diff + ")";
    } else {
        return false;
    }
}

function generateBlocksDetails() {
    if (blocks.length > 0) {
        let str = "";
        let lastTime = 0;
        let allEfforts = [];

        blocks.forEach(b => {
            (lastTime == 0) && (lastTime = new Date(dayBeforeLastBlock.dateTime).getTime());
            let currentBlockTime = new Date(b.dateTime).getTime();
            let diff = Math.abs(currentBlockTime - lastTime) / 36e5;
            let effort = Math.round(diff / etw_h * 100);
            allEfforts.push(effort);
            lastTime = currentBlockTime;

            if (str !== "") {
                str += ", ";
            } else {
                str += "(";
            }
            str += b.height + " / " + effort + "%";
        });

        str += ")\n";
        str += "   - Average effort: " + Math.round(allEfforts.reduce((partialSum, a) => partialSum + a, 0) / allEfforts.length) + "%";

        return str;
    }
}

function sendMessage() {
    if (output == "telegram") {
        bot.sendMessage(chatID, message, { parse_mode: 'Markdown' }).then(r => {
            // console.log(r);
            console.log("sent!");

            process.exit();
        });
    }

    if (output == "console") {
        console.log(message);

        process.exit();
    }
}

function processLinesDayBefore(l) {
    const lp = l.split(" ");

    // Created block
    if (lp[5] == "Created" && lp[6] == "block") {
        if (lp[13] != "dummy,") {
            dayBeforeLastBlock = createBlock(lp);
        }
    }
}

function createBlock(lp) {
    return {
        height: lp[9],
        rewards: lp[19] * 1,
        dateTime: lp[0] + " " + lp[1],
        fees: lp[23] * 1,
    }
}

function processLines(l) {
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

    // Committed height
    if (lineparts[4] == "Committed" && lineparts[5] == "height") {
        checkSkippedHeights(lineparts[6] * 1);
        heightsCount++;
    }
}

function checkSkippedHeights(h) {
    if (lastHeight != 0) {
        if (lastHeight + 1 !== h) {
            skippedHeightsCount = skippedHeightsCount + (h - lastHeight);
            if (skippedHeightsStr !== "") {
                skippedHeightsStr += ", ";
            }
            skippedHeightsStr += "[" + lastHeight + "..." + h + "]";
        }
    }

    lastHeight = h;
}

function dealWithProof(lp) {
    proofs++;
}

function dealWithBlock(lp) {
    if (lp[13] != "dummy,") {
        const bl = createBlock(lp);
        blocks.push(bl);
        blocksCount++;
        if (blockHeights !== "") {
            blockHeights += ", ";
        }
        blockHeights += lp[9];
        rewards = rewards + lp[19] * 1;
    } else {
        dummyBlocks++;
    }
}

function dealWithEligible(lp) {
    const ep = lp[5] * 1;
    const lookup = lp[16] * 1;
    const host = lp[4].replace(/[\[\]']+/g, '');

    if (!plots[host]) {
        plots[host] = {
            initial: 0,
            final: 0,
            eligibleTotal: 0,
            eligibleMin: undefined,
            eligibleMax: 0,
            eligibleTotalTime: 0,
        }
    }

    plots[host].eligibleTotal = plots[host].eligibleTotal + ep;

    if (plots[host].eligibleMin == undefined || ep < plots[host].eligibleMin) {
        plots[host].eligibleMin = ep;
    }

    if (ep > plots[host].eligibleMax) {
        plots[host].eligibleMax = ep;
    }

    if (plots[host].initial == 0) {
        plots[host].initial = lp[7] * 1;
    }

    plots[host].final = lp[7] * 1;

    plots[host].eligibleTotalTime = plots[host].eligibleTotalTime + lookup;
    if (lookup > 1 && lookup <= 5) {
        eligibleOver1s++;
    }
    if (lookup > 5 && lookup <= 15) {
        eligibleOver5s++;
    }
    if (lookup > 15) {
        eligibleOver15s++;
    }

    if (!inEligibleHeights(lp[13])) {
        eligiblePlotsCount++;
    }
}

function inEligibleHeights(h) {
    if (!inArray(h, blockHeightsEligible)) {
        blockHeightsEligible.push(h);
        return false;
    } else {
        return true;
    }
}

function getEstimatedETW() {
    return 24 / blocksCount;
}

function getEstimatedFarmSize() {
    // 24 / (fs / netspace * 8640) = etw
    return 24 / getEstimatedETW() / 8640 * farmData.netspace;
}

function millisecondsToStr(milliseconds) {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding(number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks? 
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + ' second' + numberEnding(seconds);
    }
    return 'less than a second'; //'just now' //or other string you like;
}

function convertHoursDecimal(h) {
    let decimalTime = parseFloat(h);
    decimalTime = decimalTime * 60 * 60;
    let hours = Math.floor((decimalTime / (60 * 60)));
    decimalTime = decimalTime - (hours * 60 * 60);
    let minutes = Math.floor((decimalTime / 60));
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + "h" + minutes;
}

function humanFileSize(size, b) {
    let units = ['bytes', 'kiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    if (b == 1000) {
        units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
    }
    var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(b));
    return +((size / Math.pow(b, i)).toFixed(2)) * 1 + ' ' + units[i];
}

function inArray(needle, haystack) {
    var length = haystack.length;
    for (var i = 0; i < length; i++) {
        if (haystack[i] == needle) return true;
    }
    return false;
}