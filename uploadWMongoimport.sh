#!/bin/bash

for tar_file in "$@"
do
    tar -x -f $tar_file --to-command 'zcat | mongoimport --db yt --collection meta --jsonArray -vvvvv --numInsertionWorkers=2'
done
