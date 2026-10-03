import sqlite3

con = sqlite3.connect('/var/www/wasypro/server/dev.db')
con.execute("UPDATE User SET password = (SELECT password FROM User WHERE phone = '0999999999') WHERE phone = '0987654321'")
con.commit()
print("Updated password for 0987654321 to match 0999999999 (123456)")
con.close()
