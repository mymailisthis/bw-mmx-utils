#! /usr/bin/env node
Tail = require("tail").Tail;
const dotenv = require("dotenv");
dotenv.config({ path: '../.env' });
const fs = require('fs');
const args = require("minimist")(process.argv.slice(2));

const logFile = '../mmx-lulu/logs/processed_mmx_log.log';

const TelegramBot = require('node-telegram-bot-api');
const { parse } = require("path");
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatID = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(token, { polling: false });


const today = new Date();
const today_date = today.toISOString().split('T')[0];
// const current_week = 
const current_month = today.getMonth();
// const_current_year =
const months_ext = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const months_ext2 = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

let all_data = [];
let currentSet;
let excludedDates = [];
let type = "month";
let what;

if (args["type"]) {
    if (args["type"] == "week") {
        // report semanal
    }
    if (args["type"] == "month") {
        // report mensal
    }
    if (args["type"] == "year") {
        // report anual
    }
    if (args["type"] == "all_time") {
        // report all time
    }
}

if (args["what"]) {
    what = args["what"];
    // what week or what month -  default: last
}

if (args["exclude-dates"]) {
    excludedDates = args["exclude-dates"].split(",");
}

let fileExists = fs.existsSync(logFile);

initialize();

async function initialize() {

    if (fileExists) {

        parseLog();

        await computeData();
        // console.log(all_data);
        makeReport();
        // createMessage();
        // sendMessage();
    } else {
        console.log("Log file not found. Be sure you have mmx-lulu running while running mmx, and that a log is being saved in ../mmx-lulu/logs");
        process.exit();
    }
}

function parseLog() {

    const allFileContents = fs.readFileSync(logFile, 'utf-8');

    allFileContents.split(/\r?\n/).forEach(line => {
        processLines(line);
    });
}

function processLines(l) {
    const lp = l.split(" ");

    if (l == "" || lp[0] == today_date) {
        return;
    }

    checkLineDate(lp[0]);

    // Created block
    if (lp[5] == "Created" && lp[6] == "block") {
        if (lp[13] != "dummy,") {
            all_data[currentSet].total_blocks++;
            all_data[currentSet].total_rewards += lp[19] * 1;
            all_data[currentSet].total_fees += lp[23] * 1;
            // all_data[currentSet].total_amount += lp[19] * 1 + lp[23] * 1;
            all_data[currentSet].total_amount += lp[19] * 1; // actually reward is the composed amount to the farmer (reward + its part of the fee)
            // all_data[currentSet].total_efforts += lp[30].replace("%", "") / 100;

        }
    }

    if (lp[2] == "Farmdata:") {
        let tmp = JSON.parse(lp[3]);
        all_data[currentSet].tmp_farmspace += tmp.farmspace * 1;
        all_data[currentSet].tmp_netspace += tmp.netspace * 1;
    }
}

function checkLineDate(d) {
    var exists = Object.keys(all_data).some(function (k) {
        return all_data[k].date === d;
    });

    if (!exists) {
        const tmp = {
            date: d,
            total_blocks: 0,
            total_rewards: 0,
            total_fees: 0,
            total_amount: 0,
            tmp_farmspace: 0,
            tmp_netspace: 0,
            // complete: 0,
            // total_efforts: 0,
            // average_effort: 0,
            // skipped_heights: 0,
        };

        all_data.push(tmp);
    }

    currentSet = all_data.length - 1;
}


async function computeData() {
    if (all_data) {
        all_data.forEach(d => {
            d.avg_farmspace = d.tmp_farmspace / d.total_blocks;
            d.avg_netspace = d.tmp_netspace / d.total_blocks;
            delete d.tmp_farmspace;
            delete d.tmp_netspace;
            d.etw = getEtw(d.avg_farmspace, d.avg_netspace);
            d.estimated_total_blocks = 24 / d.etw;
            d.performance = d.total_blocks / d.estimated_total_blocks;

            // min farmsize
            // max farmsize
            // min netspace
            // max netspace
        });

        return true;
    }
}


function getEtw(f, n) {
    return 24 / (f / n * 8640);
}

function makeReport() {
    if (type == "month") {
        makeMonthReport().then(r => {
            if (what) {
                console.log("Month Report - " + months_ext2[what - 1]);
            } else {
                console.log("Month Report - " + months_ext2[current_month]);
            }
            console.log(r);
        });
    }
}

async function makeMonthReport() {
    let month_data = {
        total_blocks: 0,
        total_rewards: 0,
        total_fees: 0,
        total_amount: 0,
        blocks_per_day: 0,
        mmx_per_day: 0,
        tmp_total_performance: 0,
        tmp_total: 0,
        tmp_total_total: 0,
        average_performance: 0,
    };

    all_data.forEach(d => {
        let month = new Date(d.date).getMonth();
        if ((!what && month == current_month) || (what && month == getGivenMonth(what))) {
            month_data.total_blocks += d.total_blocks;
            month_data.total_rewards += d.total_rewards;
            month_data.total_fees += d.total_fees;
            month_data.total_amount += d.total_amount;

            if (!inArray(d.date, excludedDates)) {
                month_data.tmp_total_performance += d.performance;
                month_data.tmp_total++;
            }

            month_data.tmp_total_total++;
        }
    });

    month_data = await adjustReport(month_data);

    return month_data;
}

function getGivenMonth(m) {
    if (isNaN(m)) {
        if (inArray(m.toLowerCase(), months_ext)) {
            return months_ext.indexOf(m.toLowerCase());
        } else if (inArray(m.toLowerCase(), months_ext2)) {
            return months_ext2.indexOf(m.toLowerCase());
        }
    } else {
        return m - 1;
    }
}

async function adjustReport(d) {
    d.average_performance = Math.round(d.tmp_total_performance / d.tmp_total * 10000) / 10000;
    delete d.tmp_total_performance;
    delete d.tmp_total;
    d.blocks_per_day = Math.round(d.total_blocks / d.tmp_total_total * 10) / 10;
    d.mmx_per_day = Math.round(d.total_amount / d.tmp_total_total * 100) / 100;
    delete d.tmp_total_total;

    return d;
}


// aux

function inArray(needle, haystack) {
    var length = haystack.length;
    for (var i = 0; i < length; i++) {
        if (haystack[i] == needle) return true;
    }
    return false;
}