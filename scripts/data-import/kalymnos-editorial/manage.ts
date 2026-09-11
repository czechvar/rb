/** Local, reversible editorial pilot. Invoke through tsx; raw runtime errors are suppressed. */
import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { replacement } from '../trip-editorial/replacement'
import { editorialMatches } from './editorial-readback'
import { connect } from '../event-detail/source.mjs'
const dir = path.dirname(fileURLToPath(import.meta.url))
const receipts = path.resolve('.scratch/kalymnos-editorial-745')
const mode = process.argv[2] ?? 'dry-run'
const hasContent = (v: any): boolean => Array.isArray(v) ? v.some(hasContent) : v && typeof v === 'object' ? Object.entries(v).some(([k,x])=>k!=='id'&&hasContent(x)) : v!==null&&v!==undefined&&v!==''&&v!==false
const equal = (a: unknown,b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const clean = (value: any): any => Array.isArray(value) ? value.map(clean) : value && typeof value==='object' ? Object.fromEntries(Object.entries(value).filter(([key])=>!['updatedAt','createdAt'].includes(key)).map(([k,v])=>[k,clean(v)])) : value
// Historical receipts may contain empty defaults for relationships removed from editorial schema.
// Refuse populated values: only these precise obsolete paths can normalize to absence.
const cleanEditorial = (value: any) => {
 const result=structuredClone(value)
 const transport=result?.content?.transport
 if(transport && 'airports' in transport){
  const value=transport.airports
  if(value!==null&&value!==undefined&&!(Array.isArray(value)&&value.length===0))throw new Error('populated obsolete relationship')
  delete transport.airports
 }
 for(const day of result?.content?.itinerary?.days??[]){
  if('image' in day){if(day.image!==null&&day.image!==undefined)throw new Error('populated obsolete relationship');delete day.image}
 }
 return clean(result)
}
const read = async (name: string) => JSON.parse(await fs.readFile(name,'utf8'))
const scalarPaths: Record<string,string> = {
 title:'title',short_description:'shortDescription',content:'content',equipment_intro:'equipmentIntro',
 what_you_learn_intro:'whatYouLearn.intro',what_you_learn_box1_heading:'whatYouLearn.box1Heading',what_you_learn_box2_heading:'whatYouLearn.box2Heading',what_you_learn_box3_heading:'whatYouLearn.box3Heading',
 comparison_heading:'comparison.heading',comparison_intro:'comparison.intro',comparison_left_heading:'comparison.leftHeading',comparison_right_heading:'comparison.rightHeading',
 accommodation_description:'accommodation.description',accommodation_cuisine_highlights:'accommodation.cuisineHighlights',transport_description:'transport.description',coach_framing_paragraph:'coachFramingParagraph',
 trip_detail_location_descriptor:'tripDetail.locationDescriptor',trip_detail_grade_range:'tripDetail.gradeRange',trip_detail_lead_requirement:'tripDetail.leadRequirement',trip_detail_minimum_participants:'tripDetail.minimumParticipants',trip_detail_price_caption:'tripDetail.priceCaption',trip_detail_travel_note:'tripDetail.travelNote',trip_detail_hashtag:'tripDetail.hashtag',
}
const arrayPaths: Record<string,string> = {event_trip_sections:'tripDetail.sections',events_additional_info:'additionalInfo',events_audience_cards:'audienceCards',events_what_you_learn_box1_bullets:'whatYouLearn.box1Bullets',events_what_you_learn_box2_bullets:'whatYouLearn.box2Bullets',events_what_you_learn_box3_bullets:'whatYouLearn.box3Bullets',events_accommodation_included:'accommodation.included',events_accommodation_not_included:'accommodation.notIncluded',events_comparison_rows:'comparison.rows',events_coach_team_bullets:'coachTeamBullets'}
const rowToAPI = (row: any) => Object.fromEntries(Object.entries(row).filter(([k])=>!['_order','_parent_id'].includes(k)))
const columns = (rows: any[]) => rows.map(row => Object.fromEntries(Object.entries(row).sort(([a],[b])=>a.localeCompare(b))))
let client: any, payload: any, transactionID: any
let stage = 'guard'
try {
 if (!['dry-run','apply','check','rollback','refresh-dry-run','refresh'].includes(mode)) throw new Error('mode')
 // Guard before Payload/config initialization. Configuration values never leave this operation.
 client=await connect()
 const baseline=await read(path.join(dir,'pilot-baseline.json'))
 const sqlBefore=baseline.before
 const sqlAfter=baseline.after
 const rawEvent=(await client.query('SELECT * FROM events WHERE id=8')).rows[0]
 const rawDate=(await client.query('SELECT id,event_id,date_from,date_to,capacity FROM event_dates WHERE id=745')).rows[0]
 if(rawEvent?.slug!=='sport-climbing'||rawDate?.event_id!==8||new Date(rawDate.date_from).toISOString().slice(0,10)!=='2026-09-26'||new Date(rawDate.date_to).toISOString().slice(0,10)!=='2026-10-10'||Number(rawDate.capacity)!==8) throw new Error('target mismatch')
 const rawTables: Record<string,any[]>={}
 for(const table of Object.keys(arrayPaths)) rawTables[table]=(await client.query(`SELECT * FROM ${table} WHERE _parent_id=8 ORDER BY _order,id`)).rows
 const related: Record<string,any[]>={}
 for(const table of ['faqs','reviews']) related[table]=(await client.query(`SELECT * FROM ${table} WHERE event_id=8 ORDER BY id`)).rows
 await client.end();client=null
 const localConfig=dotenv.parse(await fs.readFile('.env'))
 const configuredTarget=new URL(localConfig.DATABASE_URL)
 if(!['localhost','127.0.0.1','[::1]'].includes(configuredTarget.hostname)||configuredTarget.hostname.includes('ep-weathered-pine-alvc3sdj'))throw new Error('local configuration changed')
 process.env.DATABASE_URL=localConfig.DATABASE_URL
 if(localConfig.PAYLOAD_SECRET)process.env.PAYLOAD_SECRET=localConfig.PAYLOAD_SECRET
 stage='payload-initialization'
 process.env.PAYLOAD_DISABLE_DB_PUSH='true'
 const config=(await import('../../../src/payload.config')).default
 const resolvedConfig=await config
 // Quiet Payload startup/hooks; this script emits only its explicit safe scalar report.
 resolvedConfig.logger={options:{level:'silent'}} as typeof resolvedConfig.logger
 payload=await (await import('payload')).getPayload({config:resolvedConfig})
 stage='load-editorial'
 const manifest=await read(path.join(dir,'manifest.json'))
 if (await fs.access(path.join(receipts,'pending.json')).then(()=>true,()=>false)) throw new Error('pending receipt recovery required')
 const receipt=await read(path.join(receipts,'receipt.json')).catch(()=>null)
 const find=async(collection:any,id:number)=>payload.findByID({collection,id,depth:0,overrideAccess:true,req:transactionID?{transactionID}:undefined})
 stage='fetch-records'
 const event=await find('events',8), date=await find('event-dates',745)
 stage='schema-availability'
 if(!('editorial' in date)) throw new Error('editorial migration missing')
 const refreshMode=mode==='refresh'||mode==='refresh-dry-run'
 const picked = (doc:any,keys:string[])=>Object.fromEntries(keys.map(k=>[k,doc[k]??null]))
 if(receipt && mode!=='rollback') {
  stage='receipt-preconditions'
  if(!equal(clean(picked(event,receipt.eventKeys)),clean(receipt.after.event))||!equal(cleanEditorial(date.editorial),cleanEditorial(receipt.after.editorial))) {
   const paths=(a:any,b:any,prefix=''):string[]=>equal(a,b)?[]:a&&b&&typeof a==='object'&&typeof b==='object'?Array.from(new Set([...Object.keys(a),...Object.keys(b)])).flatMap(k=>paths(a[k],b[k],prefix?`${prefix}.${k}`:k)):[prefix]
   console.log(JSON.stringify({receiptConflictPaths:[...paths(clean(picked(event,receipt.eventKeys)),clean(receipt.after.event),'event'),...paths(cleanEditorial(date.editorial),cleanEditorial(receipt.after.editorial),'editorial')]}))
   throw new Error('subsequent edits')
  }
  for(const item of receipt.related) if((await find(item.collection,item.id)).active!==item.afterActive) throw new Error('subsequent related edits')
  if(!refreshMode){console.log(JSON.stringify({alreadyApplied:true,checked:true,eventDateId:745}));process.exit(0)}
 }
 if(mode==='check'||(refreshMode&&!receipt)) throw new Error('no applied receipt')
 if(refreshMode){
  stage='refresh-plan'
  const plan={refresh:true,eventDateId:745,editorialOnly:true,originalRollbackPreserved:true}
  if(mode==='refresh-dry-run'){
   await fs.writeFile(path.join(receipts,'refresh-dry-run.json'),JSON.stringify({...plan,provenance:manifest.provenance},null,2)+'\n')
   console.log(JSON.stringify({...plan,dryRun:true}));process.exit(0)
  }
  transactionID=await payload.db.beginTransaction()
  if(!transactionID)throw new Error('transaction unavailable')
  const currentDate=await find('event-dates',745)
  if(!equal(cleanEditorial(currentDate.editorial),cleanEditorial(receipt.after.editorial)))throw new Error('refresh conflict')
  const editorialPatch=replacement(cleanEditorial(currentDate.editorial),manifest.editorial)
  await payload.update({collection:'event-dates',id:745,data:{editorial:editorialPatch},depth:0,overrideAccess:true,req:{transactionID},context:{disableRevalidate:true}})
  const refreshed=await find('event-dates',745)
  if(!editorialMatches(refreshed.editorial,editorialPatch))throw new Error('refresh editorial readback mismatch')
  const protectedDate=(doc:any)=>Object.fromEntries(Object.entries(doc).filter(([key])=>!['editorial','updatedAt','createdAt'].includes(key)))
  if(!equal(clean(protectedDate(currentDate)),clean(protectedDate(refreshed))))throw new Error('refresh protected fields changed')
  const nextReceipt={...receipt,after:{...receipt.after,editorial:refreshed.editorial},provenance:manifest.provenance,refreshHistory:[...(receipt.refreshHistory??[]),{previousEditorial:receipt.after.editorial,previousProvenance:receipt.provenance}]}
  await fs.writeFile(path.join(receipts,'pending.json'),JSON.stringify(nextReceipt,null,2)+'\n',{flag:'wx'})
  await payload.db.commitTransaction(transactionID);transactionID=null
  if(!editorialMatches((await find('event-dates',745)).editorial,editorialPatch))throw new Error('committed refresh mismatch')
  await fs.rename(path.join(receipts,'pending.json'),path.join(receipts,'receipt.json'))
  console.log(JSON.stringify({...plan,refreshed:true}));process.exit(0)
 }
 stage='plan-restoration'
 const patch: any={},skipped:string[]=[]
 const set=(dotted:string,value:any)=>{const [root,...rest]=dotted.split('.');if(!rest.length){patch[root]=value;return}if(!(root in patch))patch[root]=structuredClone(event[root]??{});let obj=patch[root];for(const name of rest.slice(0,-1))obj=obj[name]??=( {} );obj[rest.at(-1)!]=value}
 for(const [column,dotted] of Object.entries(scalarPaths)) {
  if(equal(sqlBefore.events[0][column],sqlAfter.events[0][column])) continue
  if(equal(rawEvent[column],sqlAfter.events[0][column])) set(dotted,sqlBefore.events[0][column]??null)
  else skipped.push(dotted)
 }
 for(const [table,dotted] of Object.entries(arrayPaths)) {
  if(equal(columns(sqlBefore[table]),columns(sqlAfter[table])))continue
  if(equal(columns(rawTables[table]),columns(sqlAfter[table])))set(dotted,sqlBefore[table].map(rowToAPI))
  else skipped.push(dotted)
 }
 const relatedChanges: any[]=[]
 for(const collection of ['faqs','reviews'])for(const row of related[collection]){
  const pilot=sqlAfter[collection].find((x:any)=>x.id===row.id)
  if(!pilot||sqlBefore[collection].some((x:any)=>x.id===row.id))continue
  if(equal(columns([row]),columns([pilot])))relatedChanges.push({collection,id:row.id,beforeActive:row.active,afterActive:false})
  else skipped.push(`${collection}.${row.id}`)
 }
 if(mode==='dry-run'){
  await fs.mkdir(receipts,{recursive:true})
  await fs.writeFile(path.join(receipts,'dry-run.json'),JSON.stringify({classification:manifest.classification,target:manifest.target,eventRestoreKeys:Object.keys(patch),skippedSubsequentEdits:skipped,relatedChanges,provenance:manifest.provenance},null,2)+'\n')
  console.log(JSON.stringify({dryRun:true,eventDateId:745,eventRestoreFields:Object.keys(patch).length,relatedPreviewRecords:relatedChanges.length,skippedSubsequentEdits:skipped.length}));process.exit(0)
 }
 transactionID=await payload.db.beginTransaction()
 if(!transactionID)throw new Error('transaction unavailable')
 const update=async(collection:any,id:number,data:any)=>payload.update({collection,id,data,depth:0,overrideAccess:true,req:{transactionID},context:{disableRevalidate:true}})
 if(mode==='rollback'){
  if(!receipt||!equal(clean(picked(event,receipt.eventKeys)),clean(receipt.after.event))||!equal(cleanEditorial(date.editorial),cleanEditorial(receipt.after.editorial)))throw new Error('rollback conflict')
  for(const item of receipt.related)if((await find(item.collection,item.id)).active!==item.afterActive)throw new Error('rollback related conflict')
  await update('events',8,receipt.before.event)
  const editorialPatch=replacement(cleanEditorial(date.editorial),cleanEditorial(receipt.before.editorial))
  await update('event-dates',745,{editorial:editorialPatch})
  for(const item of receipt.related)await update(item.collection,item.id,{active:item.beforeActive})
  if(!editorialMatches((await find('event-dates',745)).editorial,editorialPatch))throw new Error('rollback editorial readback mismatch')
  await payload.db.commitTransaction(transactionID);transactionID=null
  if(!editorialMatches((await find('event-dates',745)).editorial,editorialPatch))throw new Error('committed rollback mismatch')
  await fs.rename(path.join(receipts,'receipt.json'),path.join(receipts,`rolled-back-${Date.now()}.json`))
  console.log(JSON.stringify({rolledBack:true,eventDateId:745}));process.exit(0)
 }
 if(hasContent(date.editorial))throw new Error('existing occurrence editorial')
 const eventKeys=Object.keys(patch)
 const before={event:picked(event,eventKeys),editorial:date.editorial??null}
 await update('events',8,patch)
 const editorialPatch=replacement(cleanEditorial(date.editorial),manifest.editorial)
 await update('event-dates',745,{editorial:editorialPatch})
 for(const item of relatedChanges)await update(item.collection,item.id,{active:item.afterActive})
 const updatedEvent=await find('events',8),updatedDate=await find('event-dates',745)
 if(!editorialMatches(updatedDate.editorial,editorialPatch))throw new Error('apply editorial readback mismatch')
 const strip=(doc:any,omit:string[])=>Object.fromEntries(Object.entries(doc).filter(([k])=>!omit.includes(k)&&!['createdAt','updatedAt'].includes(k)))
 if(!equal(clean(strip(date,['editorial'])),clean(strip(updatedDate,['editorial'])))||!equal(clean(strip(event,eventKeys)),clean(strip(updatedEvent,eventKeys))))throw new Error('protected fields changed')
 const result={version:1,marker:manifest.marker,eventKeys,before,after:{event:picked(updatedEvent,eventKeys),editorial:updatedDate.editorial},related:relatedChanges,skippedSubsequentEdits:skipped,provenance:manifest.provenance}
 await fs.mkdir(receipts,{recursive:true})
 await fs.writeFile(path.join(receipts,'pending.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
 await payload.db.commitTransaction(transactionID);transactionID=null
 if(!editorialMatches((await find('event-dates',745)).editorial,editorialPatch))throw new Error('committed apply mismatch')
 await fs.rename(path.join(receipts,'pending.json'),path.join(receipts,'receipt.json'))
 console.log(JSON.stringify({applied:true,eventDateId:745,eventRestoreFields:eventKeys.length,relatedPreviewRecords:relatedChanges.length,skippedSubsequentEdits:skipped.length,protectedFieldsUnchanged:true}))
} catch {
 if(transactionID)await payload?.db.rollbackTransaction(transactionID).catch(()=>{})
 await client?.end().catch(()=>{})
 console.error(JSON.stringify({stoppedSafely:true,stage}))
 process.exitCode=1
} finally { if(payload)await payload.db.destroy() }
