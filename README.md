# Lundberg Ancestry

Genealogy research is one of my favorite hobbies. There are many existing websites and services for research and organization. I built this tool to consolidate all of my research according to my own preferences.

For privacy reasons, the full database is not available online. I am building a separate a separate app for sharing my data: [acpancestry](https://github.com/bananno/acpancestry), which is hosted at [elasticbeanstalk.com](http://ancestry.cp3msbrmnj.us-west-2.elasticbeanstalk.com/).

## Run locally

Setup & install:
```
git clone git@github.com:bananno/ancestry9.git
cd ancestry9
npm install
```

Start database & server in two separate windows:
```
mongod
npm start
```

Open browser:
```
http://localhost:9000/
```
