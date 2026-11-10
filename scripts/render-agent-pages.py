from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin
import re
p=Path(__file__).resolve().parents[1]/'public'
base='https://demi-studio.demihchong.workers.dev/'
class Node:
 def __init__(self,tag='',attrs=None):self.tag=tag;self.attrs=dict(attrs or []);self.children=[]
class Parser(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.root=Node();self.stack=[self.root]
 def handle_starttag(self,t,a):
  n=Node(t,a);self.stack[-1].children.append(n)
  if t not in ['img','meta','link','br','hr','input','source','wbr']:self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,d):self.stack[-1].children.append(d)
def find(n,t):
 if not isinstance(n,Node):return None
 if n.tag==t:return n
 for c in n.children:
  f=find(c,t)
  if f:return f
def render(n,url):
 if isinstance(n,str):return ' '.join(n.split())+' ' if n.strip() else ''
 if n.tag in ['script','style','svg','button','noscript'] or n.attrs.get('aria-hidden')=='true':return ''
 if n.tag=='img':return '\n\nImage: '+n.attrs.get('alt','')+'\n\n'
 if n.tag=='br':return '\n'
 text=''.join(render(c,url) for c in n.children).strip()
 if not text:return ''
 if n.tag=='a':return '['+text+']('+urljoin(url,n.attrs.get('href',''))+') '
 if n.tag in ['h1','h2','h3','h4']:return '\n\n'+'#'*int(n.tag[1])+' '+text+'\n\n'
 if n.tag=='li':return '\n- '+text+'\n'
 if n.tag=='summary':return '\n\n### '+text+'\n\n'
 if n.tag in ['p','section','article','div','ul','ol','details','main','nav']:return '\n\n'+text+'\n\n'
 return text+' '
for f in p.rglob('*.html'):
 q=Parser();q.feed(f.read_text());main=find(q.root,'main') or q.root;url=urljoin(base,str(f.relative_to(p)))
 text=render(main,url)
 import re
 text=re.sub(r'\n[ \t]+','\n',text);text=re.sub(r'\n{3,}','\n\n',text).strip()
 if 'versions' in f.parts:text='# Historical design snapshot\n\nThis is an archived page. Use the current [portfolio]('+base+') for Demi’s profile.\n\n'+text
 text+='\n\n---\nSource: '+url+'\n'
 f.with_suffix('.md').write_text('\n'.join(line.rstrip() for line in text.splitlines())+'\n')
