import pandas as pd
import json

# Load the XLSX file
xlsx_file = 'Projects - RPCA.xlsx'
df = pd.read_excel(xlsx_file)

# Convert the DataFrame to JSON
json_data = df.to_json(orient='records')
json_obj = json.loads(json_data)


# Specify the output JSON file path
json_file = 'output.json'

# Save the JSON data to the file
with open(json_file, 'w') as file:
    json.dump(json_obj, file, indent=4)