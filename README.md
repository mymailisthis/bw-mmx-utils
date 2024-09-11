## MMX Daily Report

This is a nodejs script based on *chiadog* that outputs a daily overview to a *telegram* bot.

NOTES:

- This project is based in MMX testenet12 logs
- requires NODEJS and NPM


### Install

1. Clone this repository

2. `npm install`

3. Create and fill your `.env` file based on `.env-sample`

### How to run
```
cd bw-mmx-utils/mmx-daily-overview
./mmx-daily-overview.js
```

#### Optional arguments
`--base=1024` default: 1000 (for TiB, PiB, etc)

`--output=console` (to print in terminal instead of sending to telegram)

`--date=YYYY-MM-DD` or `--date=live` default is yesterday date, to send report at midnight; live is used for real time data;

`--blocks=1` default: 0 (to show detailed blocks and relative efforts)


### Using it live
`./mmx-daily-overview.js  --date=live --output=console --blocks=1'`
or
`watch './mmx-daily-overview.js  --date=live --output=console --blocks=1'`


### Sending report of the day (yesterday's date)

```
cd bw-mmx-utils/mmx-daily-overview
./mmx-daily-overview.js
```


### Sending report for specific date

```
cd bw-mmx-utils/mmx-daily-overview
./mmx-daily-overview.js --date=YYYY-MM-DD
```


## Creating a cronjob to send report everyday

```
crontab -e
```

Add the following line and adapt to your needs:

```
0 0 * * * cd /full/path/to/bw-mmx-utils/mmx-daily-overview && /full/path/to/bw-mmx-utils/mmx-daily-overview/mmx-daily-overview.js > /dev/null 2>&1
```


## Report sample

```
🚜 *MMX Node Health Report* - 2024-09-10

*MMX earned* 💰: 15 MMX
Proofs 🧾: 111
 - 30 *Created blocks* 🍀
   - Blocks details:
     (height / 287%, height / 11%, height / 68%, height / 1%, height / 47%, height / 172%, height / 155%,
 height / 45%, height / 165%, height / 131%, height / 91%, height / 52%, height / 2%, height / 65%, height
0 / 48%, height / 77%, height / 155%, height / 108%, height / 85%, height / 206%, height / 97%, height /
30%, height / 58%, height / 77%, height / 39%, height / 22%, height / 18%, height / 174%, height / 59%, 7
height / 58%)
   - Average effort: 87%
 - 19 Dummy blocks 💩

Search 🔎:
 - average: 0.869s over 8947 searches
 - over 1s: 2994 occasions (33.5%)
 - over 5s: 2 occasions (0%)
 - over 15s: 0 occasions (0%)

Plots 🌱: 2067 (+141)
Eligible plots 🏆: 124.76 average (Min: 85 / Max: 174)
Skipped heights 👏: 0 (approx less than a second)

Real data:
 - ETW: 0h56
 - Farm size: 340.9 TB
 - Netspace: 114.9 PB

Based on daily gains your estimated farm data is:
 - ETW: 0h48
 - Farm size: 398.7 TB
 - Performance: 117% 👍
```


#### Future features / Known issues
  - Timezone implementation. Currently working only in UTC tz. 