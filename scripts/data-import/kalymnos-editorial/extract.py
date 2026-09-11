"""Extract text and semantic heading accents; never persist source CSS or imagery."""
import json, re, sys
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString
source=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/home/czechspekk/Downloads/NEW ROCKBUSTERS WEBSITE - HTML /TRIP-COURSE/TRIPS-COURSES/rockbusters_sportclimbing_kalymnos.html')
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
Path(__file__).with_name('reference.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sections':len(r['sections']),'schedule':len(r['dailySchedule']),'facts':len(r['overviewFacts']),'sourceTextExtracted':True}))
