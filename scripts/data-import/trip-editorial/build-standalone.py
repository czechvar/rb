"""Rebuild eleven occurrence-scoped reference-copy manifests; no database writes."""
import csv,json,re,unicodedata
from pathlib import Path
from bs4 import BeautifulSoup,NavigableString
ROOT=Path(__file__).resolve().parents[3]
BASE=Path(__file__).resolve().parent
SOURCE=Path('/home/czechspekk/Downloads/NEW ROCKBUSTERS WEBSITE - HTML /TRIP-COURSE/TRIPS-COURSES')
mapping=list(csv.DictReader((ROOT/'docs/superpowers/plans/2026-09-11-trip-detail-customization-catalogue.csv').open()))
snapshot=json.loads((ROOT/'.scratch/trip-design-inventory/current-guides.json').read_text())
legacy={r['id']:r for r in json.loads((ROOT/'scripts/data-import/seed/legacy-event-dates.json').read_text())['rows']}
def text(n):return n.get_text(' ',strip=True) if n else ''
def one(sel,n):return text(n.select_one(sel)) if n else ''
def parts(n):
 out=[];br=False
 def walk(x,accent=False):
  nonlocal br
  if isinstance(x,NavigableString):
   value=re.sub(r'\s+',' ',str(x))
   if value.strip():out.append({'text':value,'accent':accent,'breakBefore':br});br=False
   elif out and not br:out[-1]['text']+=' '
  elif x:
   if x.name=='br':br=True
   else:
    for c in x.children:walk(c,accent or x.name=='em' or 'var(--red)' in x.get('style',''))
 walk(n)
 if out:out[0]['text']=out[0]['text'].lstrip();out[-1]['text']=out[-1]['text'].rstrip()
 return out

def facts(s,selector,prefix):return [{'label':one('.'+prefix+'-label',n),'value':one('.'+prefix+'-value',n),'description':one('.'+prefix+'-sub',n)} for n in s.select(selector)]
def norm(t):return ''.join(c for c in unicodedata.normalize('NFKD',t.lower()) if not unicodedata.combining(c))
def rich(paras):return {'root':{'type':'root','version':1,'format':'','indent':0,'direction':None,'children':[{'type':'paragraph','version':1,'format':'','indent':0,'direction':None,'children':[{'type':'text','text':p,'version':1,'format':0,'detail':0,'mode':'normal','style':''}],'textFormat':0,'textStyle':''} for p in paras]}}
def strings(v):
 if isinstance(v,str):yield v
 elif isinstance(v,dict):
  for k,x in v.items():
   if k not in ['key','kind','id','type','href','secondaryTarget','visibility','clearContentFields','version','format','textFormat','textStyle','detail','mode','style','direction','indent','guide','datesMode']:yield from strings(x)
 elif isinstance(v,list):
  for x in v:yield from strings(x)
def resolve_link(href):
 m=re.search(r'/order/new/(\d+)',href)
 if not m:return href
 old=legacy.get(int(m[1]))
 if old:
  found=next((x for x in snapshot.values() if x['eventSlug']==old['eventSlug'] and x['date_from'][:10]==old['start'] and x['date_to'][:10]==old['end'] and x['active']),None)
  if found:return '/trips/'+found['eventSlug']+'?date='+str(found['id'])
 return None
