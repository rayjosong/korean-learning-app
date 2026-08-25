import assert from "node:assert/strict"; import test from "node:test";
import { TranscriptSourceError, YouTubeTranscriptSource } from "../src/youtube-transcript.ts";
const url="https://youtu.be/dQw4w9WgXcQ";
function source(tracks, segments) { return new YouTubeTranscriptSource({ listTracks: async()=>tracks, fetchTrack: async(_, id)=>segments[id] ?? [] }); }
test("prefers manual Korean captions and normalizes timestamps", async()=> {
 const result=await source([{id:"auto",languageCode:"ko",kind:"auto"},{id:"manual",languageCode:"ko-KR",kind:"manual"}], {manual:[{text:" 안녕   하세요 ",startTimeMs:100,endTimeMs:900}]}).getTranscript({videoUrl:url,preferredLanguage:"ko"});
 assert.deepEqual(result.segments,[{id:"0",text:"안녕 하세요",startTimeMs:100,endTimeMs:900}]);
});
test("uses supported automatic Korean captions", async()=> { const result=await source([{id:"auto",languageCode:"ko",kind:"auto"}],{auto:[{text:"안녕",startTimeMs:0,endTimeMs:1}]}).getTranscript({videoUrl:url,preferredLanguage:"ko"}); assert.equal(result.segments.length,1); });
test("maps missing, non-Korean, invalid, and provider failures", async()=> {
 await assert.rejects(()=>source([],{}).getTranscript({videoUrl:url,preferredLanguage:"ko"}),e=>e instanceof TranscriptSourceError&&e.code==="NO_TRANSCRIPT");
 await assert.rejects(()=>source([{id:"en",languageCode:"en",kind:"manual"}],{}).getTranscript({videoUrl:url,preferredLanguage:"ko"}),e=>e instanceof TranscriptSourceError&&e.code==="NO_KOREAN_TRANSCRIPT");
 await assert.rejects(()=>source([],{}).getTranscript({videoUrl:"https://example.com",preferredLanguage:"ko"}),e=>e instanceof TranscriptSourceError&&e.code==="INVALID_VIDEO");
 await assert.rejects(()=>new YouTubeTranscriptSource({listTracks:async()=>{throw new Error("rate limited")},fetchTrack:async()=>[]}).getTranscript({videoUrl:url,preferredLanguage:"ko"}),e=>e instanceof TranscriptSourceError&&e.code==="PROVIDER_ERROR");
});