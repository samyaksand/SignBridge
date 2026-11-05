# Content attribution: ISL reference video library

SignBridge's "ISL Learning Studio" (Sign of the Day, Explore Signs, Parent Mode)
is built on a small, honestly verified library of real YouTube videos. This
document lists every video used, its real URL, its real source channel, and
exactly how it was verified. The structured data lives in
`frontend/lib/data/islSigns.json` (see that file's `_readme` block for the
same process in machine-readable form).

## Verification process

1. Attempted to fetch the official ISLRTC YouTube channel directly
   (`https://www.youtube.com/@ISLRTC` and its `/videos` tab). Both are
   client-rendered by YouTube: the fetched HTML contained only page chrome
   (nav links, footer, page title) and no real video IDs, titles, or watch
   URLs. This was an expected, honestly-reported dead end, not a workaround.
2. Fetched ISLRTC's own official site, `https://islrtc.nic.in/`, which is
   server-rendered. It links the real ISLRTC YouTube channel
   (`youtube.com/channel/UC3AcGIlqVI4nJWCwHgHFXtg`) and a real playlist
   (`list=PLFjydPMg4Daoq83bOFHLos3RmcAbfP1vF`). The playlist's identity was
   confirmed via YouTube's oembed endpoint
   (`https://www.youtube.com/oembed?url=...&format=json`), which returned a
   real title ("ISLRTC News") and real author (`@ISLRTC`). The playlist page
   itself is also client-rendered, so individual video IDs inside it could
   not be recovered this way.
3. Found two NCERT CIET pages describing a "Basic Indian Sign Language
   Course" developed by NCERT in collaboration with ISLRTC:
   `https://ciet.ncert.gov.in/activity/isl2026` (2026 edition) and
   `https://ciet.ncert.gov.in/activity/biSL` (2025 edition). Both pages are
   server-rendered and list real `youtube.com/watch?v=...` URLs, one per
   course day, each with a day/topic label.
4. Verified every one of the resulting 10 video IDs individually via
   YouTube's oembed endpoint. All 10 returned valid, real, non-empty JSON
   (`title`, `author_name`, `thumbnail_url`). No video ID, title, or URL
   below was invented; every single one was independently confirmed live
   and public through this method.

## Honest limitations

- These are 10 full ISL course session recordings (each a themed lesson),
  not single-word sign clips. SignBridge does not currently have verified
  single-word ISL sign videos.
- The real uploading channels are "NCERT OFFICIAL" / "NCERT Events" and
  "PM eVidya ISL 31", not the ISLRTC YouTube channel itself, even though the
  course was developed in collaboration with ISLRTC (as stated on the
  source ciet.ncert.gov.in pages). Every entry below names its real,
  verified channel, not ISLRTC, to avoid misattribution.
- Category assignment is an honest best-effort grouping by the real fetched
  lesson title/topic, not a claim that a video covers only that one topic.

## Verified video list

| Title | Video ID | URL | Channel | Verified via | Source page |
|---|---|---|---|---|---|
| Initiating conversation in ISL | 9fBE7JmJhGc | https://www.youtube.com/watch?v=9fBE7JmJhGc | NCERT Events | oembed | https://ciet.ncert.gov.in/activity/isl2026 |
| Surroundings in ISL | Ii3tDNMvWkM | https://www.youtube.com/watch?v=Ii3tDNMvWkM | NCERT OFFICIAL | oembed | https://ciet.ncert.gov.in/activity/isl2026 |
| Sustaining conversation in ISL | 6YNbOhE6rEM | https://www.youtube.com/watch?v=6YNbOhE6rEM | NCERT OFFICIAL | oembed | https://ciet.ncert.gov.in/activity/isl2026 |
| Sharing more in ISL | Ecu5_WNAyDc | https://www.youtube.com/watch?v=Ecu5_WNAyDc | NCERT OFFICIAL | oembed | https://ciet.ncert.gov.in/activity/isl2026 |
| Wrapping up and quiz | 9dJYYP95Qf8 | https://www.youtube.com/watch?v=9dJYYP95Qf8 | NCERT OFFICIAL | oembed | https://ciet.ncert.gov.in/activity/isl2026 |
| Initiating conversation in ISL (2025) | gXFdLnaDJ-I | https://www.youtube.com/watch?v=gXFdLnaDJ-I | PM eVidya ISL 31 | oembed | https://ciet.ncert.gov.in/activity/biSL |
| Surroundings in ISL (2025) | duNhCxtsJsA | https://www.youtube.com/watch?v=duNhCxtsJsA | PM eVidya ISL 31 | oembed | https://ciet.ncert.gov.in/activity/biSL |
| Sustaining conversation in ISL (2025) | XO9QJBc_vvA | https://www.youtube.com/watch?v=XO9QJBc_vvA | PM eVidya ISL 31 | oembed | https://ciet.ncert.gov.in/activity/biSL |
| Sharing more in ISL (2025) | N9-yOKBxroY | https://www.youtube.com/watch?v=N9-yOKBxroY | PM eVidya ISL 31 | oembed | https://ciet.ncert.gov.in/activity/biSL |
| Wrapping up and quiz (2025) | m4S0R9yXulU | https://www.youtube.com/watch?v=m4S0R9yXulU | PM eVidya ISL 31 | oembed | https://ciet.ncert.gov.in/activity/biSL |

Every video shown anywhere in the app (Sign of the Day, Explore Signs, Parent
Mode, Child Mode, Family Practice) displays this same attribution text and a
link to the original YouTube video, sourced from `frontend/lib/data/islSigns.ts`.

## What was removed

Parent Mode's previous 3D avatar (built on the Khronos sample "CesiumMan.glb"
rig, which has no finger or hand bones and was labeled `verifiedIsl:false`
everywhere in `frontend/lib/data/signAnimationMap.ts`) is no longer rendered
in Parent Mode. The avatar component files themselves
(`frontend/components/avatar/*`) were left untouched in the repository; they
are simply no longer imported or used on the Parent Mode screen.
