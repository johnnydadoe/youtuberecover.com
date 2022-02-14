const Express = require("express");
const fs = require('fs');
//const MongoClient = require('mongodb').MongoClient;
const { MongoClient } = require("mongodb");

var configFile = JSON.parse(fs.readFileSync(__dirname + '/conf.json', 'utf8'));

const port = configFile.http_port;
const db_url = configFile.mongo_connectionstring

var app = Express();

app.set('view engine', 'ejs');
app.set('x-powered-by', false);

var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Database Name
const dbName = 'yt';
const client = new MongoClient(db_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


const url = require('url');
const querystring = require('querystring');

//collection Name
const collectionName = 'meta'
const options = JSON.parse(fs.readFileSync(__dirname + '/options.json', 'utf-8'));

// Use connect method to connect to the server
var db;

client.connect(function(err) {
    db = client.db(dbName);
});

app.listen(port, () => console.log(`App listening on port ${port}!`))

app.get('/favicon.ico', function(req, res) {
    res.status(200).sendFile(__dirname + '/static/favicon.ico');
});

app.get('/bootstrap.min.css', function(req, res) {
    res.status(200).sendFile(__dirname + '/static/bootstrap.min.css');
});

app.get('/style.css', function(req, res) {
    res.sendFile(__dirname + '/static/style.css');
});

app.get('/robots.txt', function(req, res) {
    res.status(200).sendFile(__dirname + '/static/robots.txt');
});


app.get("/", function(req, res) {
    db.collection(collectionName).estimatedDocumentCount().then(function(records) {
        res.status(200).render('index', { count: records.toLocaleString() })
    });
});


app.get('/top', function(req, res) {
   
    var vidPromise = db.collection(collectionName).find( {}, {"view_count": 1, "title": 1, "upload_date": 1, "id": 1, "uploader_id": 1}).sort({"view_count": -1}).limit(200).toArray()


    
    vidPromise.then(vids => {

        for (let i = 0; i < vids.length; i++) {
            vids[i] = humanReaderParser(vids[i])
        }

        res.status(200).render('top.ejs', {"listVids": vids })
    });

    
})


app.get('/channel', function(req, res) {
   
    var k = req.query["id"]
    
    if (k == null) {
        res.status(404).send("channel id not found")
        return
    }

    var channelPromise = db.collection(collectionName).find( {uploader_id: k}, {"view_count": 1, "title": 1, "upload_date": 1, "id": 1, "uploader_id": 1}).sort({"view_count": -1}).limit(125).toArray()

    
    channelPromise.then(vids => {

        if (vids.length == 0) {
            res.status(404).send("channel id not found")
            return;
        }
        for (let i = 0; i < vids.length; i++) {
            vids[i] = humanReaderParser(vids[i])
        }
        

        res.status(200).render('top.ejs', {"listVids": vids })

        
    });


    
})


app.get('/watch', function(req, res) {

	if (req.originalUrl.length > 140) {
		res.status(404).send("404 not found")
		return;
	}

	var id = ''
	var found = false
	for (const key in req.query) {
  		if (key === 'v') {
  			
  			id = req.query[key]
  			found = true;
  			break
  		}
	}

	if (!found) {
		res.status(404).render('indexMsg', {
            type: 'err',
            msg: 'Not understood'
        });
		return;
	}

	if (id.substring(0, 8) === 'https://') {
		id = id.substring(8)
	} else if (id.substring(0, 7) === 'http://') {
		id = id.substring(7)
	}

	if (id.substring(0, 4) === 'www.') {
		id = id.substring(4)
	}

	if (id.substring(0, 9) === 'youtu.be/') {
		res.redirect('watch?v=' + id.substring(9))
		return;
	}
		
	if (id.substring(0, 12) === 'youtube.com/') {
		res.redirect(id.substring(12))
			return;
	} 

	
	var vidPromise = db.collection(collectionName).findOne({ id: id })

    vidPromise.then(vid => {
        if (vid == undefined) {
            res.status(404).render('indexMsg', {
                type: 'err',
                msg: 'not found'
            });
        }
        else {
            //res.send(vid)
            
            
            res.status(200).render('indexTable', {
                data: humanReaderParser(vid),
                options: options
            });
            
        }    
    });
    
});


app.get("/json/*", function(req, res) {

    requestedId = req.originalUrl.substring(6)
    
    var vidPromise = db.collection(collectionName).findOne({ id: requestedId })

    vidPromise.then(vid => {
        if (vid == undefined) {
            res.status(404).send("not found")
        }
        else {
            res.header("Content-Type", "application/json");
            delete vid['_id']
            res.status(200).send(JSON.stringify(vid, null, 2))
        }    
    });
});

app.get("/*", function(req, res) {
    res.status(404).send("404 not found")
});

function humanReaderParser(vid) {

    if ('view_count' in vid) {
        vid['view_count'] = vid['view_count'].toLocaleString()
    }

    if ('dislike_count' in vid) {
        vid['dislike_count'] = vid['dislike_count'].toLocaleString()
    }

    if ('like_count' in vid) {
        vid['like_count'] = vid['like_count'].toLocaleString()
    }

    if ('duration' in vid) {
        originalTime = vid['duration']
        vid['duration'] = Math.floor(vid['duration'] / 60) % 60 + ':' + (vid['duration'] % 60).toString().padStart(2, '0')

        if (originalTime >= 60 * 60) {
            vid['duration'] = Math.floor(originalTime / (60 * 60)) + ':' + vid['duration']
        }
    }

    if ('upload_date' in vid) {
        vid['upload_date'] = vid['upload_date'].substring(0, 4) + '-' + vid['upload_date'].substring(4, 6) + '-' + vid['upload_date'].substring(6, 8)
    }

    if ('fetch_date' in vid) {
        var d = '' + vid['fetch_date']

        vid['fetch_date'] = d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8) +
            ' ' + d.substring(8, 10) + ':' + d.substring(10, 12) + ':' + d.substring(12, 14)

    
    }

    if ('tags' in vid) {

        vid['tags'] = vid['tags'].join(', ');

    }
            


    if ('age_limit' in vid) {

        if (vid['age_limit'] == 0) {
            vid['age_limit'] = 'None'
        }
    }
    var booleanKeys = ["allow_embed", "is_crawlable", "allow_sub_contrib", "is_live_content", "is_ads_enabled", "is_comments_enabled"]
    for (var i in booleanKeys) {

        var key = booleanKeys[i]

        if (key in vid) {
            vid[key] ? vid[key] = 'Yes' : vid[key] = 'No'
        }
    }

    vid['source'] = 'Jopik1\'s youtube metadata crawl'

    return vid;
}
