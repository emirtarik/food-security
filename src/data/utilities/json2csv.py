import csv
import json

# Read the JSON data from a file
with open('input.json', 'r') as json_file:
    data = json.load(json_file)

# Specify the CSV output file
csv_file = 'output.csv'

# Extract column names dynamically from the JSON data
column_names = set()
for item in data:
    column_names.update(item.keys())

# Write the data to a CSV file
with open(csv_file, 'w', newline='') as csv_file:
    writer = csv.DictWriter(csv_file, fieldnames=sorted(column_names))
    writer.writeheader()
    for item in data:
        writer.writerow(item)
