import argparse, sys
from requests_oauthlib import OAuth1Session
import json, csv
import logging

logging.basicConfig(format='%(asctime)s - %(levelname)s - InventoryExport - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO, filename='er_activity.log')


class InventoryExport:
	def __init__(self, consumer_key, consumer_secret, token, token_secret):
		self.consumer_key = consumer_key
		self.consumer_secret = consumer_secret
		self.token = token
		self.token_secret = token_secret

	def get(self, url, realm):
		session = OAuth1Session(self.consumer_key,self.consumer_secret,self.token,self.token_secret,
			realm=realm,signature_method='HMAC-SHA256',signature_type='auth_header')
		return session.get(url,verify=True)

	def toCSV(self, results, with_header=False):
		csv_writer = csv.writer(sys.stdout,quoting=csv.QUOTE_NONE,quotechar='',escapechar='\\')
		logging.info('inventory_export # lines {0}'.format(len(results)))

		if (with_header and len(results) > 0):
			csv_writer.writerow([element.upper() for element in results[0].keys()])

		for result in results:
			csv_writer.writerow(result.values())

if __name__ == "__main__":   

	logging.info('inventory_export initiated')

  	# Initialize parser
	parser = argparse.ArgumentParser()
	 
	# Adding optional argument
	parser.add_argument("-u", "--url", required=True, help = "Endpoint url")
	parser.add_argument("-ck", "--consumer_key", required=True, help = "Consumer key")
	parser.add_argument("-cs", "--consumer_secret", required=True, help = "Consumer secret")
	parser.add_argument("-t", "--token", required=True, help = "Access token")
	parser.add_argument("-ts", "--token_secret", required=True, help = "Token secret")
	parser.add_argument("-r", "--realm", required=True, help = "Realm")
	parser.add_argument("-wh", "--with_header", required=False, action='store_true', help = "Add header to CSV file")
	 
	# Read arguments from command line
	args = parser.parse_args()

	inv = InventoryExport(args.consumer_key,args.consumer_secret,args.token,args.token_secret)
	response = inv.get(args.url, args.realm)
	logging.info('inventory_export response received')
	
	data = json.loads(response.text)
	inv.toCSV(data['results'], args.with_header)
	logging.info('inventory_export completed')
	
	exit(1)


