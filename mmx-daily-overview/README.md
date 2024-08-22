## Register New Chia Plots

This is a nodejs script based on *chiadog* that outputs a daily overview to a *telegram* bot.

NOTES:

- This project is based in MMX testenet12 logs


### Install

1. Clone this repository

2. `npm install`

3. Create and fill your `.env` file based on `.env-sample`


## Sending yesterday's report

```
cd bw-mmx-utils/mmx-daily-overview
./mmx-daily-overview.js
```


## Sending report for specific date

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
🚜 MMX Node Health Report - 2024-08-20

Proofs 🧾: 22
 - 5 Created blocks 🍀
   (height1, height2, height3, height4, height5)
 - 8 Dummy blocks 💩

Search 🔎: 
 - average: 0.622s over 8987 searches
 - over 1s: 1721 occasions (19.1%)
 - over 5s: 0 occasions (0%)
 - over 15s: 0 occasions (0%)

Plots 🌱: 604 (+148)
Eligible plots 🏆: 33.07 average (Min: 12 / Max: 61)
```