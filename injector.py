import os
import sys
from bs4 import BeautifulSoup

os.chdir(os.path.dirname(os.path.realpath(__file__)))

files = [f for f in os.scandir("html") if f.name.endswith('.html')]
if len(files) < 1:
    print("Use https://pdf.online/convert-pdf-to-html to convert the PDF to HTML.\nPlace it in the /html folder before running.\nProgram defaults to the most recently modified HTML file.")
    sys.exit()
html_path = os.path.join('html', max(files, key=lambda x: x.stat().st_mtime).name)

with open(html_path, 'r') as f:
    html = BeautifulSoup(f, "html.parser")

extractor_script = html.select_one('#extractor-script')
if extractor_script != None:
    print(f'Script has already been injected into {html_path}.')
    sys.exit()

extractor_script = html.new_tag('script', src='../extractor.js', onload='extractor_onload()', id='extractor-script')
html.select_one('body').append(extractor_script)

with open(html_path, 'w') as f:
    f.write(str(html))

print(f'Script injected into {html_path}.')