import sqlite3

con = sqlite3.connect('/var/www/wasypro/server/dev.db')
rows = con.execute("SELECT userId, fullName, phone, password, role FROM User WHERE phone = '0987654321'").fetchall()
for r in rows:
    print(r)
con.close()
