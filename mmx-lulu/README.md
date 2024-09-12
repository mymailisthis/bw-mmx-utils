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
  
  
## Custom log  
  
A custom log is saved inside `logs` folder with most important lines and new relevant information like effort in `Created block` lines and current farm space and netspace after each block for accurate calculations over the past data, like in the following example:

```
2024-09-12 11:00:09 [Harvester] INFO: [host] Found proof with score 61341 for height 737213, delay 2.568 sec
2024-09-12 11:06:58 [Harvester] INFO: [host] Found proof with score 13365 for height 737269, delay 2.303 sec
2024-09-12 11:07:56 [Node] INFO: 🤑 Created block at height 737269 with: ntx = dummy, score = 11325, reward = 0.5 MMX, fees = 0 MMX, took 0.01 sec
2024-09-12 11:32:09 [Harvester] INFO: [host] Found proof with score 29325 for height 737408, delay 3.626 sec
2024-09-12 12:13:09 [Harvester] INFO: [host] Found proof with score 18726 for height 737650, delay 42.09 sec
2024-09-12 12:27:40 [Harvester] INFO: [host] Found proof with score 9075 for height 737725, delay 2.673 sec
2024-09-12 12:28:38 [Node] INFO: 🤑 Created block at height 737725 with: ntx = 0, score = 9075, reward = 0.5 MMX, fees = 0 MMX, took 0.014 sec, effort = 642%
2024-09-12 12:28:38 Farmdata: {"netspace":"116729953520000000","farmspace":251021000000000}
2024-09-12 12:29:32 [Harvester] INFO: [host] Found proof with score 41942 for height 737759, delay 3.541 sec
2024-09-12 12:42:29 [Harvester] INFO: [host] Found proof with score 5844 for height 737920, delay 1.849 sec
```
  
  
#### Future features / Known issues
  
  - Alerts for inactive time / skipped heights  
  - Alerts for plots number increasing or decreasing  
    