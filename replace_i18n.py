#!/usr/bin/env python3
### Replaces all usages of i18n for compatibility with android where locales are not loaded correctly in ungoogled-chromium
### Very crude implementation and may break without warning
### Important: If using placeholders in chrome.i18n.getMessage, the variable name used in your js MUST be the same as the name used in messages.json
import shutil
import json
import os
import fileinput
import re

ANDROID_SRC = './src_nolocale'
LOCALE = 'en'
MANIFEST = '{}/manifest.json'.format(ANDROID_SRC)
UPDATE_FILE_NAME = 'updates_nolocale.xml'
CRX_URL = 'https://github.com/NeverDecaf/chromium-web-store/raw/master/Chromium%20Web%20Store%20NoLocale.crx'

if os.path.exists(ANDROID_SRC):
    shutil.rmtree(ANDROID_SRC)
shutil.copytree('./src',ANDROID_SRC)

with open('{}/_locales/{}/messages.json'.format(ANDROID_SRC,LOCALE),'rb') as f:
    messages = json.load(f)

# blank localize.js
open(os.path.join(ANDROID_SRC,'scripts/localize.js'),'w')

for root, dirs, files in os.walk(ANDROID_SRC):
    # replace CSS and HTML files, as well as manifest.json:
    for name in filter(lambda f: f.lower().endswith(('.css','manifest.json','.html')),files):  
        with fileinput.FileInput(os.path.join(root, name), inplace=True) as file:
            for line in file:
                for repl, msg in messages.items():
                    line = line.replace('__MSG_{}__'.format(repl), msg['message'])
                print(line, end='')
    # replace Javascript files
    for name in filter(lambda f: f.lower().endswith('.js'),files):  
        with fileinput.FileInput(os.path.join(root, name), inplace=True) as file:
            for line in file:
                paramstring = re.search('(?<=chrome\.i18n\.getMessage\()([^\)]*)',line)
                if paramstring: # contained func
                    params = re.findall('([^,]+)',paramstring.group(1))
                    replacement = '"{}"'.format(messages[params[0].strip('\'"')]['message'])
                    if len(params) > 1:
                        # replace placeholders
                        for placeholder in params[1:]:
                            ph = placeholder.strip()
                            replacement = replacement.replace('${}$'.format(ph),'"+{}+"'.format(ph))
                    print(re.sub('chrome\.i18n\.getMessage\([^\)]*\)',replacement,line), end='')
                else:
                    print(line, end='')

# edit the manifest:
# 1. remove default_locale
# 2. change update_url
with open(MANIFEST,'rb') as f:
    manifest = json.load(f)
del manifest['default_locale']
manifest['update_url'] = manifest['update_url'].replace('updates.xml',UPDATE_FILE_NAME)
with open(MANIFEST,'w') as f:
    json.dump(manifest,f)

# copy updates.xml and modify to point to android crx
with open('updates.xml','r') as f:
    with open(UPDATE_FILE_NAME,'w') as f2:
        f2.write(re.sub("(?<=codebase=[\"'])([^'\"]*)",CRX_URL,f.read()))

# removes _locales dir
shutil.rmtree(os.path.join(ANDROID_SRC,'_locales'))
