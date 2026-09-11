"""Rebuild España text-only reference/manifests; no database writes or imagery."""
import csv, copy, json, re, sys
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
BASE=Path(__file__).parent
ROOT=BASE.parents[2]
SOURCE=Path('/home/czechspekk/Downloads/NEW ROCKBUSTERS WEBSITE - HTML /TRIP-COURSE/TRIPS-COURSES')
def extract(source):
 """Extract text and semantic heading accents; never persist source CSS or imagery."""
 s=BeautifulSoup(source.read_text(),'html.parser')
 def txt(n): return n.get_text(' ',strip=True) if n else ''
 def one(sel, root=s): return txt(root.select_one(sel))
 def parts(n):
  out=[]; br=False
  def walk(node,accent=False):
   nonlocal br
   if isinstance(node,NavigableString):
    value=re.sub(r'\s+',' ',str(node))
    if value: out.append({'text':value,'accent':accent,'breakBefore':br}); br=False
   elif node.name=='br': br=True
   else:
    accent=accent or node.name=='em' or 'var(--red)' in node.get('style','')
    for child in node.children: walk(child,accent)
  walk(n)
  if out: out[0]['text']=out[0]['text'].lstrip();out[-1]['text']=out[-1]['text'].rstrip()
  return [x for x in out if x['text']]
 sections={}
 selectors={'overview':'.overview-left','dates':'.schedule-block','gallery':'.gallery-intro','audience':'.who-section','learning':'.pillars-header','itinerary':'.programme-grid > div:first-child','comparison':'.programme-grid > div:last-child','venue':'.location-text','team':'.coaches-section','reviews':'.testimonials-grid','logistics':'.logistics-section','package':'.included-grid','faq':'.faq-section','booking':'.book-content'}
 for key,sel in selectors.items():
  node=s.select_one(sel)
  if key in ['reviews','package']: node=node.parent
  h=node.select_one('h2,h3'); eyebrow=node.select_one('.eyebrow,.gallery-kicker')
  sections[key]={'key':key,'eyebrow':txt(eyebrow),'heading':txt(h),'headingParts':parts(h)}
 for key,sel in [('dates','.schedule-intro'),('gallery','.gallery-intro-right'),('itinerary','.programme-grid > div:first-child > p'),('comparison','.programme-grid > div:last-child > p'),('booking','.book-content > p')]: sections[key]['intro']=one(sel)
 sections['overview']['intro']='\n\n'.join(txt(x) for x in s.select('.overview-left > p'))
 def facts(sel,prefix): return [{'label':one('.'+prefix+'-label',n),'value':one('.'+prefix+'-value',n),'description':one('.'+prefix+'-sub',n)} for n in s.select(sel)]
 r={'version':1,'classification':'local design comparison content; not canonical seed','sourceFile':source.name,'target':{'eventId':8,'eventSlug':'sport-climbing','eventDateId':745,'dateFrom':'2026-09-26','dateTo':'2026-10-10'},'sections':list(sections.values()),'hero':{'titleParts':parts(s.h1),'description':one('.hero-sub'),'hashtag':next(txt(p) for p in s.select('.hero-text-col p') if txt(p).startswith('#')),'primaryLabel':one('.hero-actions .btn-primary'),'secondaryLabel':one('.hero-actions .btn-secondary'),'sourceSecondaryHref':s.select_one('.hero-actions .btn-secondary')['href']},'overview': [txt(x) for x in s.select('.overview-left > p')],'overviewFacts':facts('.overview-stat','overview-stat'),'strip':[{'value':one('.strip-num',x),'label':one('.strip-text',x)} for x in s.select('.strip-item')],'summary':{'rows':facts('.hero-card-row','hero-card'),'price':one('.hero-card-price'),'travelNote':one('.hero-card-highlight'),'ctaLabel':one('.hero-card-cta')},'audienceCards':[{'heading':one('h3',x),'body':one('p',x)} for x in s.select('.who-card')],'pillars':[{'heading':one('h3',x),'headingParts':parts(x.h3),'bullets':[{'text':txt(li)} for li in x.select('li')]} for x in s.select('.pillar')],'dailySchedule':[{'time':one('.time',x),'title':one('strong',x),'description':one('.time-desc',x).replace(one('strong',x),'',1).strip()} for x in s.select('.time-block')],'comparison':{'columns':[txt(th) for th in s.select('.week-comparison th')],'rows':[{'label':txt(tds[0]),'left':txt(tds[1]) or ('✓' if 'check' in tds[1].get('class',[]) else ''),'right':txt(tds[2]) or ('✓' if 'check' in tds[2].get('class',[]) else '')} for tr in s.select('.week-comparison tbody tr') if (tds:=tr.select('td'))]},'venue':{'paragraphs':[{'text':txt(p)} for p in s.select('.location-text > p')],'facts':facts('.location-facts .fact','fact')},'coaches':[{'name':one('.coach-name',x),'role':one('.coach-title',x),'bio':one('.coach-bio',x)} for x in s.select('.coach-card')],'previewReviews':[{'quote':one('.testimonial-text',x),'reviewerName':'[Design preview] '+one('.testimonial-author',x)} for x in s.select('.testimonial')],'practicalCards':[{'heading':one('h3',x),'body':one('p',x)} for x in s.select('.logistics-card')],'packageItems':[{'text':txt(x)} for x in s.select('.included-item')],'packageNote':one('.included-grid + p'),'faqs':[{'question':one('.faq-q',x),'answer':one('.faq-a',x)} for x in s.select('.faq-item')],'closingSupport':one('.book-note'),'closingPrimaryLabel':one('.book-actions .btn-primary'),'scheduleReference':[{'text':txt(x),'links':[{'text':txt(a),'href':a['href']} for a in x.select('a[href]')]} for x in s.select('.schedule-row')]}
 return locals()

