import argparse, sys
import pymysql
import sys
import logging

logging.basicConfig(format='%(asctime)s - %(levelname)s - InventoryImport - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO, filename='er_activity.log')

class InventoryImport:
  def __init__(self, host, username, password):
  	self.host = host
  	self.username = username
  	self.password = password

  def importCSV(self, filename):
  	load_sql = "LOAD DATA LOCAL INFILE '" + filename + "' INTO TABLE er_stage_inventory FIELDS TERMINATED BY ',' LINES TERMINATED BY '\r\n' (item,design,in_stock,in_transit,in_transit_eta,on_loom,on_loom_eta);"

  	try:
  		con = pymysql.connect(host=self.host,user=self.username,password=self.password,autocommit=True,local_infile=1)
  		logging.info('Connected to DB: {}'.format(self.host))

  		con.select_db('rugs')

  		# Create cursor and execute Load SQL
  		cursor = con.cursor()

  		cursor.execute('TRUNCATE er_stage_inventory;')
  		logging.info('Succuessfully truncating staging table.')

  		cursor.execute(load_sql)
  		logging.info('Succuessfully loaded staging table from csv.')

  		cursor.execute('call er_update_inventory();')
  		logging.info('Succuessfully executing er_update_inventory().')

  		con.close()
  	except Exception as e:
  		logging.error(str(e))

if __name__ == "__main__":
  logging.info('inventory_import initiated')

  # Initialize parser
  parser = argparse.ArgumentParser()

  # Adding optional argument
  parser.add_argument("-dh", "--host", required=True, help = "Database Host")
  parser.add_argument("-u", "--user_name", required=True, help = "User Name")
  parser.add_argument("-p", "--password", required=True, help = "Password")
  parser.add_argument("-f", "--file", required=True, help = "File Name")

  # Read arguments from command line
  args = parser.parse_args()

	# Load CSV to DB
  inv = InventoryImport(args.host,args.user_name,args.password)
  inv.importCSV(args.file)
  logging.info('inventory_import completed')
