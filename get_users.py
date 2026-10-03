import sqlite3

con = sqlite3.connect('/var/www/wasypro/server/dev.db')
rows = con.execute("SELECT userId, fullName, phone, role, isBankLocked FROM User WHERE role = 'ctv' LIMIT 10").fetchall()
for r in rows:
    print(r)
con.close()
