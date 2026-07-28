-- Izinkan penghapusan (DELETE) dari tabel custom_shelters
-- Policy ini menjamin bahwa penghapusan HANYA bisa dilakukan 
-- menggunakan service_role key dari endpoint backend, 
-- dan diblokir jika dilakukan langsung dari client (browser/aplikasi).

CREATE POLICY "allow_delete" ON public.custom_shelters FOR DELETE USING (false);
