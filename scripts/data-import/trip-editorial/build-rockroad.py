"""Rebuild ROCK & ROAD source references and reversible occurrence editorial manifests.
Source HTML is read locally; this script never connects to a database.
"""
import json, re, csv, unicodedata
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
ROOT=Path(__file__).resolve().parents[3]
DEST=Path(__file__).parent
SOURCE=Path('/home/czechspekk/Downloads/NEW ROCKBUSTERS WEBSITE - HTML /TRIP-COURSE/TRIPS-COURSES')
MAPPINGS=list(csv.DictReader((ROOT/'docs/superpowers/plans/2026-09-11-trip-detail-customization-catalogue.csv').open()))
GUIDES=json.loads((ROOT/'.scratch/trip-design-inventory/current-guides.json').read_text())
def extract(source):
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
  if key in ['reviews','package'] and node: node=node.parent
  if not node:
   sections[key]={'key':key,'visibility':'hide'}
   continue
  h=node.select_one('h2,h3'); eyebrow=node.select_one('.eyebrow,.gallery-kicker')
  sections[key]={'key':key,'eyebrow':txt(eyebrow),'heading':txt(h),'headingParts':parts(h)}
 for key,sel in [('dates','.schedule-intro'),('gallery','.gallery-intro-right'),('itinerary','.programme-grid > div:first-child > p'),('comparison','.programme-grid > div:last-child > p'),('booking','.book-content > p')]: sections[key]['intro']=one(sel)
 sections['overview']['intro']='\n\n'.join(txt(x) for x in s.select('.overview-left > p'))
 def facts(sel,prefix): return [{'label':one('.'+prefix+'-label',n),'value':one('.'+prefix+'-value',n),'description':one('.'+prefix+'-sub',n)} for n in s.select(sel)]
 r={'version':1,'classification':'local design comparison content; not canonical seed','sourceFile':source.name,'target':{'eventId':8,'eventSlug':'sport-climbing','eventDateId':745,'dateFrom':'2026-09-26','dateTo':'2026-10-10'},'sections':list(sections.values()),'hero':{'titleParts':parts(s.h1),'description':one('.hero-sub'),'hashtag':next((txt(p) for p in s.select('.hero-text-col p') if txt(p).startswith('#')),''),'primaryLabel':one('.hero-actions .btn-primary'),'secondaryLabel':one('.hero-actions .btn-secondary'),'sourceSecondaryHref':s.select_one('.hero-actions .btn-secondary')['href']},'overview': [txt(x) for x in s.select('.overview-left > p')],'overviewFacts':facts('.overview-stat','overview-stat'),'strip':[{'value':one('.strip-num',x),'label':one('.strip-text',x)} for x in s.select('.strip-item')],'summary':{'rows':facts('.hero-card-row','hero-card'),'price':one('.hero-card-price'),'travelNote':one('.hero-card-highlight'),'ctaLabel':one('.hero-card-cta')},'audienceCards':[{'heading':one('h3',x),'body':one('p',x)} for x in s.select('.who-card')],'pillars':[{'heading':one('h3',x),'headingParts':parts(x.h3),'bullets':[{'text':txt(li)} for li in x.select('li')]} for x in s.select('.pillar')],'dailySchedule':[{'time':one('.time',x),'title':one('strong',x),'description':one('.time-desc',x).replace(one('strong',x),'',1).strip()} for x in s.select('.time-block')],'comparison':{'columns':[txt(th) for th in s.select('.week-comparison th')],'rows':[{'label':txt(tds[0]),'left':txt(tds[1]) or ('✓' if 'check' in tds[1].get('class',[]) else ''),'right':txt(tds[2]) or ('✓' if 'check' in tds[2].get('class',[]) else '')} for tr in s.select('.week-comparison tbody tr') if (tds:=tr.select('td'))]},'venue':{'paragraphs':[{'text':txt(p)} for p in s.select('.location-text > p')],'facts':facts('.location-facts .fact','fact')},'coaches':[{'name':one('.coach-name',x),'role':one('.coach-title',x),'bio':one('.coach-bio',x)} for x in s.select('.coach-card')],'previewReviews':[{'quote':one('.testimonial-text',x),'reviewerName':'[Design preview] '+one('.testimonial-author',x)} for x in s.select('.testimonial')],'practicalCards':[{'heading':one('h3',x),'body':one('p',x)} for x in s.select('.logistics-card')],'packageItems':[{'text':txt(x)} for x in s.select('.included-item')],'packageNote':one('.included-grid + p'),'faqs':[{'question':one('.faq-q',x),'answer':one('.faq-a',x)} for x in s.select('.faq-item')],'closingSupport':one('.book-note'),'closingPrimaryLabel':one('.book-actions .btn-primary'),'scheduleReference':[{'text':txt(x),'links':[{'text':txt(a),'href':a['href']} for a in x.select('a[href]')]} for x in s.select('.schedule-row')]}
 return r
