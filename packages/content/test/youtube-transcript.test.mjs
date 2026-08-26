import assert from "node:assert/strict"; import test from "node:test";
import { TranscriptSourceError, YouTubeTimedTextProvider, YouTubeTranscriptSource } from "../src/youtube-transcript.ts";
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
test("timed-text provider lists manual and automatic tracks", async()=> {
 const provider=new YouTubeTimedTextProvider({fetch:async()=>new Response('<transcript_list><track lang_code="ko" vss_id=".ko"/><track lang_code="ko" kind="asr" vss_id="a.ko"/></transcript_list>')});
 const tracks=await provider.listTracks("video");
 assert.equal(tracks.length,2); assert.equal(tracks[0].kind,"manual"); assert.equal(tracks[1].kind,"auto");
});
test("timed-text provider parses json3 events and sends the selected track", async()=> {
 let requested="";
 const provider=new YouTubeTimedTextProvider({fetch:async(url)=>{requested=String(url); return new Response(JSON.stringify({events:[{tStartMs:100,dDurationMs:800,segs:[{utf8:" 안녕"},{utf8:"하세요"}]}]}));}});
 const track=(await new YouTubeTimedTextProvider({fetch:async()=>new Response('<track lang_code="ko" vss_id=".ko"/>')}).listTracks("video"))[0];
 const segments=await provider.fetchTrack("video",track.id);
 assert.deepEqual(segments,[{text:" 안녕하세요",startTimeMs:100,endTimeMs:900}]);
 assert.match(requested,/lang=ko/); assert.match(requested,/fmt=json3/); assert.match(requested,/vss_id/);
});
test("timed-text provider exposes rate-limit and malformed-response failures", async()=> {
 const limited=new YouTubeTimedTextProvider({fetch:async()=>new Response("",{status:429})});
 await assert.rejects(()=>limited.listTracks("video"),/rate limited/);
 const malformed=new YouTubeTimedTextProvider({fetch:async()=>new Response("not-json")});
 const track=encodeURIComponent(JSON.stringify({languageCode:"ko",kind:"manual"}));
 await assert.rejects(()=>malformed.fetchTrack("video",track),/invalid transcript response/);
});
test("falls back to caption tracks embedded in the watch page", async()=> {
 let requestCount=0;
 const watchPage='<script>var ytInitialPlayerResponse = {"captions":{"playerCaptionsTracklistRenderer":{"captionTracks":[{"baseUrl":"https://www.youtube.com/api/timedtext?v=video%26lang=ko","languageCode":"ko","name":{"simpleText":"Korean"}}]}}};</script>';
 const provider=new YouTubeTimedTextProvider({fetch:async(url)=>{
   requestCount+=1;
   if (requestCount===1) return new Response("");
   assert.equal(String(url),"https://www.youtube.com/watch?v=video");
   return new Response(watchPage);
 }});
 const tracks=await provider.listTracks("video");
 assert.equal(tracks.length,1);
 assert.equal(tracks[0].languageCode,"ko");
 assert.equal(tracks[0].kind,"manual");
});

test("timed-text provider falls back to get_panel when timedtext returns empty", async() => {
  let requests = [];
  const mockWatchPage = `
    <script>
      var ytInitialPlayerResponse = {
        "captions": {
          "playerCaptionsTracklistRenderer": {
            "captionTracks": [
              {
                "baseUrl": "https://www.youtube.com/api/timedtext?v=video&lang=ko",
                "languageCode": "ko"
              }
            ]
          }
        }
      };
    </script>
    <script>
      ytcfg.set({
        "INNERTUBE_API_KEY": "test_api_key",
        "clientVersion": "test_client_version"
      });
    </script>
    <div>"tag":"PAmodern_transcript_view"</div>
    <div>"params":"test_panel_params"</div>
  `;

  const mockGetPanelResponse = {
    content: {
      engagementPanelSectionListRenderer: {
        content: {
          sectionListRenderer: {
            contents: [
              {
                itemSectionRenderer: {
                  contents: [
                    {
                      macroMarkersPanelItemViewModel: {
                        item: {
                          timelineItemViewModel: {
                            contentItems: [
                              {
                                transcriptSegmentViewModel: {
                                  simpleText: "안녕하세요",
                                  timestamp: "0:02"
                                }
                              }
                            ]
                          }
                        }
                      }
                    },
                    {
                      macroMarkersPanelItemViewModel: {
                        item: {
                          timelineItemViewModel: {
                            contentItems: [
                              {
                                transcriptSegmentViewModel: {
                                  simpleText: "반갑습니다",
                                  timestamp: "0:05"
                                }
                              }
                            ]
                          }
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  };

  const provider = new YouTubeTimedTextProvider({
    fetch: async (url, options) => {
      const urlStr = String(url);
      requests.push({ url: urlStr, method: options?.method || "GET", body: options?.body });

      if (urlStr.includes("api/timedtext")) {
        // Return empty response to trigger fallback
        return new Response("");
      }
      if (urlStr.includes("youtube.com/watch")) {
        return new Response(mockWatchPage);
      }
      if (urlStr.includes("get_panel")) {
        return new Response(JSON.stringify(mockGetPanelResponse));
      }
      return new Response("", { status: 404 });
    }
  });

  const track = (await provider.listTracks("video"))[0];
  const segments = await provider.fetchTrack("video", track.id);

  assert.equal(segments.length, 2);
  assert.equal(segments[0].text, "안녕하세요");
  assert.equal(segments[0].startTimeMs, 2000);
  assert.equal(segments[0].endTimeMs, 5000); // from next segment
  assert.equal(segments[1].text, "반갑습니다");
  assert.equal(segments[1].startTimeMs, 5000);
  assert.equal(segments[1].endTimeMs, 10000); // fallback (+5000)

  // Verify the requests made
  const postRequest = requests.find(r => r.method === "POST" && r.url.includes("get_panel"));
  assert.ok(postRequest);
  assert.match(postRequest.url, /key=test_api_key/);
  const payload = JSON.parse(postRequest.body);
  assert.equal(payload.panelId, "PAmodern_transcript_view");
  assert.equal(payload.params, "test_panel_params");
  assert.equal(payload.context.client.clientVersion, "test_client_version");
});
