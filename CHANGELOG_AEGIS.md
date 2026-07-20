# Aegis Project Permanent Changelog

## Map & Sync Core Updates (Fixed)

1. **MapCN Integration**
   - Map tiles are using MapLibre Style Specification (Carto Positron for Light, Carto Dark Matter for Dark).
   - Admin dashboard \App.tsx\ only displays user real-time location during \	sunamiAlert === true\ (evacuation mode). In normal mode, only shelters are visible.
   - User dashboard \NavigatePage.tsx\ hides evacuation route paths and route options panel during normal mode. Shows routes only during \	sunamiAlert === true\.

2. **Supabase Realtime Broadcast Sync**
   - \useAegisSync.ts\ directly uses \roadcastChannel.send()\ on \setTsunami\ event to guarantee instant synchronization across all connected clients even if the Vercel backend serverless function sleeps or fails.

3. **Dynamic Shelter Management**
   - Shelters in \shelters.ts\ are now dynamically loaded from \localStorage('aegisCustomShelters')\ alongside default hardcoded shelters.
   - Admin has a *Tambah Shelter* modal UI in \App.tsx\ to append custom shelters to the active map.

