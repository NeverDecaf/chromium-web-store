#!/usr/bin/env python3
### Replaces all usages of i18n for compatibility with android where locales are not loaded correctly in ungoogled-chromium
### Very crude implementation and may break WITHOUT WARNING
### Important: If using placeholders in chrome.i18n.getMessage, the order of the placeholder args must exactly match the order of the placeholders in the string. For example: i18.getMessage("this $1$ example $2$",var1, var2)
import shutil
import json
import os
import fileinput
import re

LOCALE = 'en'
ANDROID_SRC = './{}_nolocale'.format(LOCALE)
MANIFEST = '{}/manifest.json'.format(ANDROID_SRC)
UPDATE_FILE_NAME = 'updates_{}_nolocale.xml'.format(LOCALE)
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
        with open(os.path.join(root, name),'r') as f:
            contents = f.read()
        def replf(match):
            params = re.findall('([^,]+)',match.group(1))
            params = [a.strip() for a in params]
            replacement = '"{}"'.format(messages[params[0].strip('\'"')]['message'])
            if len(params) > 1:
                # replace placeholders
                for placeholder in params[1:]:
                    ph = placeholder.strip()
                    replacement = re.sub('\$[^\$]+\$','"+{}+"'.format(ph),replacement,count = 1)
            return replacement
        with open(os.path.join(root, name),'w') as f:
            f.write(re.sub('chrome\.i18n\.getMessage\(([^\)]*)\)',replf,contents))

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
        f2.write(f.read())
        # f2.write(re.sub("(?<=codebase=[\"'])([^'\"]*)",CRX_URL,f.read()))

# removes _locales dir
shutil.rmtree(os.path.join(ANDROID_SRC,'_locales'))
