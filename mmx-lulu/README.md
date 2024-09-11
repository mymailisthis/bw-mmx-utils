## MMX Lulu

This is a nodejs script based on *chiadog* that outputs notifications about your farm via *telegram* bot while tailing your node's logs.  
As log files change their names as day changes, this script also get new log file at midnight.  

*Lulu is the fancy name of my french dog that protects my MMX node* 😎  


NOTES:

- This project is based in MMX testenet12 logs
- requires NODEJS and NPM


### Install

1. Clone this repository

2. `npm install`

3. Create and fill your `.env` file based on `.env-sample`

### How to run
```
screen -S mmx-lulu
cd bw-mmx-utils/mmx-lulu
./mmx-lulu.js
```
 
`<Ctrl+A> + D` (to detach)  
`screen -r mmx-lulu` (to attach again)  


### Available notifications

 - Currently this script just notify block winnings


## Output sample

```
🍀 New block [#16] @ height: XXXXXX
score: 654, effort = 72% | reward: 0.5 MMX | fees: 0 MMX
```

Note: `#16` refers to the 16th block of the day, effort is relative to the previous block. If first block of the day this relation is made with the last block of the day before.


#### Future features / Known issues
  - Alerts for inactive time / skipped heights
  - Alerts for plots number increasing or decreasing