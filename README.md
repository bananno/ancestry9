# Lundberg Ancestry

Genealogy research is one of my favorite hobbies. There are many existing websites and services for research and organization. I built this tool to consolidate all of my research according to my own preferences.

For privacy reasons, the full database is not available online. I use this tool for organizing, then a separate website for sharing parts of the data: [github.com/bananno/acpancestry](https://github.com/bananno/acpancestry), online at [https://ancestry.annacpeterson.com/](https://ancestry.annacpeterson.com/).

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
