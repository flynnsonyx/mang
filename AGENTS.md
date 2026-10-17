# Architecture rules

- Keep mobile recommendations and settings in one shared swipe panel so a second left swipe replaces content rather than stacking overlays.
- Settings reuse existing local reading and spoiler preferences; dispatch the spoiler preference event so mounted review lists update immediately.