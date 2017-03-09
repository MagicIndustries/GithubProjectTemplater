# Github Project Templater

Allows setup of a new repo with issues, labels and milestones cleared out and set from json files.

## Installation
```bash
$ git clone git@github.com:MagicIndustries/projecttemplater
$ cd projecttemplater
$ npm install
```

## Configuration
- edit the config in /config/index.js
- edit the files to enter your own preset list of issues, labels and milestones:
  - /data/issues.json
  - /data/labels.json
  - /data/milestones.json

## Usage
```bash
$ node src/index.js
