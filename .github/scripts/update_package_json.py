import sys
import json
import os

applications = json.loads(sys.argv[1])

for app in applications:
    package_json_file = os.path.join('.', app['application'], 'package.json')
    with open(package_json_file) as fp:
        package_json = json.load(fp)
    
    package_json['version'] = app['version']

    with open(package_json_file, 'w', encoding='utf8') as fp:
        fp.write(json.dumps(package_json, indent=3, ensure_ascii=False))