refs=[];manifests=[]
for match in mapping:
 if '/' in match['file'] or 'kalymnos' in match['file']:continue
 file=SOURCE/match['file'];s=BeautifulSoup(file.read_text(),'html.parser')
 target={'eventId':int(match['event_id']),'eventSlug':match['event_slug'],'eventDateId':int(match['selected_active_id']),'dateFrom':match['from'],'dateTo':match['to']}
 selected=snapshot[str(target['eventDateId'])];adaptations=[]
 selectors={'overview':'.overview-left','dates':'.schedule-block','gallery':'.gallery-intro','audience':'.who-section','learning':'.pillars-header','itinerary':'.programme-grid > div:first-child','comparison':'.programme-grid > div:last-child','venue':'.location-text','team':'.coaches-section','reviews':'.testimonials-grid','logistics':'.logistics-section','package':'.included-grid','faq':'.faq-section','booking':'.book-content'}
 sections=[]
 for key,sel in selectors.items():
  n=s.select_one(sel)
  if not n:
   sections.append({'key':key,'visibility':'hide'});continue
  if key in ['reviews','package']:n=n.parent
  h=n.select_one('h2,h3')
  row={'key':key,'eyebrow':one('.eyebrow,.gallery-kicker',n),'heading':text(h),'headingParts':parts(h),'clearEyebrow':not bool(one('.eyebrow,.gallery-kicker',n))}
  intro={'dates':'.schedule-intro','gallery':'.gallery-intro-right','itinerary':':scope > p','comparison':':scope > p','booking':':scope > p:not(.book-note)'}
  if key in intro:row['intro']='\n\n'.join(text(p) for p in n.select(':scope > p' if key=='dates' else intro[key]));row['clearIntro']=not bool(row['intro'])
  sections.append(row)
 overview=[text(p) for p in s.select('.overview-left > p')]
 r={'sourceFile':file.name,'target':target,'sections':sections,'hero':{'titleParts':parts(s.h1),'description':one('.hero-sub',s),'hashtag':next((text(p) for p in s.select('.hero-text-col p') if text(p).startswith('#')),''),'primaryLabel':one('.hero-actions .btn-primary',s),'secondaryLabel':one('.hero-actions .btn-secondary',s),'secondaryTarget':'programme'},'overview':overview,'overviewFacts':facts(s,'.overview-stat','overview-stat'),'factsStrip':[{'value':one('.strip-num',n),'label':one('.strip-text',n)} for n in s.select('.strip-item')],'summaryRows':facts(s,'.hero-card-row','hero-card'),'overviewAction':{'label':one('.overview-left .btn-primary',s),'href':(s.select_one('.overview-left .btn-primary') or {}).get('href','')},'summaryPrimaryLabel':one('.hero-card-cta',s),'summaryNote':'\n\n'.join(text(p) for p in s.select('.hero-card > p')),'travelNote':one('.hero-card-highlight',s),'priceCaption':one('.per-person',s),'audienceCards':[{'heading':one('h3',n),'body':'\n\n'.join(text(p) for p in n.select('p'))} for n in s.select('.who-card')],'pillars':[{'heading':one('h3',n),'bullets':[{'text':text(li)} for li in n.select('li')]} for n in s.select('.pillar')],'dailySchedule':[{'time':one('.time',n),'title':one('strong',n),'description':one('.time-desc',n).replace(one('strong',n),'',1).strip()} for n in s.select('.time-block')],'companion':{'columns':[{'label':text(th)} for th in s.select('.week-comparison th')],'rows':[{'cells':[{'text':text(td) or ('✓' if 'check' in td.get('class',[]) else '—')} for td in tr.select('td')]} for tr in s.select('.week-comparison tbody tr')],'links':[]},'venue':{'paragraphs':[{'text':text(p)} for p in s.select('.location-text > p')],'facts':facts(s,'.location-facts .fact','fact')},'coaches':[{'name':one('.coach-name',n),'role':one('.coach-title',n),'bio':one('.coach-bio',n)} for n in s.select('.coach-card')],'previewReviews':[{'name':'[Design preview] '+one('.testimonial-author',n),'quote':one('.testimonial-text',n),'context':'Design preview — unverified source testimonial'} for n in s.select('.testimonial')],'practicalCards':[{'heading':one('h3',n),'body':'\n\n'.join(text(p) for p in n.select('p'))} for n in s.select('.logistics-card')],'packageItems':[{'text':text(n)} for n in s.select('.included-item')],'packageNote':one('.included-grid + p',s),'faqs':[{'question':one('.faq-q',n),'answer':one('.faq-a',n)} for n in s.select('.faq-item')],'booking':{'primaryLabel':one('.book-actions .btn-primary',s),'support':one('.book-note',s)},'scheduleReference':[{'text':text(n),'links':[{'label':text(a),'href':a['href']} for a in n.select('a[href]')]} for n in s.select('.schedule-row')]}
 for row in s.select('.programme-grid > div:last-child .schedule-row'):
  anchor=row.select_one('a[href*="/order/new/"]')
  if anchor:
   href=resolve_link(anchor['href'])
   if href:r['companion']['links'].append({'label':one('.schedule-dest',row)+' — '+one('.schedule-dates',row),'description':text(anchor),'href':href})
   else:adaptations.append({'reason':'No current catalogue match for related option','sourceHref':anchor['href']})
 refs.append(json.loads(json.dumps(r)))
 e={k:r[k] for k in ['sections','hero','dailySchedule','overviewFacts','factsStrip','summaryRows','companion','venue','previewReviews','practicalCards','packageItems','packageNote','faqs','booking']}
 e['actions']={'overviewLabel':re.sub(r'€\s*[\d,]+','{price}',r['overviewAction']['label']),'summaryLabel':r['summaryPrimaryLabel']}
 if 'dolcevita' in file.name:e['datesMode']='notice'
 e['clearContentFields']=['content','additionalInfo']
 e['content']={'title':one('h1',s),'shortDescription':r['hero']['description'],'audienceCards':r['audienceCards'],'whatYouLearn':{},'tripDetail':{'locationDescriptor':r['factsStrip'][0]['label'],'leadRequirement':next((x['value'] for x in r['summaryRows'] if x['label']=='Level'),''),'priceCaption':r['priceCaption'],'travelNote':r['travelNote'],'hashtag':r['hero']['hashtag'],'sections':[{'kind':'overview','heading':next(x.get('heading','') for x in sections if x['key']=='overview'),'body':rich(overview)}]}}
 for f in r['factsStrip']:
  if f['label'].lower() in ['grade','grade range']:e['content']['tripDetail']['gradeRange']=f['value']
  if f['label']=='Min. Participants' and f['value'].isdigit():e['content']['tripDetail']['minimumParticipants']=int(f['value'])
 for i,p in enumerate(r['pillars']):e['content']['whatYouLearn']['box'+str(i+1)+'Heading']=p['heading'];e['content']['whatYouLearn']['box'+str(i+1)+'Bullets']=p['bullets']
 e['coachProfiles']=[];missing=[]
 for coach in r['coaches']:
  guide=next((g for g in selected['guides'] if norm(g['name'].split(' / ',1)[0])==norm(coach['name'])),None)
  if guide:e['coachProfiles'].append({'guide':guide['id'],'role':coach['role'],'bio':coach['bio']})
  else:missing.append(coach)
 if missing:adaptations.append({'reason':'Reference coach is not assigned to selected occurrence; relationship preserved, profile not published','unmatchedCoaches':missing})
 # Commerce follows selected occurrence, source-only editorial climbing day counts remain in the programme.
 for collection in ['overviewFacts','summaryRows']:
  for f in e[collection]:
   label=f['label'].lower()
   if 'price' in label:f['value']='{price}'
   elif label=='dates':f['value']='{dates}'
   elif label=='duration':f['value']='{durationDays} Days'
   elif label=='location':f['value']='{location}'+(', {country}' if collection=='summaryRows' else '')
   elif 'group size' in label:f['value']='Maximum {capacity}'
   elif 'coach' in label:f['value']='{coaches}';f['description']='Selected occurrence coaching team'
   if re.search(r'€\s*[\d,]+',f.get('description','')):f['description']='See dates and pricing for available options.'
 for i,f in enumerate(e['factsStrip']):
  if i==0:f['value']='{location}'
  elif i==1:f['value']='{dates}'
  if 'price' in f['label'].lower():f['value']='{price}'
  if 'group size' in f['label'].lower() or 'max participant' in f['label'].lower():f['value']='{capacity}'
 e['booking']['primaryLabel']=re.sub(r'€\s*[\d,]+','{price}',e['booking']['primaryLabel'])
 for col in e['companion']['columns']:
  if '€' in col['label']:col['label']=re.sub(r'€\s*[\d,]+','See dates & pricing',col['label'])
 # Keep literal source prices out of comparison cells and narrative promises.
 def adapt(v):
  if isinstance(v,str):
   v=re.sub(r'€\s*[\d,]+(?:\.\d{2})?','current listed price',v)
   v=re.sub(r'\b(?:2|3|5)[––-](?:12|15)\b','up to '+str(selected['capacity']),v)
   v=re.sub(r'\b(?:maximum of|max(?:imum)?|limited to)\s+(?:8|12|15)\b',lambda m:re.sub(r'\d+',str(selected['capacity']),m[0]),v,flags=re.I)
   return v
  if isinstance(v,list):return [adapt(x) for x in v]
  if isinstance(v,dict):return {k:adapt(x) for k,x in v.items()}
  return v
 e=adapt(e)
 if target['eventDateId']==674:
  for row in e['companion']['rows']:
   for cell in row['cells']:
    if cell['text']=='Free 1 month, included':cell['text']='Ask about training-plan availability'
  for bullets in e['content']['whatYouLearn'].values():
   if isinstance(bullets,list):
    for bullet in bullets:
     if bullet['text']=='A free 1-month training plan to take home':bullet['text']='Discuss a take-home training plan with your coaches'
  for faq in e['faqs']:
   if 'free one-month personalized training plan' in faq['answer']:
    faq['answer']='Ask your assigned coaching team about personalized training plans and the availability of follow-up coaching.'
  adaptations.append({'reason':'Patxi is assigned as Patxi Usobiaga / pro-climber (Guide 11); slash role suffix is not a different person','change':'Source profile and coaching methodology retained for verified assigned Guide 11. Free follow-up-plan availability remains contact-first.'})
 if target['eventDateId']==740:
  def ratio(v):
   if isinstance(v,str):return re.sub(r'max 7:1 coach ratio','personal coaching within the group',v,flags=re.I)
   if isinstance(v,list):return [ratio(x) for x in v]
   if isinstance(v,dict):return {k:ratio(x) for k,x in v.items()}
   return v
  e=ratio(e)
  adaptations.append({'reason':'Source max 7:1 ratio is unsupported by current one-coach assignment and capacity 12','change':'Use personal coaching within the group; retain original source reference.'})
 if r['summaryNote']:
  e['content']['tripDetail']['travelNote'] += '\n\nContact us to discuss accommodation and guiding-only arrangements before booking.'
  adaptations.append({'reason':'Source offers an unverified accommodation opt-out at checkout and separate service price','sourceText':r['summaryNote'],'change':'Contact-first accommodation and guiding-only advice in summary travel note; no invented checkout capability.'})
 if missing:
  def safe_coaching(v):
   if isinstance(v,str):
    v=v.replace("Patxi splits his coaching time between Rodellar and his home turf around Oliana and Coll de Nargo, so expect a few stories from further afield too — and route recommendations that go well beyond this single canyon.","Your assigned coaching team brings experience from beyond Rodellar, with route recommendations for developing your climbing.")
    v=v.replace("Yes — a free one-month personalized training plan designed by Patxi, with the option to continue with long-term follow-up coaching.","Ask your assigned coaching team about personalized training plans and the availability of follow-up coaching.")
    v=v.replace("Patxi's own systematic training approach", "A systematic training approach inspired by Patxi's methodology")
    v=v.replace("Conditioning & power drills based on Patxi's own regimen", "Conditioning & power drills adapted by your assigned coaching team")
    return v
   if isinstance(v,list):return [safe_coaching(x) for x in v]
   if isinstance(v,dict):return {k:(x if k=='previewReviews' else safe_coaching(x)) for k,x in v.items()}
   return v
  e=safe_coaching(e)
  adaptations.append({'reason':'Unassigned source coach cannot be promised as delivering the occurrence','change':'Patxi delivery and personal follow-up plan promises adapted to assigned coaching team; source preview testimonial remains visibly unverified.'})
 food='Food arrangements and any included meals are confirmed before departure.'
 conflict=any('ingredients are covered' in q['answer'] for q in e['faqs']) and 'Food is flexible' in e['packageNote']
 if conflict:
  for q in e['faqs']:
   if q['question']=='Is food included?':q['answer']=food
  e['packageNote']=re.sub(r'Food is flexible.*',food,e['packageNote'])
  adaptations.append({'reason':'Source FAQ included ingredients conflicts with flexible-food package wording','change':food})
 adaptations.extend([{'reason':'Commerce remains selected-occurrence authoritative','change':'Fact prices, total duration, dates, capacity, locations and coaches use live tokens; alternative prices refer readers to dates and pricing. Source climbing-day schedules remain editorial.'},{'reason':'Source group size can differ from current assigned occurrence','change':'Explicit large-group promises adapted to current capacity; no capacity record changed.'},{'reason':'Source testimonials are unverified','change':'Visible Design preview names and context; no canonical review records.'}])
 expected=list(dict.fromkeys(x for x in strings(e) if x.strip() and x not in ['temporary local design comparison content']))
 manifests.append({'version':1,'classification':'temporary local design comparison content','marker':'trip-editorial-'+str(target['eventDateId']),'sourceFile':file.name,'target':target,'editorial':e,'provenance':{'unchangedReference':'../references/standalone.json','sourceLegacyBookingId':int(match['legacy_booking_id']),'adaptations':adaptations,'commercialBoundary':'No price, dates, capacity, guide/location/media relationships changed.'},'expectedText':expected})
assert len(manifests)==11
(BASE/'references/standalone.json').write_text(json.dumps(refs,ensure_ascii=False,indent=2)+'\n')
(BASE/'manifests/standalone.json').write_text(json.dumps(manifests,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'manifests':len(manifests),'dates':[m['target']['eventDateId'] for m in manifests],'expectedText':sum(len(m['expectedText']) for m in manifests),'unmatchedCoaches':[{ 'date':m['target']['eventDateId'],'names':[c['name'] for a in m['provenance']['adaptations'] for c in a.get('unmatchedCoaches',[])]} for m in manifests]}))