def rich(texts):
 return {'root':{'type':'root','version':1,'format':'','indent':0,'direction':None,'children':[{'type':'paragraph','version':1,'format':'','indent':0,'direction':None,'children':[{'type':'text','text':t,'version':1,'format':0,'detail':0,'mode':'normal','style':''}],'textFormat':0,'textStyle':''} for t in texts]}}
refs=[]; manifests=[]
rows=list(csv.DictReader((ROOT/'docs/superpowers/plans/2026-09-11-trip-detail-customization-catalogue.csv').open()))
for row in rows:
 if not row['file'].startswith('PROJECT ESPANA/'):continue
 scope=extract(SOURCE/row['file'])
 r=scope['r'];s=scope['s'];txt=scope['txt'];one=scope['one'];parts=scope['parts']
 r['sourceFile']=row['file'];r['target']={'eventId':int(row['event_id']),'eventSlug':row['event_slug'],'eventDateId':int(row['selected_active_id']),'dateFrom':row['from'],'dateTo':row['to']}
 r['heroMeta']=[txt(n) for n in s.select('.hero-meta-item')]
 r['summary']['priceCaption']=one('.per-person');r['summary']['alternatePrice']=one('.amount-2w')
 r['overviewLinks']=[{'label':txt(a),'href':a.get('href')} for a in s.select('.overview-left a[href]')]
 r['closingBadges']=[txt(n) for n in s.select('.price-badge')]
 r['allSectionText']=[{'index':i,'text':txt(n)} for i,n in enumerate(s.select('section'))]
 refs.append(copy.deepcopy(r));e={'clearContentFields':['additionalInfo','content'],'sections':r['sections'],'hero':{'titleParts':r['hero']['titleParts'],'description':r['hero']['description'],'hashtag':r['hero']['hashtag'],'primaryLabel':r['hero']['primaryLabel'],'secondaryLabel':r['hero']['secondaryLabel'],'secondaryTarget':'programme'},'booking':{'primaryLabel':re.sub(r'€[\d,]+','{price}',r['closingPrimaryLabel']),'support':r['closingSupport']},'dailySchedule':r['dailySchedule'],'overviewFacts':r['overviewFacts'],'venue':r['venue'],'practicalCards':r['practicalCards'],'packageItems':r['packageItems'],'packageNote':r['packageNote'],'faqs':r['faqs'],'previewReviews':[{'name':n['reviewerName'],'quote':n['quote'],'context':'Design preview — unverified source testimonial'} for n in r['previewReviews']],'coachProfiles':[{'guide':34,'role':n['role'],'bio':n['bio']} for n in r['coaches']],'factsStrip':r['strip'],'summaryRows':r['summary']['rows']}
 e['actions']={'overviewLabel':re.sub(r'€[\d,]+','{price}',r['overviewLinks'][0]['label']),'summaryLabel':r['summary']['ctaLabel']}
 title=''.join((' ' if p.get('breakBefore') else '')+p['text'] for p in r['hero']['titleParts'])
 # Overview paragraphs use the same structured content slot as other trip families.
 e['content']={'title':title,'shortDescription':r['hero']['description'],'audienceCards':r['audienceCards'],'whatYouLearn':{},'tripDetail':{'locationDescriptor':r['strip'][0]['label'],'gradeRange':'6a indoor / 5 outdoor','leadRequirement':'Lead 6a indoor / 5 outdoor','minimumParticipants':3,'priceCaption':r['summary']['priceCaption'],'travelNote':r['summary']['travelNote'],'hashtag':r['hero']['hashtag']}}
 overview=next(section for section in e['sections'] if section['key']=='overview')
 paragraphs=overview.pop('intro','').split('\n\n')
 e['content']['tripDetail']['sections']=[{'kind':'overview','heading':overview.get('heading') or ''.join(p['text'] for p in overview.get('headingParts',[])),'body':{'root':{'type':'root','version':1,'format':'','indent':0,'direction':None,'children':[{'type':'paragraph','version':1,'format':'','indent':0,'direction':None,'children':[{'type':'text','version':1,'text':paragraph,'format':0,'detail':0,'mode':'normal','style':''}]} for paragraph in paragraphs if paragraph]}}}]
 for i,p in enumerate(r['pillars'],1):e['content']['whatYouLearn'][f'box{i}Heading']=p['heading'];e['content']['whatYouLearn'][f'box{i}Bullets']=p['bullets']
 e['companion']={'columns':[{'label':re.sub(r'\s*€[\d,]+','',h)} for h in r['comparison']['columns']],'rows':[{'cells':[{'text':n['label']},{'text':n['left']},{'text':n['right']}]} for n in r['comparison']['rows']]}
 # Companion navigation uses the audited local catalogue, never legacy order URLs.
 e['companion']['links']=[{'label':other['design'].replace('PROJECT ESPAÑA 2027 ',''),'href':'/trips/'+other['event_slug']+'?date='+other['selected_active_id'],'description':other['from']+' – '+other['to']} for other in rows if other['file'].startswith('PROJECT ESPANA/') and other['selected_active_id']!=row['selected_active_id']]
 adaptations=[]
 for f in e['overviewFacts']:
  if f['label'] in ['Duration','Location','Coach','Coaches','Price']:f['value']={'Duration':'{durationDays} Days','Location':'{location}','Coach':'{coaches}','Coaches':'{coaches}','Price':'{price}'}[f['label']]
  if f['label']=='Group Size':f['value']='Maximum {capacity}'
  if '€' in f.get('description',''):f['description']=re.sub(r'€[\d,]+\s*','',f['description'])
 for f in e['factsStrip']:
  if '€' in f['value']:f['value']='{price}'
  f['label']=re.sub(r' \(or €[\d,]+/week\)','',f['label'])
  if f is e['factsStrip'][0]:f['value']='{location}'
  if f is e['factsStrip'][1]:f['value']='{dates}';f['label']='{durationDays} Days'
 for f in e['summaryRows']:
  if f['label'] in ['Location','Coach','Coaches']:f['value']={'Location':'{location}','Coach':'{coaches}','Coaches':'{coaches}'}[f['label']]
  if f['label']=='Dates':f['value']='{dates}'
  if f['label']=='Duration':f['value']=re.sub(r'^\d+ Days','{durationDays} Days',f['value'])
 food='Food arrangements and any included meals are confirmed before departure.'
 for f in e['faqs']:
  if f['question']=='Is food included?':adaptations.append({'reason':'Source FAQ meal inclusion conflicts with flexible-food package wording.','from':f['answer'],'to':food});f['answer']=food
  if '€' in f['answer']:
   before=f['answer'];f['answer']=re.sub(r' for €[\d,]+','',f['answer']);adaptations.append({'reason':'Alternative occurrence price is not the selected occurrence price.','from':before,'to':f['answer']})
 e['packageNote']=re.sub(r'Food is flexible.*$',food,e['packageNote'])
 adaptations.extend([{'reason':'Commercial facts remain selected-occurrence projections.','change':'Price, capacity, duration, location and coach facts use live tokens. Alternate occurrence prices retained only in reference; comparison columns retain format names.'},{'reason':'Source guide is already assigned to all five occurrences.','change':'Read-only current relationship check verified Guide34 Arturo Aparicio on EventDates747–751.'},{'reason':'Source testimonials are unverified.','change':'Visible Design preview attribution; no review records created.'}])
 expected=[]
 non_display={'key','kind','type','version','format','textFormat','textStyle','detail','mode','style','direction','indent','visibility','secondaryTarget','clearContentFields','href','id','guide'}
 def strings(x):
  if isinstance(x,str):
   if x.strip():expected.append(x)
  elif isinstance(x,list):
   for n in x:strings(n)
  elif isinstance(x,dict):
   for k,n in x.items():
    if k not in non_display:strings(n)
 strings(e)
 manifests.append({'sourceFile':r['sourceFile'],'target':r['target'],'editorial':e,'provenance':{'classification':'temporary local design comparison content','marker':'trip-editorial-'+str(r['target']['eventDateId']),'sourceReference':'../references/espana.json','adaptations':adaptations,'sourceSchedule':r['scheduleReference'],'sourceAlternatePrice':r['summary']['alternatePrice'],'sourceClosingBadges':r['closingBadges'],'sourceOverviewLinks':r['overviewLinks'],'commercialBoundary':'No booking data, relationship, imagery, or canonical seed change.'},'expectedText':list(dict.fromkeys(expected))})
(BASE/'references/espana.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2)+'\n')
(BASE/'manifests/espana.json').write_text(json.dumps(manifests,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'references':len(refs),'manifests':len(manifests),'expectedText':sum(len(m['expectedText']) for m in manifests)}))
