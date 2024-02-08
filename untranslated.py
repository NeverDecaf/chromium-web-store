import os
import json
# partly written by chatGPT
def find_untranslated_strings(directory):
    untranslated_strings = {}
    en = os.path.join(directory, 'en', 'messages.json')
    with open(en,'r', encoding='utf-8') as f:
        en_messages = json.load(f)
    all_keys = set(en_messages.keys())
    for lang_folder in os.listdir(directory):
        lang_path = os.path.join(directory, lang_folder)
        if os.path.isdir(lang_path):
            messages_path = os.path.join(lang_path, 'messages.json')
            if os.path.exists(messages_path):
                with open(messages_path, 'r', encoding='utf-8') as f:
                    messages = json.load(f)
                    keys = set(messages.keys())
                    if 'options_advanced' in messages:
                        print(lang_folder,messages['options_advanced'])
                    if len(all_keys - keys):
                        untranslated_strings[lang_folder] = all_keys - keys
    return untranslated_strings
def add_mtl_note(directory, lang, key):
    path = os.path.join(directory, lang, 'messages.json')
    with open(path, 'r', encoding='utf-8') as f:
        js = json.load(f)
    if key in js:
        js[key]['description'] = 'MTL'
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(js, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    extension_directory = "./src/"  # Update this with your extension directory
    locales_dir = os.path.join(extension_directory, '_locales')
    en = os.path.join(locales_dir, 'en', 'messages.json')
    with open(en,'r', encoding='utf-8') as f:
        en_messages = json.load(f)
    untranslated_strings = find_untranslated_strings(locales_dir)
    first = next(iter(untranslated_strings.keys()))
    print('strings for',first)
    for k in untranslated_strings[first]:
        en_messages[k]['description'] = 'MTL'
        print(f'"{k}": ', str(en_messages[k]).replace("'",'"'),',')