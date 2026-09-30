#!/bin/bash
cd /var/www/wasypro/server
echo 'SELECT * FROM User WHERE phone="0933893541";' | sqlite3 dev.db
