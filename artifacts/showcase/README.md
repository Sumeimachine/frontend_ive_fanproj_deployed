# IVE PH showcase

A landscape recording of the live website at https://www.iveph.com/.

## Deliverable

`IVEPH-Showcase.mp4` — Full HD (1920 × 1080), H.264 MP4, 30 fps, silent, with captions and opening/closing titles.

## Featured screens

- Homepage and member portraits
- Interactive 3D member universe
- GrantSor photography, member filter, and full-photo viewer
- YouTube metrics dashboard
- Daily quiz interactions (no quiz submitted)
- IVE Night: Backstage Panic lobby (no game or multiplayer room started)

Login was completed before recording. The test account name is covered in the header, and the card-game display field uses DIVE. No password, login screen, admin lists, or private account data are featured.

GrantSor photographs retain their on-site credits and original watermarks. The closing title also credits GrantSor and notes permission. This is an independent, non-commercial fan project.

## Re-recording

`record-showcase.js` contains the tour and video overlays. It has no password or authentication token. Run it with the Playwright CLI in an already authenticated temporary test session. Page labels may need updating if the live site changes. The script writes `iveph-showcase-master.webm`; export that source to H.264 MP4 for sharing.

The recording does not change or publish website content. Captions, account-name cover, and title cards are recording overlays only.
