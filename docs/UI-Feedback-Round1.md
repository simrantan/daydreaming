# UI Feedback — Round 1

Captured from first live test of the MVP build.

---

## Feedback items

### 1. Filter/slider icon placement
The filter icon (options-outline) should be repositioned to sit parallel to the heart button — i.e. in the same top-right overlay area on the video card, not in the header bar. The current pairing of a heart and a separate save button is confusing; remove the redundancy and consolidate controls in one zone.

**Affected files:** `components/explore/VideoCard.tsx`, `app/(tabs)/index.tsx`

---

### 2. Mood & theme picker on first open
When the user opens the app for the first time (no saved preferences), the `MoodThemePicker` sheet should automatically pop up so they can select their video mood and theme before the feed loads. On subsequent opens, load the persisted preference silently.

**Affected files:** `app/(tabs)/index.tsx`, `components/explore/MoodThemePicker.tsx`

---

### 3. Saved tab icon — change to heart
The Saved tab in the tab bar currently uses a bookmark icon. Change it to a heart (`heart` / `heart-outline`) to visually match the heart save button on the video card.

**Affected files:** `app/(tabs)/_layout.tsx`

---

### 4. Background color — change to black
The app background (header bar and any screen backgrounds) is currently white. Change all backgrounds to black (`#000`) to match the dark immersive feel of the video feed.

**Affected files:** `app/(tabs)/index.tsx` (header), `app/(tabs)/saved.tsx`, `app/(tabs)/_layout.tsx` (tab bar background)

---

### 5. Slider interaction bug — fix smooth dragging
The mood slider in `MoodThemePicker` bugs out on touch and does not slide smoothly. The current PanResponder implementation using `locationX` is unreliable when the touch moves outside the track. Needs to be rewritten using the gesture's absolute position delta (`dx`) relative to the touch start so it tracks the thumb correctly regardless of where on the track the user starts.

**Affected files:** `components/explore/MoodThemePicker.tsx`

---

### 6. Save flow — consolidate into heart button with multi-select options
The current UI has three separate save controls (heart for DD, bookmark for video, music note for music) which is unclear. Replace all three with a single heart button. When pressed, it opens a bottom sheet with three checkboxes:

- [ ] Save this Daydream (video + music pair)
- [ ] Save the Video
- [ ] Save the Music

The user can check any combination. A **Save** button at the bottom of the sheet commits all checked options. Unchecking and saving again removes those items.

The music-note icon in the SongBar and the video bookmark icon on VideoCard should both be removed.

**Affected files:** `components/explore/VideoCard.tsx`, `components/explore/SongBar.tsx`, `app/(tabs)/index.tsx`
**New file:** `components/explore/SaveOptionsSheet.tsx`

---

### 7. Remove the "Add" tab
The Add tab is a placeholder and adds visual noise. Remove it from the tab bar entirely for now.

**Affected files:** `app/(tabs)/_layout.tsx`

---

### 8. Song bar — taller, bigger font, scrolling text
The SongBar at the bottom of each video is too small. Changes needed:
- Increase bar height
- Increase font size for song title and artist
- If the text is too wide to fit, animate it scrolling horizontally within the container (marquee-style) rather than truncating with ellipsis

**Affected files:** `components/explore/SongBar.tsx`

---

## Summary table

| # | Change | Priority | Files |
|---|--------|----------|-------|
| 1 | Move filter icon to video overlay, remove redundant save button | High | `VideoCard.tsx`, `index.tsx` |
| 2 | Auto-open MoodThemePicker on first launch | High | `index.tsx` |
| 3 | Saved tab icon → heart | Low | `_layout.tsx` |
| 4 | Background → black everywhere | Medium | `index.tsx`, `saved.tsx`, `_layout.tsx` |
| 5 | Fix slider smooth drag | High | `MoodThemePicker.tsx` |
| 6 | Consolidate saves into heart + SaveOptionsSheet | High | `VideoCard.tsx`, `SongBar.tsx`, `index.tsx`, new `SaveOptionsSheet.tsx` |
| 7 | Remove Add tab | Low | `_layout.tsx` |
| 8 | SongBar taller + bigger font + scrolling text | Medium | `SongBar.tsx` |
