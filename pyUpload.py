#!/usr/bin/env python3

import sys
import json
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client.yt # Database name
meta = db.meta # Collection name

b = json.loads(sys.stdin.read())
c = []

for vid in b:
	if vid.get("view_count") is None:
		print("WARNING: view_count not found", vid)
		break
	if vid.get("view_count") >= 1000:
		c.append(vid)


if len(c) > 0:
	meta.insert_many(c)
print(len(c), "uploaded")
