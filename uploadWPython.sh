#!/bin/bash

for tar_file in "$@"
do
    tar -x -f $tar_file --to-command 'zcat | ./pyUpload.py'
done