def normalize_name(value):
 return ''.join(c for c in unicodedata.normalize('NFD',value).lower() if unicodedata.category(c)!='Mn')
def rich(texts):
 return {'root':{'type':'root','version':1,'format':'','indent':0,'direction':None,'children':[{'type':'paragraph','version':1,'format':'','indent':0,'direction':None,'children':[{'type':'text','text':t,'version':1,'format':0,'detail':0,'mode':'normal','style':''}],'textFormat':0,'textStyle':''} for t in texts]}}
def build(reference, snapshot):
 r=json.loads(json.dumps(reference))
 adaptations=[]
 def adapt(value):
  if isinstance(value,list):return [adapt(x) for x in value]
  if isinstance(value,dict):return {k:adapt(v) for k,v in value.items()}
  if not isinstance(value,str):return value
  original=value
  value=re.sub(r'(?:8|eight) countries','eight destinations',value,flags=re.I)
  value=re.sub(r'€\s*[\d,]+(?:\s*(?:per week|/week|a head))?', 'the current listed price',value)
  value=value.replace('57 Days','{durationDays} Days').replace('57 days','{durationDays} days')
  if value!=original:adaptations.append({'from':original,'to':value,'reason':'Preserve selected occurrence commercial authority; eight route legs cover six countries, not eight.'})
  return value
 r=adapt(r)
 content={'title':''.join(p['text'] for p in r['hero']['titleParts']), 'shortDescription':r['hero']['description'],'audienceCards':r['audienceCards'],'whatYouLearn':{},'tripDetail':{'locationDescriptor':r['strip'][0]['label'],'gradeRange':r['strip'][2]['value'],'leadRequirement':next(x['value'] for x in r['summary']['rows'] if x['label']=='Level'),'minimumParticipants':3,'priceCaption':'per person · coaching & guiding included','travelNote':r['summary']['travelNote'],'hashtag':r['hero']['hashtag'],'sections':[{'kind':'overview','heading':next(x.get('heading','') for x in r['sections'] if x['key']=='overview'),'body':rich(r['overview'])}]}}
 for i,p in enumerate(r['pillars'],1):
  content['whatYouLearn'][f'box{i}Heading']=p['heading']; content['whatYouLearn'][f'box{i}Bullets']=p['bullets']
 for section in r['sections']:
  if section['key']=='overview':section.pop('intro',None)
  for field in ['eyebrow','heading','intro']:
   if field in section and not section[field]:section['clear'+field.capitalize()]=True
 facts=r['overviewFacts']
 for fact in facts:
  values={'Duration':'{durationDays} Days','Location':'{location}','Group Size':'Maximum {capacity}','Head Coach':'{coaches}','Coaches':'{coaches}','Price':'{price}','Price From':'{price}'}
  if fact['label'] in values:fact['value']=values[fact['label']]
  if fact['label']=='Head Coach':fact['label']='Coaches';fact['description']='Your assigned coaching team'
  if fact['label'] in ['Price','Price From']:fact['description']='Guiding & coaching included'
 strip=[]
 for i,item in enumerate(r['strip']):
  value=item['value'];label=item['label']
  if i==1:value='{dates}';label='{durationDays} Days'
  if i==4:value='{price}';label='Full Tour' if snapshot['id']==688 else label
  strip.append({'value':value,'label':label})
 summary=[]
 for item in r['summary']['rows']:
  label=item['label'];value=item['value']
  value={'Dates':'{dates}','Duration':'{durationDays} Days','Location':'{location}, {country}','Coaches':'{coaches}'}.get(label,value)
  summary.append({'label':label,'value':value})
 rows=[]
 for row in r['comparison']['rows']:
  if row['right']=='57':row['right']='Coaching throughout the tour, with rest and travel days'
  rows.append({'cells':[{'text':row['label']},{'text':row['left']},{'text':row['right']}]})
 profiles=[];unmatched=[]
 for coach in r['coaches']:
  match=next((g for g in snapshot['guides'] if normalize_name(g['name'])==normalize_name(coach['name'])),None)
  if match:profiles.append({'guide':match['id'],'role':coach['role'],'bio':coach['bio']})
  else:unmatched.append(coach['name'])
 assert not unmatched, unmatched
 editorial={'clearContentFields':['content','additionalInfo'],'content':content,'sections':r['sections'],'hero':{'titleParts':r['hero']['titleParts'],'description':r['hero']['description'],'hashtag':r['hero']['hashtag'],'clearHashtag':not bool(r['hero']['hashtag']),'primaryLabel':r['hero']['primaryLabel'],'secondaryLabel':r['hero']['secondaryLabel'],'secondaryTarget':'programme'},'booking':{'primaryLabel':'Book Full Tour — {price}' if snapshot['id']==688 else 'Book Now — {price}','support':r['closingSupport']},'factsStrip':strip,'summaryRows':summary,'overviewFacts':facts,'dailySchedule':r['dailySchedule'],'companion':{'columns':[{'label':"What's Included"},{'label':'1 Week'},{'label':'Full Tour'}],'rows':rows},'venue':r['venue'],'practicalCards':r['practicalCards'],'packageItems':r['packageItems'],'packageNote':r['packageNote'],'faqs':r['faqs'],'previewReviews':[{'name':x['reviewerName'],'quote':x['quote'],'context':'Design preview — unverified source testimonial'} for x in r['previewReviews']],'coachProfiles':profiles}
 # Source food arrangements are retained but an unverified optional meal price is omitted.
 if snapshot['id']==686:
  old=editorial['packageNote'];editorial['packageNote']='Not included: local transport within the destination, travel & climbing insurance, and food. Optional communal dinner arrangements and prices are confirmed before departure.'
  adaptations.append({'from':old,'to':editorial['packageNote'],'reason':'Do not turn a design-only optional meal price into a verified inclusion promise.'})
 for faq in editorial['faqs']:
  if faq['question']=='Is food included?':
   original=faq['answer'];faq['answer']='Food arrangements and any included meals are confirmed before departure.'
   adaptations.append({'from':original,'to':faq['answer'],'reason':'Reference FAQ ingredient inclusion conflicts with flexible package food wording; confirmation required before making an inclusion promise.'})
  if 'current listed price' in faq['answer']:
   faq['answer']=faq['answer'].replace('for the current listed price','at the current full-tour price').replace('at the current listed price:', 'with arrangements and prices confirmed before departure:')
 adaptations.extend([{'reason':'Source comparison prices belong to separate purchasable occurrences.','change':'Format columns retain labels only; selected price appears through {price} in authoritative overview, strip and booking.'},{'reason':'Full-tour 57 climbing days conflicts with 56 elapsed days and travel/rest schedule.','change':'Comparison describes coaching throughout the tour with rest and travel days; duration uses selected occurrence token.'},{'reason':'Reference review text has no verification evidence.','change':'Every copied testimonial carries visible [Design preview] name and unverified context.'}])
 expected=[]
 # All authored display strings, including complete prose, structured table cells,
 # FAQ answers and guide biographies. Exclude only editor controls / Lexical metadata.
 non_display={'key','kind','type','version','format','textFormat','textStyle','detail','mode','style','direction','indent','visibility','secondaryTarget','clearContentFields','href','id','guide'}
 def rendered_strings(value):
  if isinstance(value,str):
   if value.strip():expected.append(value)
  elif isinstance(value,list):
   for item in value:rendered_strings(item)
  elif isinstance(value,dict):
   for key,item in value.items():
    if key not in non_display:rendered_strings(item)
 rendered_strings(editorial)
 return {'sourceFile':reference['sourceFile'],'target':reference['target'],'editorial':editorial,'provenance':{'classification':'temporary local source-derived design comparison content','marker':'trip-editorial-'+str(snapshot['id']),'reference':'references/rockroad.json','commercialBoundary':'No dates, prices, capacity, relationships, media or booking records changed.','adaptations':adaptations,'sourceSecondaryHref':reference['hero']['sourceSecondaryHref'],'sourceSchedule':reference['scheduleReference']},'expectedText':list(dict.fromkeys(expected))}
references=[];manifests=[]
for mapping in MAPPINGS:
 if not mapping['file'].startswith('ROCK & ROAD/'):continue
 reference=extract(SOURCE/mapping['file'])
 reference['sourceFile']=mapping['file']
 reference['target']={'eventId':int(mapping['event_id']),'eventSlug':mapping['event_slug'],'eventDateId':int(mapping['selected_active_id']),'dateFrom':mapping['from'],'dateTo':mapping['to']}
 references.append(reference)
 manifests.append(build(reference,GUIDES[mapping['selected_active_id']]))
assert len(manifests)==9
assert len({m['target']['eventDateId'] for m in manifests})==9
for m in manifests:
 assert len(m['editorial']['dailySchedule'])==6
 assert len(m['editorial']['coachProfiles'])==4
 assert len(m['editorial']['sections'])==14
 assert len(m['editorial']['faqs'])>=5
 assert len(m['editorial']['factsStrip'])==5
for folder,data in [('references',references),('manifests',manifests)]:
 (DEST/folder/'rockroad.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'manifestCount':len(manifests),'targets':[m['target']['eventDateId'] for m in manifests],'expectedTextCount':sum(len(m['expectedText']) for m in manifests)}))
