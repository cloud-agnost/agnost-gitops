import sys
import json
import os
from ruamel.yaml import YAML

yaml=YAML()
yaml.preserve_quotes = True
values_yaml = "base/values.yaml"
chart_yaml = "base/Chart.yaml"
applications = json.loads(sys.argv[1])

## Update values.yaml with the new image tags
values_data = yaml.load(open(values_yaml).read())

for app in applications:
    if app['application'] == 'engine/core':
        ## engine-core is not part of the helm chart
        continue
    if '/' in app['application']:
        app_type, app_name = app['application'].split('/')
        values_data[app_type][app_name]['tag'] = app['version']
    else:
        app_name = app['application']
        values_data[app_name]['tag'] = app['version']

with open(values_yaml, 'w') as outfile:
    yaml.dump(values_data, outfile)

## Update Chart.yaml with a new version
chart_data = yaml.load(open(chart_yaml).read())
command = 'semver next ' + os.environ['RELEASE_TYPE'] + ' ' + chart_data['version']
chart_data['version']  = os.popen(command).read().strip()

chart_data['appVersion'] = os.environ['RELEASE_NUMBER']

with open(chart_yaml, 'w') as outfile:
    yaml.dump(chart_data, outfile)
