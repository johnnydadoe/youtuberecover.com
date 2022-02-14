### Prerequisites
* nodejs
* npm  
* mongodb and mongoimport
* unix like shell
* python3 and pymongo

### Installation

1. Install mongodb https://docs.mongodb.com/manual/administration/install-on-linux/
2. Create new collection with zstd block compressor
   ```sh
   mongo
   ```
   ```mongodb
   use yt

   db.createCollection( "meta", { storageEngine: { wiredTiger: { configString: "block_compressor=zstd" }}})

   db.meta.createIndex( {view_count: -1})
   db.meta.createIndex( {id: 1})
   db.meta.createIndex( {uploader_id: 1})

   exit
   ```
3. install pymongo
   ```
   apt install python3-pip
   pip3 install pymongo
   chmod +x pyUpload.py
   ```
4. download the tar files from https://archive.org/details/Youtube_metadata_02_2019
5. insert all metadata videos
   ```
   bash uploadWMongoimport.sh *.tar
   ```
   or only videos with aleast viewcount on 1000 
   ```
   bash uploadWPython.sh *.tar
   ```
6. install npm dependencies
   ```
   npm install
   ```
## Usage

Change port number in file conf.json

Run application
```
node index.js
```
