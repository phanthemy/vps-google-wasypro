import sqlite3

con = sqlite3.connect('/var/www/wasypro/server/dev.db')
rows = con.execute("SELECT userId, fullName, phone, password FROM User WHERE phone IN ('0937353535', '0968616263', '0999999999')").fetchall()
for r in rows:
    print(r[0], r[1], r[2], r[3][:15])
con.close()
