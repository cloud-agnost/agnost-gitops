import json
import os

app_env_list = ['ENGINE_CORE', 'ENGINE_MONITOR', 'ENGINE_REALTIME', 'ENGINE_SCHEDULER',
                'ENGINE_WORKER','PLATFORM_CORE', 'PLATFORM_SYNC', 'PLATFORM_WORKER', 'STUDIO']

released_app_list = []
details_list = []

for env in app_env_list:
    if os.environ[env] != 'no-change':
        # add app to the update list
        app = env.lower().replace('_', '/')
        released_app_list.append(app)

        # get app's current version
        package_json_file = os.path.join('.', app, 'package.json')
        with open(package_json_file) as fp:
            package_json = json.load(fp)
        current_app_version = package_json['version'].replace('v', '')

        # create new version and save
        command = 'semver next ' + os.environ[env] + ' ' + current_app_version
        released_app_version = os.popen(command).read().strip()
        details_list.append({"application": app, "version": 'v' + released_app_version})

released_apps = str(released_app_list).replace(' ', '').replace('\'', '\\"')
details = json.dumps(details_list, separators=(',', ':')).replace('"', '\\"')

# New release version
latest_release_file = os.path.join('.', 'releases', 'latest.json')
with open(latest_release_file) as fp:
    latest_json = json.load(fp)
current_release_number = latest_json['release'].replace('v', '')
command = 'semver next ' + os.environ['RELEASE_TYPE'] + ' ' + current_release_number
release_number = 'v' + os.popen(command).read().strip()

print("{} {} {}".format(released_apps, details, release_number))
