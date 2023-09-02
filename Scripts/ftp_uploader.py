import argparse, sys
import pysftp
import logging
import os

logging.basicConfig(format='%(asctime)s - %(levelname)s - FtpUploder - %(message)s', datefmt='%d-%b-%y %H:%M:%S', level=logging.INFO, filename='er_activity.log')


if __name__ == "__main__":   

	logging.info('ftp upload initiated')

  	# Initialize parser
	parser = argparse.ArgumentParser()
	 
	# Adding optional argument
	parser.add_argument("-hn", "--host_name", required=True, help = "Host Name")
	parser.add_argument("-u", "--user_name", required=True, help = "User Name")
	parser.add_argument("-p", "--password", required=True, help = "Password")
	parser.add_argument("-f", "--file", required=True, help = "File Name")
	parser.add_argument("-d", "--directory", required=True, help = "Directory")
	 
	# Read arguments from command line
	args = parser.parse_args()

	cnopts = pysftp.CnOpts()
	cnopts.hostkeys = None 

	with pysftp.Connection(host=args.host_name, username=args.user_name, password=args.password, cnopts=cnopts) as sftp:
		logging.info("Connection successfully established with {0}... ".format(args.host_name))

		# Switch to a remote directory
		sftp.cwd(args.directory)
		logging.info("Switch to directory {0} successfully".format(args.directory))

		# upload file
		sftp.put(args.file, args.file)  # upload file
		logging.info("Upload file {0} successfully".format(args.file))

		# Obtain structure of the remote directory
		#directory_structure = sftp.listdir_attr()

		# Print all files
		#for attr in directory_structure:
			#logging.info('Found file/folder {0}'.format(attr.filename))
			#sftp.get(attr.filename, print('output/{0}'.format(os.path.basename(attr.filename))))
			#sftp.remove('')

	logging.info('ftp upload done')